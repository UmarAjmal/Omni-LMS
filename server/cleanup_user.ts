import { pool } from './src/db.js';

async function cleanup() {
  try {
    const email = 'dev.umarsaleem4@gmail.com';
    const res = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (res.rows.length > 0) {
      const userId = res.rows[0].id;
      const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
      if (studentRes.rows.length > 0) {
        const studentId = studentRes.rows[0].id;
        await pool.query('DELETE FROM notification_recipients WHERE student_id = $1', [studentId]);
        await pool.query('DELETE FROM students WHERE id = $1', [studentId]);
      }
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    await pool.query('DELETE FROM applicants WHERE email = $1', [email]);
    await pool.query('DELETE FROM email_queue WHERE recipient = $1', [email]);
    console.log('Cleaned up user dev.umarsaleem4@gmail.com');
  } catch (err) {
    console.error('Cleanup failed:', err);
  } finally {
    pool.end();
  }
}
cleanup();
