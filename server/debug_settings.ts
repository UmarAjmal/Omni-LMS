import { pool } from './src/db.js';

async function run() {
  try {
    const res = await pool.query('SELECT settings FROM admin_settings ORDER BY id DESC LIMIT 1');
    console.log('Admin settings:', JSON.stringify(res.rows[0]?.settings, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
