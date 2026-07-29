import { pool } from './src/db.js';

async function run() {
  try {
    const recipients = ['21'];
    const emailsQuery = `
      SELECT s.id, u.email 
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ANY($1)
    `;
    const { rows: students } = await pool.query(emailsQuery, [recipients]);
    console.log('Students:', students);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
