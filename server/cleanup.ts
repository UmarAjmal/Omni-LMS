import { pool } from './src/db.js';
async function clean() {
  await pool.query("DELETE FROM users WHERE email = 'dev.umarsaleem4@gmail.com'");
  await pool.query("DELETE FROM applicants WHERE email = 'dev.umarsaleem4@gmail.com'");
  console.log('Cleaned');
  process.exit(0);
}
clean();
