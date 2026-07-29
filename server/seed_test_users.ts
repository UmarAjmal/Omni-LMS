import { pool } from './src/db.js';
import bcrypt from 'bcryptjs';

async function seedTestUsers() {
  const client = await pool.connect();
  try {
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Admin
    let adminRes = await client.query('SELECT id FROM users WHERE email = $1', ['admin@omnilearn.com']);
    if (adminRes.rows.length === 0) {
      await client.query("INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin')", ['admin@omnilearn.com', passwordHash]);
    } else {
      await client.query("UPDATE users SET password_hash = $1 WHERE email = 'admin@omnilearn.com'", [passwordHash]);
    }

    // 2. Trainer
    let trainerRes = await client.query('SELECT id FROM users WHERE email = $1', ['trainer@omnilearn.com']);
    let trainerUserId;
    if (trainerRes.rows.length === 0) {
      const res = await client.query("INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'trainer') RETURNING id", ['trainer@omnilearn.com', passwordHash]);
      trainerUserId = res.rows[0].id;
    } else {
      trainerUserId = trainerRes.rows[0].id;
      await client.query("UPDATE users SET password_hash = $1 WHERE email = 'trainer@omnilearn.com'", [passwordHash]);
    }

    // 3. Student
    let studentRes = await client.query('SELECT id FROM users WHERE email = $1', ['student@omnilearn.com']);
    let studentUserId;
    if (studentRes.rows.length === 0) {
      const res = await client.query("INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'student') RETURNING id", ['student@omnilearn.com', passwordHash]);
      studentUserId = res.rows[0].id;
      // create student profile
      await client.query("INSERT INTO students (user_id, first_name, last_name, enrollment_id) VALUES ($1, 'Test', 'Student', 'STU-TEST')", [studentUserId]);
    } else {
      studentUserId = studentRes.rows[0].id;
      await client.query("UPDATE users SET password_hash = $1 WHERE email = 'student@omnilearn.com'", [passwordHash]);
    }

    console.log('✅ Test users seeded/updated with password "password123"');
    console.log('Admin:', 'admin@omnilearn.com');
    console.log('Trainer:', 'trainer@omnilearn.com');
    console.log('Student:', 'student@omnilearn.com');
  } catch (error) {
    console.error('Error seeding test users:', error);
  } finally {
    client.release();
    pool.end();
  }
}

seedTestUsers();
