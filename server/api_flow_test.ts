import fetch from 'node-fetch';
import { pool } from './src/db.js';

const BASE_URL = 'http://localhost:5000';

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!data.success) throw new Error(`Login failed for ${email}: ${data.error}`);
  return data.token;
}

async function apiPost(endpoint, token, body = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!data.success) throw new Error(`POST ${endpoint} failed: ${data.error}`);
    return data;
  } catch(e) {
    console.log(`HTTP Status: ${res.status}`);
    console.error(`API HTML Error Response: ${text.substring(0, 1000)}`);
    throw e;
  }
}

async function apiGet(endpoint, token) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await res.json();
  if (!data.success) throw new Error(`GET ${endpoint} failed: ${data.error}`);
  return data.data || data;
}

async function runTest() {
  console.log('--- STARTING E2E API VERIFICATION ---');

  let adminToken, trainerToken, studentToken;
  let adminId, trainerId, studentId, studentTableId;

  try {
    // 1. Authenticate
    adminToken = await login('admin@omnilearn.com', 'password123');
    trainerToken = await login('trainer@omnilearn.com', 'password123');
    studentToken = await login('student@omnilearn.com', 'password123');
    console.log('✅ PASS: Authenticated Admin, Trainer, and Student successfully (JWT validated)');

    // Fetch IDs
    const client = await pool.connect();
    
    const adminRow = await client.query("SELECT id FROM users WHERE email='admin@omnilearn.com'");
    adminId = adminRow.rows[0].id;

    const trainerRow = await client.query("SELECT id FROM users WHERE email='trainer@omnilearn.com'");
    trainerId = trainerRow.rows[0].id;

    const studentUserRow = await client.query("SELECT id FROM users WHERE email='student@omnilearn.com'");
    studentId = studentUserRow.rows[0].id;

    const studentProfileRow = await client.query("SELECT id FROM students WHERE user_id=$1", [studentId]);
    studentTableId = studentProfileRow.rows[0].id;

    // Create a dummy course for tasks
    const courseRes = await client.query("INSERT INTO courses (title, description, status) VALUES ('Test Course E2E', 'Desc', 'published') RETURNING id");
    const courseId = courseRes.rows[0].id;

    // Clear queues and notifications to cleanly verify
    await client.query("DELETE FROM email_queue WHERE subject LIKE '%E2E%' OR subject LIKE '%Test Task E2E%'");
    await client.query("DELETE FROM notification_recipients");
    await client.query("DELETE FROM notifications WHERE title LIKE '%E2E%'");

    console.log(`Setup complete. Course: ${courseId}, Student DB ID: ${studentTableId}`);
    client.release();

    // ==========================================
    // 1. Admin creates an Assignment
    // ==========================================
    console.log('\\n[TEST 1] Admin Creates Assignment');
    const assignResp = await apiPost('/api/tasks/assign-with-email', adminToken, {
      title: 'Test Task E2E',
      description: 'Please complete this by tomorrow.',
      courseId: courseId,
      courseLabel: 'Test Course E2E',
      points: 100,
      assignedStudentIds: [studentTableId]
    });
    console.log(`- API Response: Created Task ID ${assignResp.data?.id}`);
    
    // Verify Notification Database
    const notifDb1 = await pool.query("SELECT * FROM notifications WHERE title LIKE '%Test Task E2E%'");
    if (notifDb1.rows.length === 0) throw new Error('Notification not created in DB for Assignment');
    const n1_id = notifDb1.rows[0].id;
    console.log(`- ✅ Notification created in DB: ${n1_id}`);

    const recDb1 = await pool.query("SELECT * FROM notification_recipients WHERE notification_id=$1", [n1_id]);
    if (recDb1.rows.length === 0) throw new Error('Notification recipient incorrect: 0 rows found');
    if (String(recDb1.rows[0].student_id) !== String(studentTableId)) {
      throw new Error(`Notification recipient incorrect: expected ${studentTableId}, got ${recDb1.rows[0].student_id}`);
    }
    console.log(`- ✅ Notification recipients correct`);

    const emailDb1 = await pool.query("SELECT * FROM email_queue WHERE subject LIKE '%Test Task E2E%'");
    if (emailDb1.rows.length === 0) throw new Error('Email not queued for Assignment');
    console.log(`- ✅ Email queued successfully`);


    // ==========================================
    // 2. Admin publishes an Announcement
    // ==========================================
    console.log('\\n[TEST 2] Admin Publishes Announcement');
    await apiPost('/api/announcements', adminToken, {
      title: 'Global Announcement E2E',
      content: 'Hello World',
      target: 'all'
    });
    
    const notifDb2 = await pool.query("SELECT * FROM notifications WHERE title LIKE '%Global Announcement E2E%'");
    if (notifDb2.rows.length === 0) throw new Error('Notification not created in DB for Announcement');
    const n2_id = notifDb2.rows[0].id;
    console.log(`- ✅ Notification created in DB: ${n2_id}`);

    const recDb2 = await pool.query("SELECT * FROM notification_recipients WHERE notification_id=$1 AND student_id=$2", [n2_id, studentTableId]);
    if (recDb2.rows.length === 0) throw new Error('Student did not receive Announcement');
    console.log(`- ✅ Notification recipients correct`);


    // ==========================================
    // 3. Admin assigns a Lead Campaign
    // ==========================================
    console.log('\n[TEST 3] Admin Assigns Lead Campaign');
    const campResp = await apiPost('/api/campaigns', adminToken, {
      title: 'Summer Promo E2E',
      target_leads: 10,
      student_ids: [studentTableId]
    });
    const campaignId = campResp.data.id;
    
    const notifDb3 = await pool.query("SELECT * FROM notifications WHERE title LIKE '%Summer Promo E2E%'");
    if (notifDb3.rows.length === 0) throw new Error('Notification not created in DB for Campaign');
    console.log(`- ✅ Notification created in DB`);


    // ==========================================
    // Setup: Student Submits a Lead (for Trainer to approve/reject)
    // ==========================================
    const leadResp = await apiPost('/api/leads', studentToken, {
      campaign_id: campaignId,
      contact_person: 'John Doe E2E',
      business_name: 'Doe Enterprises E2E',
      phone: '1234567890',
      status: 'pending'
    });
    const leadId = leadResp.data.id;
    // Let's create another lead for rejection test
    const leadResp2 = await apiPost('/api/leads', studentToken, {
      campaign_id: campaignId,
      contact_person: 'Jane Doe E2E',
      business_name: 'Jane Corp E2E',
      phone: '0987654321',
      status: 'pending'
    });
    const leadId2 = leadResp2.data.id;


    // ==========================================
    // 4. Trainer Approves a Lead
    // ==========================================
    console.log('\n[TEST 4] Trainer Approves Lead');
    await apiPost(`/api/leads/${leadId}/review`, trainerToken, {
      status: 'approved',
      feedback: 'Good lead E2E',
      points_awarded: 50
    });
    
    const notifDb4 = await pool.query("SELECT * FROM notifications WHERE title LIKE '%Approved: Doe Enterprises E2E%'");
    if (notifDb4.rows.length === 0) throw new Error('Notification not created in DB for Lead Approval');
    console.log(`- ✅ Lead Approval Notification verified`);

    
    // ==========================================
    // 5. Trainer Rejects a Lead
    // ==========================================
    console.log('\n[TEST 5] Trainer Rejects Lead');
    await apiPost(`/api/leads/${leadId2}/review`, trainerToken, {
      status: 'rejected',
      feedback: 'Bad lead E2E',
      points_awarded: 0
    });

    const notifDb5 = await pool.query("SELECT * FROM notifications WHERE title LIKE '%Rejected: Jane Corp E2E%'");
    if (notifDb5.rows.length === 0) throw new Error('Notification not created in DB for Lead Rejection');
    console.log(`- ✅ Lead Rejection Notification verified`);


    // ==========================================
    // 6. Notification Center Endpoints Verification
    // ==========================================
    console.log('\\n[TEST 6] Verifying Notification API functionality for Student UI');
    
    // Fetch notifications
    const myNotifs = await apiGet('/api/notifications?page=1&limit=10', studentToken);
    console.log(`- ✅ Fetched notifications. Found ${myNotifs.length}`);
    if (myNotifs.length < 5) throw new Error('Student is missing expected notifications.');

    // Unread count
    const unread = await apiGet('/api/notifications/unread-count', studentToken);
    console.log(`- ✅ Unread count is ${unread.count}`);
    if (unread.count < 5) throw new Error('Unread count is incorrect');

    // Mark one as read
    const firstNotifId = myNotifs[0].id;
    await apiPost(`/api/notifications/${firstNotifId}/read`, studentToken);
    
    const unreadAfter = await apiGet('/api/notifications/unread-count', studentToken);
    console.log(`- ✅ Marked one as read. New unread count: ${unreadAfter.count}`);
    if (unreadAfter.count !== unread.count - 1) throw new Error('Unread count did not decrement');

    // Mark all as read
    await apiPost(`/api/notifications/read-all`, studentToken);
    const unreadAll = await apiGet('/api/notifications/unread-count', studentToken);
    console.log(`- ✅ Marked all as read. New unread count: ${unreadAll.count}`);
    if (unreadAll.count !== 0) throw new Error('Mark all as read failed');

    console.log('\\n==========================================');
    console.log('✅ ALL VERIFICATION TESTS PASSED');
    console.log('==========================================\\n');

    process.exit(0);

  } catch (err) {
    console.error('\\n❌ TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    pool.end();
  }
}

runTest();
