import { pool } from './src/db.js';

async function check() {
  try {
    const res = await pool.query(`
      SELECT n.title, n.category
      FROM notification_recipients nr
      JOIN notifications n ON n.id = nr.notification_id
      WHERE nr.student_id = 21
    `);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
check();
