const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  try {
    const res = await pool.query(`SELECT id, title, target FROM announcements`);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
})();
