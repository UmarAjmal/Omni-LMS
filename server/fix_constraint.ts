import { pool } from './src/db.js';

async function run() {
  try {
    await pool.query('ALTER TABLE notification_recipients DROP CONSTRAINT IF EXISTS notification_recipients_notification_id_fkey;');
    await pool.query('ALTER TABLE notification_recipients ADD CONSTRAINT notification_recipients_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE;');
    console.log('Constraint fixed');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
