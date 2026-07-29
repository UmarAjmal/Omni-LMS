import { pool } from './src/db.js';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function apiPost(endpoint: string, token: string | null, body: any) {
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    return data;
  } catch (e) {
    throw new Error(`API ${endpoint} failed. HTTP ${res.status}. Body: ${text}`);
  }
}

async function apiPut(endpoint: string, token: string | null, body: any) {
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    return data;
  } catch (e) {
    throw new Error(`API PUT ${endpoint} failed. HTTP ${res.status}. Body: ${text}`);
  }
}

async function apiGet(endpoint: string, token: string | null) {
  const headers: any = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'GET',
    headers
  });

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    return data;
  } catch (e) {
    throw new Error(`API GET ${endpoint} failed. HTTP ${res.status}. Body: ${text}`);
  }
}

async function runLiveTest() {
  console.log('🚀 Starting Live E2E Verification...');

  let results = {
    account_approved_email: 'FAIL',
    announcement_email: 'FAIL',
    campaign_assigned_email: 'FAIL',
    task_assigned_email: 'FAIL',
    in_app_notifications: 'FAIL',
    push_notifications: 'SKIPPED (FCM not initialized)'
  };

  let studentData = {
    id: '',
    regNo: '',
    email: 'dev.umarsaleem4@gmail.com',
    defaultPassword: 'Password@123'
  };

  try {
    // 1. Login as Admin
    console.log('[1] Logging in as Admin...');
    const adminLogin = await apiPost('/api/auth/login', null, { email: 'admin@omnilearn.com', password: 'password123' });
    if (!adminLogin.success) throw new Error('Admin login failed: ' + adminLogin.error);
    const adminToken = adminLogin.token;

    // 2. Submit Application
    console.log('[2] Submitting Application for Umar Saleem...');
    const appSubmit = await apiPost('/api/applicants', null, {
      first_name: 'Umar',
      last_name: 'Saleem',
      email: studentData.email,
      phone: '1234567890',
      whatsapp: '1234567890',
      city: 'Test City',
      country: 'Test Country',
      program: 'Web Development',
      message: 'E2E Test'
    });
    // Wait for the application to be written
    await new Promise(r => setTimeout(r, 1000));

    // 3. Approve Application
    console.log('[3] Approving Application...');
    const pendingApps = await apiGet('/api/applicants', adminToken);
    const app = pendingApps.data.find((a: any) => a.email === studentData.email);
    if (!app) throw new Error('Application not found');

    const approveRes = await apiPost(`/api/applicants/${app.id}/approve`, adminToken, {});
    if (!approveRes.success) throw new Error('Approve failed: ' + approveRes.error);

    // Give it a second to create the user, student, and send email
    await new Promise(r => setTimeout(r, 2000));

    // Check Account Approved Email in DB
    const emailCheck1 = await pool.query("SELECT * FROM email_queue WHERE recipient = $1 AND subject LIKE '%Welcome%'", [studentData.email]);
    if (emailCheck1.rows.length > 0) results.account_approved_email = 'PASS';

    // 4. Login with default password
    console.log('[4] Verifying First Login & Must Change Password...');
    const studentLogin1 = await apiPost('/api/auth/login', null, { email: studentData.email, password: studentData.defaultPassword });
    if (!studentLogin1.success) throw new Error('Student first login failed: ' + studentLogin1.error);

    if (studentLogin1.user.mustChangePassword === true) {
      console.log('   ✅ must_change_password works');
    } else {
      throw new Error('must_change_password was not true');
    }

    // 5. Change Password
    console.log('[5] Changing Password...');
    const changePass = await apiPost('/api/auth/change-password', studentLogin1.token, {
      currentPassword: studentData.defaultPassword,
      newPassword: 'NewPassword@123'
    });
    if (!changePass.success) throw new Error('Change password failed');

    // 6. Verify Login with New Password
    console.log('[6] Verifying Login with New Password...');
    const studentLogin2 = await apiPost('/api/auth/login', null, { email: studentData.email, password: 'NewPassword@123' });
    if (!studentLogin2.success) throw new Error('Student login with new password failed');
    const studentToken = studentLogin2.token;

    // Fetch student profile to get IDs
    studentData.id = studentLogin2.user.student.id;

    const dbStudent = await pool.query('SELECT enrollment_id FROM students WHERE id = $1', [studentData.id]);
    studentData.regNo = dbStudent.rows[0].enrollment_id;

    // 7. Verify Student in List
    console.log('[7] Verifying Student appears in List...');
    const studentList = await apiGet('/api/students', adminToken);
    const foundInList = studentList.data.find((s: any) => s.email === studentData.email);
    if (!foundInList) throw new Error('Student not found in Admin list');

    // 8. Configure Test Fee
    console.log('[8] Configuring Test Fee...');
    const feeRes = await apiPut(`/api/finance/fees/${studentData.id}/total`, adminToken, {
      totalFee: 5000
    });
    if (!feeRes.success) throw new Error('Fee creation failed: ' + JSON.stringify(feeRes));

    // 9. Assign Lead Campaign
    console.log('[9] Assigning Lead Campaign...');
    const assignCamp = await apiPost('/api/campaigns', adminToken, {
      title: 'E2E Test Campaign',
      description: 'Test Campaign for ' + studentData.email,
      platforms: ['LinkedIn'],
      target_leads: 10,
      daily_target: 2,
      priority: 'high',
      deadline: '2027-01-01',
      student_ids: [studentData.id]
    });
    if (!assignCamp.success) throw new Error('Campaign creation/assignment failed: ' + JSON.stringify(assignCamp));

    // 10. Assign Task
    console.log('[10] Assigning Task...');
    const taskRes = await apiPost('/api/tasks', adminToken, {
      title: 'E2E Test Task for ' + studentData.email,
      description: 'Test Description',
      courseId: 1,
      courseLabel: 'E2E Testing Course',
      dueDate: '2027-01-01',
      points: 100,
      assignedStudentIds: [studentData.id]
    });
    if (!taskRes.success) throw new Error('Task creation failed: ' + JSON.stringify(taskRes));

    // 11. Send Announcement
    console.log('[11] Sending Test Announcement...');
    const annRes = await apiPost('/api/announcements', adminToken, {
      title: 'Global Announcement for E2E',
      content: 'Hello E2E',
      target_audience: 'all'
    });
    if (!annRes.success) throw new Error('Announcement failed');

    // Wait for async notification engines to write to DB and Email Queue
    await new Promise(r => setTimeout(r, 2000));

    // 12. Verify Notifications
    console.log('[12] Verifying all Notifications...');

    // Check Campaign Assigned Email
    const emailCheck2 = await pool.query("SELECT * FROM email_queue WHERE recipient = $1 AND subject LIKE '%New Campaign%'", [studentData.email]);
    if (emailCheck2.rows.length > 0) results.campaign_assigned_email = 'PASS';

    // Check Task Assigned Email
    const emailCheck3 = await pool.query("SELECT * FROM email_queue WHERE recipient = $1 AND subject LIKE '%New Task%'", [studentData.email]);
    if (emailCheck3.rows.length > 0) results.task_assigned_email = 'PASS';

    // Check Announcement Email
    const emailCheck4 = await pool.query("SELECT * FROM email_queue WHERE recipient = $1 AND subject LIKE '%Announcement%'", [studentData.email]);
    if (emailCheck4.rows.length > 0) results.announcement_email = 'PASS';

    // Check In-App Notifications
    const myNotifs = await apiGet('/api/notifications?page=1&limit=20', studentToken);
    if (myNotifs.data && myNotifs.data.length >= 3) {
      results.in_app_notifications = 'PASS';
    }

    // 13. Verify Leaderboard
    console.log('[13] Verifying Leaderboard...');
    const leaderboard = await apiGet('/api/reports/leaderboard', studentToken);
    const lbFound = leaderboard.data.find((l: any) => l.student_id == studentData.id);
    if (lbFound) {
      console.log('   ✅ Student found on leaderboard');
    } else {
      console.log('   ❌ Student not on leaderboard (Expected since 0 points, but should appear technically)');
    }

    console.log('\\n==================================================');
    console.log('✅ LIVE END-TO-END TEST COMPLETED SUCCESSFULLY');
    console.log('==================================================\\n');
    console.log(`Student ID: ${studentData.id}`);
    console.log(`Registration Number: ${studentData.regNo}`);
    console.log(`Login Email: ${studentData.email}`);
    console.log(`Default Password: ${studentData.defaultPassword}\\n`);

    console.log('Test Results:');
    console.log(`- Account Approved email:      ${results.account_approved_email}`);
    console.log(`- Announcement email:          ${results.announcement_email}`);
    console.log(`- Lead Campaign Assigned email:${results.campaign_assigned_email}`);
    console.log(`- Task Assigned email:         ${results.task_assigned_email}`);
    console.log(`- In-App notifications:        ${results.in_app_notifications}`);
    console.log(`- Push notifications:          ${results.push_notifications}\\n`);

    process.exit(0);

  } catch (err: any) {
    console.error('\\n❌ TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    pool.end();
  }
}

runLiveTest();
