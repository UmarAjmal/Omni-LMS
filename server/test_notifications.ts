/**
 * Notification Endpoint Test Suite
 * Tests all notification endpoints with:
 *   1. A user with ID = 0 (to verify the auth bug fix)
 *   2. A real student account
 *
 * Reports BEFORE vs AFTER fix behavior.
 */
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { pool } from './src/db.js';

const BASE_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// ─── helpers ─────────────────────────────────────────────────────────────────
function makeToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

async function req(method: string, path: string, token: string, body?: object) {
  const headers: any = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
}

// ─── test runner ─────────────────────────────────────────────────────────────
const results: { label: string; pass: boolean; status: number; detail: string }[] = [];

function record(label: string, pass: boolean, status: number, detail: string) {
  results.push({ label, pass, status, detail });
  console.log(`${pass ? '✅' : '❌'} [${status}] ${label} — ${detail}`);
}

async function run() {
  console.log('\n==== NOTIFICATION ENDPOINT TEST ====\n');

  // ── 1. Forge a JWT with id = 0 ─────────────────────────────────────────────
  const zeroIdToken = makeToken({ id: 0, email: 'zero@test.com', role: 'student' });

  // Before fix, every endpoint would return 401 for id=0.
  // After fix, they should NOT return 401 (they may return 200 with empty data,
  // or 403 "not a student" if no student row exists for user_id 0, but never 401).

  // GET /api/notifications — id=0
  {
    const r = await req('GET', '/api/notifications', zeroIdToken);
    const notUnauthorized = r.status !== 401;
    record('GET /api/notifications (id=0)', notUnauthorized, r.status,
      notUnauthorized ? 'Auth check passed (not 401)' : '❌ Still returning 401 — fix not applied');
  }

  // POST /api/notifications/1/read — id=0
  {
    const r = await req('POST', '/api/notifications/1/read', zeroIdToken);
    const notUnauthorized = r.status !== 401;
    record('POST /api/notifications/:id/read (id=0)', notUnauthorized, r.status,
      notUnauthorized ? 'Auth check passed' : 'Still returning 401');
  }

  // POST /api/notifications/read-all — id=0
  {
    const r = await req('POST', '/api/notifications/read-all', zeroIdToken);
    const notUnauthorized = r.status !== 401;
    record('POST /api/notifications/read-all (id=0)', notUnauthorized, r.status,
      notUnauthorized ? 'Auth check passed' : 'Still returning 401');
  }

  // DELETE /api/notifications/1 — id=0
  {
    const r = await req('DELETE', '/api/notifications/1', zeroIdToken);
    const notUnauthorized = r.status !== 401;
    record('DELETE /api/notifications/:id (id=0)', notUnauthorized, r.status,
      notUnauthorized ? 'Auth check passed' : 'Still returning 401');
  }

  // DELETE /api/notifications — id=0
  {
    const r = await req('DELETE', '/api/notifications', zeroIdToken);
    const notUnauthorized = r.status !== 401;
    record('DELETE /api/notifications (id=0)', notUnauthorized, r.status,
      notUnauthorized ? 'Auth check passed' : 'Still returning 401');
  }

  // POST /api/notifications/fcm-token — id=0
  {
    const r = await req('POST', '/api/notifications/fcm-token', zeroIdToken, { token: 'test-fcm-token', device_type: 'web' });
    const notUnauthorized = r.status !== 401;
    record('POST /api/notifications/fcm-token (id=0)', notUnauthorized, r.status,
      notUnauthorized ? 'Auth check passed' : 'Still returning 401');
  }

  // ── 2. Real student account tests ──────────────────────────────────────────
  console.log('\n--- Real student account tests ---\n');

  // Login as student
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dev.umarsaleem4@gmail.com', password: 'NewPassword@123' })
  });
  const loginJson: any = await loginRes.json();

  if (!loginJson.success) {
    console.log('⚠️  Student login failed. Trying Password@123...');
    const loginRes2 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dev.umarsaleem4@gmail.com', password: 'Password@123' })
    });
    const loginJson2: any = await loginRes2.json();
    if (!loginJson2.success) {
      console.log('⚠️  Student not found — cannot run real account tests. Skipping.');
    } else {
      await runStudentTests(loginJson2.token, loginJson2.user?.id);
    }
  } else {
    await runStudentTests(loginJson.token, loginJson.user?.id);
  }

  // ── 3. Full E2E workflow ───────────────────────────────────────────────────
  console.log('\n--- E2E workflow (Admin triggers events) ---\n');
  await runE2EWorkflow();

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n==== FINAL REPORT ====');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  results.forEach(r => console.log(`  ${r.pass ? '✅' : '❌'} ${r.label}`));
  console.log(`\nTotal: ${results.length} tests | PASS: ${passed} | FAIL: ${failed}`);

  pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

