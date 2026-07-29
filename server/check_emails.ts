import { pool } from './src/db.js';
async function run() {
  const res = await pool.query('SELECT subject FROM email_queue ORDER BY created_at DESC LIMIT 5');
  console.log(res.rows);
  process.exit();
}
run();
