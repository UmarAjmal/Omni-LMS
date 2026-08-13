import { pool } from '../db.js';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin initialized successfully.');
    } else {
      console.warn('Firebase Admin is NOT initialized. Missing FIREBASE_* environment variables.');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

export interface CreateNotificationParams {
  type: string; // Specific action e.g., 'assignment_created', 'lead_approved'
  category: 'Assignment' | 'Announcement' | 'Lead Campaign' | 'Lead Approved' | 'Lead Rejected' | 'System';
  title: string;
  message?: string;
  priority?: 'critical' | 'normal';
  recipients: number[]; // Array of student_ids
  actionUrl?: string;
  attachmentUrl?: string;
  createdBy?: number | null | undefined;
  sendEmail?: boolean;
  emailSubject?: string;
  emailBody?: string;
}

export const NotificationEngine = {
  getExpirationDate(category: string): Date | null {
    const date = new Date();
    if (category === 'Announcement') {
      date.setDate(date.getDate() + 30);
      return date;
    }
    if (category.startsWith('Lead')) {
      date.setDate(date.getDate() + 90);
      return date;
    }
    // Assignments expire until deadline/completion, handled separately or never hard-expires
    return null; 
  },

  isPushAllowed(type: string): boolean {
    const allowedPushTypes = [
      'assignment_created',
      'lead_campaign_assigned',
      'lead_approved',
      'lead_rejected',
      'announcement_published'
    ];
    return allowedPushTypes.includes(type);
  },

  getEmailTemplate(title: string, message: string, actionUrl?: string) {
    // Hardcoded professional Falcon Swift LMS responsive HTML email template
    const buttonHtml = actionUrl 
      ? `<a href="${actionUrl}" style="display:inline-block;padding:12px 24px;background-color:#1E3A8A;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:20px;">View Details</a>`
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background-color: #111827; padding: 24px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; }
          .content { padding: 32px; color: #374151; line-height: 1.6; }
          .content h2 { color: #111827; margin-top: 0; font-size: 20px; }
          .footer { background-color: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Falcon Swift LMS</h1>
          </div>
          <div class="content">
            <h2>${title}</h2>
            <p>${message}</p>
            ${buttonHtml}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Falcon Swift LMS. All rights reserved.</p>
            <p>You received this email because of your account notifications.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  async createNotification(params: CreateNotificationParams) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch Admin Settings
      const settingsRes = await client.query('SELECT settings FROM admin_settings ORDER BY id DESC LIMIT 1');
      const adminSettings = settingsRes.rows.length > 0 ? settingsRes.rows[0].settings : {};
      
      // Feature toggles
      const inAppEnabled = adminSettings.inAppEnabled !== false;
      const pushEnabled = adminSettings.pushEnabled !== false;
      const emailEnabled = adminSettings.emailEnabled !== false;

      const categoryStr = params.category || 'System';
      const categoryKey = categoryStr.toLowerCase().split(' ')[0]; // e.g. 'lead', 'assignment'
      const isCategoryEnabled = adminSettings.categories ? (adminSettings.categories as any)[categoryKey as string] !== false : true;

      let notificationId: number | null = null;

      if (inAppEnabled && isCategoryEnabled) {
        // 2. Insert into notifications table
        const expiresAt = this.getExpirationDate(params.category);
        const notifQuery = `
          INSERT INTO notifications (type, category, title, message, priority, action_url, attachment_url, created_by, expires_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `;
        const notifRes = await client.query(notifQuery, [
          params.type,
          params.category,
          params.title,
          params.message,
          params.priority || 'normal',
          params.actionUrl || null,
          params.attachmentUrl || null,
          params.createdBy || null,
          expiresAt
        ]);
        notificationId = notifRes.rows[0].id;

        // 3. Insert into notification_recipients table
        if (params.recipients && params.recipients.length > 0) {
          const values: any[] = [];
          const placeholders: string[] = [];
          let placeholderIndex = 1;

          params.recipients.forEach(studentId => {
            placeholders.push(`($${placeholderIndex++}, $${placeholderIndex++})`);
            values.push(notificationId, studentId);
          });

          const recQuery = `
            INSERT INTO notification_recipients (notification_id, student_id)
            VALUES ${placeholders.join(', ')}
          `;
          await client.query(recQuery, values);
        }
      }

      // 4. Queue Emails
      console.log('NotificationEngine EVAL:', { emailEnabled, isCategoryEnabled, sendEmail: params.sendEmail, recLen: params.recipients?.length });
      if (emailEnabled && isCategoryEnabled && params.sendEmail && params.recipients.length > 0) {
        // Get emails of the recipients
        const emailsQuery = `
          SELECT s.id, u.email 
          FROM students s
          JOIN users u ON s.user_id = u.id
          WHERE s.id = ANY($1)
        `;
        const { rows: students } = await client.query(emailsQuery, [params.recipients]);
        console.log(`Found ${students.length} emails to send to. params.recipients=`, params.recipients);

        const htmlBody = this.getEmailTemplate(
          params.emailSubject || params.title, 
          params.emailBody || params.message || '', 
          params.actionUrl
        );

        // Insert into email_queue with 10-second delay increments
        const values: any[] = [];
        const placeholders: string[] = [];
        let pIdx = 1;

        students.forEach((student, index) => {
          placeholders.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, NOW() + INTERVAL '${index * 10} seconds')`);
          values.push(student.email, params.emailSubject || params.title, htmlBody);
        });

        if (values.length > 0) {
          const emailQueueQuery = `
            INSERT INTO email_queue (recipient, subject, body, scheduled_for)
            VALUES ${placeholders.join(', ')}
          `;
          await client.query(emailQueueQuery, values);
        }
      }

      await client.query('COMMIT');

      // 5. Dispatch Firebase Push Notifications
      if (pushEnabled && isCategoryEnabled && this.isPushAllowed(params.type) && params.recipients.length > 0) {
        await this.dispatchPushNotifications(notificationId || 0, params);
      }

      return notificationId;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('NotificationEngine Error:', err);
      throw err;
    } finally {
      client.release();
    }
  },

  async dispatchPushNotifications(notificationId: number, params: CreateNotificationParams) {
    if (!getApps().length) return; // Skip if Firebase is not initialized

    try {
      const tokenQuery = `
        SELECT t.token, t.user_id
        FROM user_fcm_tokens t
        JOIN students s ON s.user_id = t.user_id
        WHERE s.id = ANY($1)
      `;
      const { rows } = await pool.query(tokenQuery, [params.recipients]);

      const tokens = rows.map(r => r.token);

      if (tokens.length === 0) return;

      const message = {
        notification: {
          title: 'Falcon Swift LMS',
          body: `${params.title}\n${params.message || ''}`,
        },
        data: {
          notificationId: String(notificationId),
          type: params.type,
          actionUrl: params.actionUrl || '',
        },
        tokens: tokens,
      };

      const response = await getMessaging().sendEachForMulticast(message);
      
      // Handle invalid tokens to maintain only active tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errCode = resp.error?.code;
            if (errCode === 'messaging/invalid-registration-token' || errCode === 'messaging/registration-token-not-registered') {
              failedTokens.push(tokens[idx]);
            }
          }
        });

        if (failedTokens.length > 0) {
          await pool.query('DELETE FROM user_fcm_tokens WHERE token = ANY($1)', [failedTokens]);
          console.log(`Removed ${failedTokens.length} invalid FCM tokens.`);
        }
      }

      console.log(`Successfully sent FCM messages: ${response.successCount} successes, ${response.failureCount} failures.`);
    } catch (err) {
      console.error('Error sending FCM push notifications:', err);
    }
  },

  async logAction(notificationId: number, studentId: number, action: string, ipAddress: string, userAgent: string) {
    try {
      await pool.query(
        `INSERT INTO notification_logs (notification_id, student_id, action, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)`,
        [notificationId, studentId, action, ipAddress, userAgent]
      );
    } catch (err) {
      console.error('Error logging notification action:', err);
    }
  }
};
