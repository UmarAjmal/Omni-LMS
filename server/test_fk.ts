import { pool } from './src/db.js';
import { NotificationEngine } from './src/services/NotificationEngine.js';

async function run() {
  try {
    console.log('Testing createNotification directly...');
    const id = await NotificationEngine.createNotification({
      type: 'assignment_created',
      category: 'Assignment',
      title: 'Manual Test',
      message: 'Testing FK constraint',
      priority: 'critical',
      recipients: [21],
      sendEmail: true
    });
    console.log('Created Notification ID:', id);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    pool.end();
  }
}
run();
