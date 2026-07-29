const { Pool } = require('pg');
require('dotenv').config({ path: '/Users/umarsaleem/Documents/OmniLearn.LMS/server/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const cs = await pool.query("SELECT * FROM campaign_students");
    console.log("Campaign Students:");
    console.table(cs.rows);

    const st = await pool.query("SELECT id, user_id, first_name, last_name FROM students WHERE id IN (SELECT student_id FROM campaign_students)");
    console.log("Students with campaigns:");
    console.table(st.rows);

    const us = await pool.query("SELECT id, email, role FROM users WHERE id IN (SELECT user_id FROM students WHERE id IN (SELECT student_id FROM campaign_students))");
    console.log("Users of students with campaigns:");
    console.table(us.rows);

  } catch (err) {
    console.error("DB Error:", err.message);
  } finally {
    pool.end();
  }
}

run();
