const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  const users = await pool.query("SELECT * FROM users WHERE role='student' LIMIT 1");
  if (users.rows.length === 0) return console.log("No student users found");
  const user = users.rows[0];
  const students = await pool.query("SELECT * FROM students WHERE user_id=$1", [user.id]);
  if (students.rows.length === 0) return console.log("No student profile found");
  const student = students.rows[0];
  
  console.log("User ID:", user.id, typeof user.id);
  console.log("Student ID:", student.id, typeof student.id);
  console.log("Student User_ID:", student.user_id, typeof student.user_id);
  
  console.log("Test condition:", student.user_id !== user.id);
  process.exit(0);
})();
