const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  try {
    const res = await pool.query(`
      INSERT INTO announcements (title, content, author_id, author_name, role, target)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, ['Test Null', 'Content', null, 'Admin', 'admin', 'all']);
    console.log("Success null:", res.rows[0]);
  } catch (err) {
    console.error("Error inserting null:", err);
  }

  try {
    const res = await pool.query(`
      INSERT INTO announcements (title, content, author_id, author_name, role, target)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, ['Test Zero', 'Content', 0, 'Admin', 'admin', 'all']);
    console.log("Success zero:", res.rows[0]);
  } catch (err) {
    console.error("Error inserting 0:", err);
  }

  process.exit(0);
})();
