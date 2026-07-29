import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function testSMTP() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Falcon Swift LMS" <${process.env.SMTP_USER}>`,
      to: 'dev.umarsaleem4@gmail.com',
      subject: 'SMTP Test Port 587',
      text: 'Test',
    });
    console.log('✅ SMTP TEST 587 SUCCESS', info.messageId);
  } catch (error: any) {
    console.error('❌ SMTP TEST 587 FAILED:', error.message);
  }
}
testSMTP();
