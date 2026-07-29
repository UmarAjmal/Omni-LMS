import { pool } from '../db.js';
import nodemailer from 'nodemailer';

export const EmailQueueWorker = {
  isRunning: false,

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('✅ Email Queue Worker started.');
    this.processQueue();
  },

  async processQueue() {
    if (!this.isRunning) return;

    try {
      const client = await pool.connect();

      // 1. Fetch Admin Settings to see if email is globally enabled + get SMTP config
      const settingsRes = await client.query('SELECT settings FROM admin_settings ORDER BY id DESC LIMIT 1');
      const adminSettings = settingsRes.rows.length > 0 ? settingsRes.rows[0].settings : {};

      const emailEnabled = adminSettings.emailEnabled !== false;

      // 2. Fetch the next pending email that is scheduled for now or in the past
      const { rows } = await client.query(`
        SELECT * FROM email_queue 
        WHERE status = 'pending' AND scheduled_for <= NOW()
        ORDER BY scheduled_for ASC
        LIMIT 1
      `);

      if (rows.length === 0 || !emailEnabled) {
        // No emails to process or email disabled globally, wait 2 seconds and check again
        client.release();
        setTimeout(() => this.processQueue(), 2000);
        return;
      }

      const email = rows[0];

      // Mark as processing
      await client.query(`UPDATE email_queue SET status = 'processing' WHERE id = $1`, [email.id]);
      client.release();

      // Send the email
      let smtpHost = process.env.SMTP_HOST || adminSettings.smtp?.host;
      let smtpPort = process.env.SMTP_PORT || adminSettings.smtp?.port;
      let smtpUser = process.env.SMTP_USER || adminSettings.smtp?.user;
      let smtpPass = process.env.SMTP_PASS || adminSettings.smtp?.pass;

      let success = false;

      if (!smtpHost || !smtpUser || !smtpPass) {
        console.warn('⚠️ SMTP not configured (.env or admin_settings). Email failed.');
      } else {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: Number(smtpPort) || 587,
            secure: Number(smtpPort) === 465, // SSL for 465, TLS for 587
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          });

          await transporter.sendMail({
            from: `"Falcon Swift Team" <${process.env.ADMIN_EMAIL || smtpUser}>`,
            to: email.recipient,
            subject: email.subject,
            html: email.body,
          });

          success = true;
          console.log(`📧 Email sent successfully to ${email.recipient} (Queue ID: ${email.id})`);
        } catch (error: any) {
          console.error(`❌ Failed to send email to ${email.recipient}:`, error.message);
        }
      }

      // Update status based on success
      const updateClient = await pool.connect();
      if (success) {
        await updateClient.query(`UPDATE email_queue SET status = 'sent' WHERE id = $1`, [email.id]);
      } else {
        const newRetryCount = email.retry_count + 1;
        if (newRetryCount >= 3) {
          await updateClient.query(`UPDATE email_queue SET status = 'failed', retry_count = $1 WHERE id = $2`, [newRetryCount, email.id]);
        } else {
          // Retry later (e.g., add 60 seconds for retry)
          await updateClient.query(`
            UPDATE email_queue 
            SET status = 'pending', retry_count = $1, scheduled_for = NOW() + INTERVAL '60 seconds' 
            WHERE id = $2
          `, [newRetryCount, email.id]);
        }
      }
      updateClient.release();

    } catch (err) {
      console.error('Error in EmailQueueWorker:', err);
    }

    // Wait exactly 10 seconds before processing the NEXT email (as per requirements)
    setTimeout(() => this.processQueue(), 10000);
  }
};
