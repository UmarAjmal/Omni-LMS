import { Router } from 'express';
import { pool } from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/settings
// Fetch the global admin settings
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT settings FROM admin_settings ORDER BY id DESC LIMIT 1');
    const settings = rows.length > 0 ? rows[0].settings : {};
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// PUT /api/settings
// Update the global admin settings
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings) {
      return res.status(400).json({ success: false, error: 'Settings object required' });
    }

    // Upsert into admin_settings (since it's a single global row usually, we just update the first one or insert if missing)
    const { rows } = await pool.query('SELECT id FROM admin_settings ORDER BY id DESC LIMIT 1');
    
    if (rows.length > 0) {
      const id = rows[0].id;
      await pool.query('UPDATE admin_settings SET settings = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [settings, id]);
    } else {
      await pool.query('INSERT INTO admin_settings (settings) VALUES ($1)', [settings]);
    }

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

export default router;
