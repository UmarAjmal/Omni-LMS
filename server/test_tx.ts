import { pool } from './src/db.js';

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const notifRes = await client.query(`
      INSERT INTO notifications (type, category, title, message)
      VALUES ('test', 'System', 'test', 'test')
      RETURNING id
    `);
    const id = notifRes.rows[0].id;
    console.log('Inserted notification ID:', id);

    await client.query(`
      INSERT INTO notification_recipients (notification_id, student_id)
      VALUES ($1, 21)
    `, [id]);
    console.log('Inserted recipient');
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error:', e);
  } finally {
    client.release();
    pool.end();
  }
}
run();
