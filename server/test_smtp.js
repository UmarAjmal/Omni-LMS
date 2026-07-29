import nodemailer from 'nodemailer';

async function test() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true, // SSL
    auth: {
      user: 'info@falconswift.online',
      pass: 'dvyb-v1bw-0ojv-k7ug'
    }
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP credentials are valid!');
  } catch (err) {
    console.error('❌ SMTP Error:', err.message);
  }
}

test();
