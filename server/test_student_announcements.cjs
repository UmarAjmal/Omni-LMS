const API_BASE = 'http://localhost:5000/api';

async function testStudentAnnouncements() {
  console.log("Starting Student Announcements Fetch Test...");

  // 1. Submit Application & Approve to get a fresh student token
  const timestamp = Date.now();
  const studentEmail = `student_${timestamp}@test.com`;
  console.log(`\n1. Creating new student...`);
  
  const applyRes = await fetch(`${API_BASE}/training-applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test Student',
      fatherName: 'Test Father',
      cnic: `42101-${Math.floor(Math.random() * 9000000) + 1000000}-1`,
      age: '22',
      whatsapp: '03001234567',
      gmail: studentEmail,
      universityName: 'NUST',
      department: 'CS',
      semester: '6',
      tracks: ['fullstack-ai'],
      referenceCode: ''
    })
  });
  
  const applyData = await applyRes.json();
  const applicantId = applyData.data.id;

  // Admin Login to approve
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin', password: 'admin123' })
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token;

  await fetch(`${API_BASE}/training-applications/${applicantId}/approve`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ note: 'Approved via automation test' })
  });

  // Student Login
  const studentLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: studentEmail, password: 'Password@123' })
  });
  const studentLoginData = await studentLoginRes.json();
  const studentToken = studentLoginData.token;
  console.log(`✅ Logged in as Student. Received token.`);

  // 2. Try Fetching Announcements
  console.log(`\n2. Fetching announcements as student...`);
  const fetchRes = await fetch(`${API_BASE}/announcements`, {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${studentToken}`
    }
  });
  const data = await fetchRes.json();
  
  if (data.success && Array.isArray(data.data)) {
    console.log(`✅ Success! Retrieved ${data.data.length} announcements.`);
    console.log(data.data);
  } else {
    console.error("❌ Failed to fetch announcements:", data);
  }

  console.log(`\n🎉 Testing complete!`);
}

testStudentAnnouncements();
