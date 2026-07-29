import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function testSMTP() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Falcon Swift LMS" <${process.env.SMTP_USER}>`,
      to: 'dev.umarsaleem4@gmail.com',
      subject: 'SMTP Test - Real Workflow',
      text: 'This is a test to see if SMTP is enabled.',
      html: '<b>This is a test to see if SMTP is enabled.</b>',
    });
    console.log('✅ SMTP TEST SUCCESS: Message sent', info.messageId);
  } catch (error: any) {
    console.error('❌ SMTP TEST FAILED:', error.message);
  }
}
testSMTP();
