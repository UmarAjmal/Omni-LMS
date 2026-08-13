import { Router } from 'express';
import { pool } from '../db.js';
import { authenticateToken, requireAdminOrTrainer, requireAdmin } from '../middleware/auth.js';
import { NotificationEngine } from '../services/NotificationEngine.js';

const router = Router();

// GET /api/notifications
// Fetch notifications for the authenticated student (with pagination and filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (userId === undefined || userId === null) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    if (studentRes.rows.length === 0) return res.json({ success: true, data: [] });
    const studentId = studentRes.rows[0].id;

    const { page = 1, limit = 20, category } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT n.*, nr.is_read, nr.read_at, nr.id as recipient_id
      FROM notifications n
      JOIN notification_recipients nr ON nr.notification_id = n.id
      WHERE nr.student_id = $1
    `;
    const params: any[] = [studentId];

    if (category && category !== 'All') {
      params.push(category);
      query += ` AND n.category = $${params.length}`;
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), offset);

    const { rows } = await pool.query(query, params);
    
    // Also get unread count
    const countRes = await pool.query('SELECT COUNT(*) FROM notification_recipients WHERE student_id = $1 AND is_read = false', [studentId]);
    const unreadCount = parseInt(countRes.rows[0].count);

    res.json({ success: true, data: rows, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// POST /api/notifications/:id/read
// Mark a notification as read and log the acknowledgement
router.post('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id as string);
    const userId = req.user?.id;
    if (userId === undefined || userId === null) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    if (studentRes.rows.length === 0) return res.status(403).json({ success: false, error: 'Not a student' });
    const studentId = studentRes.rows[0].id;

    await pool.query(
      'UPDATE notification_recipients SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE notification_id = $1 AND student_id = $2',
      [notificationId, studentId]
    );

    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (userId === undefined || userId === null) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    if (studentRes.rows.length === 0) return res.status(403).json({ success: false, error: 'Not a student' });
    const studentId = studentRes.rows[0].id;

    await pool.query(
      'UPDATE notification_recipients SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE student_id = $1 AND is_read = false',
      [studentId]
    );

    res.json({ success: true, message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id as string);
    const userId = req.user?.id;
    if (userId === undefined || userId === null) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    if (studentRes.rows.length === 0) return res.status(403).json({ success: false, error: 'Not a student' });
    const studentId = studentRes.rows[0].id;

    await pool.query('DELETE FROM notification_recipients WHERE notification_id = $1 AND student_id = $2', [notificationId, studentId]);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// DELETE /api/notifications
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (userId === undefined || userId === null) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    if (studentRes.rows.length === 0) return res.status(403).json({ success: false, error: 'Not a student' });
    const studentId = studentRes.rows[0].id;

    await pool.query('DELETE FROM notification_recipients WHERE student_id = $1', [studentId]);
    res.json({ success: true, message: 'All notifications deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// POST /api/notifications/fcm-token
// Store only ONE active FCM token per device/user
router.post('/fcm-token', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { token, device_type = 'web' } = req.body;
    
    if (userId === undefined || userId === null) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (!token) return res.status(400).json({ success: false, error: 'Token is required' });

    // Remove any existing token for this user & device type to ensure only one active per device
    await pool.query('DELETE FROM user_fcm_tokens WHERE user_id = $1 AND device_type = $2', [userId, device_type]);

    await pool.query(
      `INSERT INTO user_fcm_tokens (user_id, token, device_type) 
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, token) DO NOTHING`,
      [userId, token, device_type]
    );

    res.json({ success: true, message: 'FCM token registered' });
  } catch (error) {
    console.error('Error registering FCM token:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// GET /api/notifications/analytics
router.get('/analytics', authenticateToken, requireAdminOrTrainer, async (req, res) => {
  try {
    const query = `
      SELECT n.id, n.type, n.title, n.priority, n.created_at,
             COUNT(nr.id) as total_recipients,
             SUM(CASE WHEN nr.is_read THEN 1 ELSE 0 END) as read_count,
             (COUNT(nr.id) - SUM(CASE WHEN nr.is_read THEN 1 ELSE 0 END)) as unread_count,
             COALESCE(ROUND((SUM(CASE WHEN nr.is_read THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(nr.id), 0), 2), 0) as read_percentage
      FROM notifications n
      LEFT JOIN notification_recipients nr ON nr.notification_id = n.id
      GROUP BY n.id
      ORDER BY n.created_at DESC
    `;
    const { rows } = await pool.query(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// GET /api/notifications/:id/acknowledgements
router.get('/:id/acknowledgements', authenticateToken, requireAdminOrTrainer, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id as string);
    const query = `
      SELECT s.first_name, s.last_name, s.enrollment_id, nr.is_read, nr.read_at
      FROM notification_recipients nr
      JOIN students s ON s.id = nr.student_id
      WHERE nr.notification_id = $1
      ORDER BY nr.is_read ASC, nr.read_at DESC
    `;
    const { rows } = await pool.query(query, [notificationId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching acknowledgements:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

export default router;
