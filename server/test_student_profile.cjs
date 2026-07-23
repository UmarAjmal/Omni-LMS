const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/lms_db' });

async function test() {
  const userRes = await pool.query("SELECT * FROM users WHERE role = 'student' ORDER BY id DESC LIMIT 1");
  if (userRes.rows.length === 0) { console.log("No student users found"); process.exit(0); }
  const user = userRes.rows[0];
  console.log("User:", user);
  const studentRes = await pool.query("SELECT * FROM students WHERE user_id = $1", [user.id]);
  console.log("Student:", studentRes.rows);
  process.exit(0);
}
test();
