const { Pool } = require('pg');
require('dotenv').config({ path: '/Users/umarsaleem/Documents/OmniLearn.LMS/server/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const st = await pool.query("SELECT * FROM students WHERE first_name ILIKE '%ali%' OR last_name ILIKE '%ahmad%'");
    console.log("Students matching ali ahmad:");
    console.table(st.rows);

    if (st.rows.length > 0) {
      const us = await pool.query("SELECT id, email, role, password_hash, must_change_password FROM users WHERE id = $1", [st.rows[0].user_id]);
      console.log("User for ali ahmad:");
      console.table(us.rows);
    }
  } catch (err) {
    console.error("DB Error:", err.message);
  } finally {
    pool.end();
  }
}

run();
