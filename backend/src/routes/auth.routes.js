import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { one, run } from '../db.js';
import { signToken, verifyPassword, hashPassword, auditLog } from '../auth.js';
import { requireAuth } from '../auth.js';
import { authLimiter } from '../middleware.js';

const router = Router();

// Login
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = one('SELECT * FROM users WHERE lower(email) = ? AND status = ?', [normalizedEmail, 'active']);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = signToken(user);
  auditLog(user.id, user.name, 'LOGIN', 'auth', user.id, 'User logged in', req.ip);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branch_id,
      phone: user.phone,
    },
  });
});

// Get current user profile
router.get('/me', requireAuth, (req, res) => {
  const user = one('SELECT id,name,email,role,phone,status,branch_id,created_at FROM users WHERE id=?', [req.user.id]);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// Change password
router.post('/change-password', requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'Current and new password required' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }

  const user = one('SELECT * FROM users WHERE id=?', [req.user.id]);
  if (!user || !(await verifyPassword(current_password, user.password_hash))) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  const hash = await hashPassword(new_password);
  run('UPDATE users SET password_hash=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [hash, req.user.id]);
  auditLog(req.user.id, req.user.name, 'PASSWORD_CHANGE', 'users', req.user.id, 'Password changed');

  res.json({ message: 'Password changed successfully' });
});

// Logout (client-side, but we log it)
router.post('/logout', requireAuth, (req, res) => {
  auditLog(req.user.id, req.user.name, 'LOGOUT', 'auth', req.user.id, 'User logged out');
  res.json({ message: 'Logged out' });
});

export default router;
