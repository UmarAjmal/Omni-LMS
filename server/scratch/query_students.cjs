const { Pool } = require('pg');
require('dotenv').config({ path: '/Users/umarsaleem/Documents/OmniLearn.LMS/server/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const res = await pool.query("SELECT * FROM students ORDER BY created_at DESC LIMIT 5");
    console.table(res.rows);
  } catch (err) {
    console.error("DB Error:", err.message);
  } finally {
    pool.end();
  }
}

run();