async function runStudentTests(token: string, userId: number) {
  // GET /api/notifications
  {
    const r = await req('GET', '/api/notifications', token);
    record('GET /api/notifications (real student)', r.status === 200 && r.json.success, r.status,
      r.json.success ? `${r.json.data?.length} notifications, unread: ${r.json.unreadCount}` : JSON.stringify(r.json));
  }

  // POST /api/notifications/read-all
  {
    const r = await req('POST', '/api/notifications/read-all', token);
    record('POST /api/notifications/read-all (real student)', r.status === 200, r.status, JSON.stringify(r.json));
  }

  // POST /api/notifications/fcm-token
  {
    const r = await req('POST', '/api/notifications/fcm-token', token, { token: 'test-token-for-verification', device_type: 'web' });
    record('POST /api/notifications/fcm-token (real student)', r.status === 200, r.status, JSON.stringify(r.json));
  }
}

async function runE2EWorkflow() {
  try {
    // Login admin
    const adminLogin: any = await (await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@omnilearn.com', password: 'password123' })
    })).json();
    if (!adminLogin.success) { console.log('❌ Admin login failed'); return; }
    const adminToken = adminLogin.token;

    // Get the real student by email
    const studentList: any = await (await fetch(`${BASE_URL}/api/students`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })).json();
    const student = studentList.data?.find((s: any) => s.email === 'dev.umarsaleem4@gmail.com');
    if (!student) { console.log('⚠️  Student dev.umarsaleem4@gmail.com not found — skipping E2E'); return; }
    console.log(`Found student ID: ${student.id}`);

    // 1. Assign lead campaign → triggers notification
    const campaign: any = await (await req('POST', '/api/campaigns', adminToken, {
      title: `Notification Fix Verify ${Date.now()}`, description: 'Test',
      platforms: ['LinkedIn'], target_leads: 5, daily_target: 1, priority: 'high',
      deadline: '2027-01-01', student_ids: [student.id]
    })).json;
    record('E2E: Create+Assign Campaign', !!campaign.success, campaign.success ? 200 : 500, JSON.stringify(campaign).slice(0, 120));

    // 2. Create assignment → triggers notification
    const task: any = await (await req('POST', '/api/tasks', adminToken, {
      title: `Verify Fix Task ${Date.now()}`, description: 'Test', courseId: 1, courseLabel: 'Test',
      dueDate: '2027-01-01', points: 50, assignedStudentIds: [student.id]
    })).json;
    record('E2E: Create+Assign Task', !!task.success, task.success ? 200 : 500, JSON.stringify(task).slice(0, 120));

    // 3. Publish announcement → triggers notification
    const ann: any = await (await req('POST', '/api/announcements', adminToken, {
      title: `Verify Fix Announcement ${Date.now()}`, content: 'Test', target_audience: 'all'
    })).json;
    record('E2E: Publish Announcement', !!ann.success, ann.success ? 200 : 500, JSON.stringify(ann).slice(0, 120));

    // Wait for async engines
    await new Promise(r => setTimeout(r, 3000));

    // Verify notifications in DB
    const studentDbRes = await pool.query('SELECT id FROM students WHERE email = $1', [student.email]);
    const studentId = studentDbRes.rows[0]?.id;
    if (studentId) {
      const notifRes = await pool.query(
        `SELECT n.title, n.type, nr.is_read FROM notifications n
         JOIN notification_recipients nr ON nr.notification_id = n.id
         WHERE nr.student_id = $1 ORDER BY n.created_at DESC LIMIT 10`,
        [studentId]
      );
      record('E2E: Notifications in DB', notifRes.rows.length > 0, 200,
        `${notifRes.rows.length} notifications found: ${notifRes.rows.map((r: any) => r.title).join(', ')}`);
    }

    // Verify email queue
    const emailRes = await pool.query(
      `SELECT subject, status FROM email_queue WHERE recipient = $1 ORDER BY id DESC LIMIT 5`,
      [student.email]
    );
    record('E2E: Emails in queue', emailRes.rows.length > 0, 200,
      `${emailRes.rows.length} emails: ${emailRes.rows.map((r: any) => `${r.subject} [${r.status}]`).join(', ')}`);

  } catch (err: any) {
    console.error('E2E error:', err.message);
  }
}

run().catch(console.error);
