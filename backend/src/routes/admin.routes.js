import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, one, run } from '../db.js';
import { allowRoles, requirePermission, auditLog } from '../auth.js';

const router = Router();

// ===== USER MANAGEMENT =====
router.get('/users', requirePermission('users.view'), (req, res) => {
  let select = "SELECT id,name,email,role,phone,status,branch_id,created_at,updated_at FROM users";
  const params = [];
  if (req.query.role) { select += ' WHERE role=?'; params.push(req.query.role); }
  if (req.query.status) { select += params.length ? ' AND' : ' WHERE'; select += ' status=?'; params.push(req.query.status); }
  select += ' ORDER BY id DESC';
  res.json(query(select, params));
});

router.get('/users/:id', requirePermission('users.view'), (req, res) => {
  const user = one("SELECT id,name,email,role,phone,status,branch_id,created_at FROM users WHERE id=?", [req.params.id]);
  user ? res.json(user) : res.status(404).json({ message: 'User not found' });
});

router.post('/users', requirePermission('users.create'), async (req, res) => {
  const b = req.body;
  if (!b.name || !b.email || !b.password) {
    return res.status(400).json({ message: 'Name, email and password required' });
  }
  const allowedRoles = ['academy_admin', 'accountant', 'teacher', 'receptionist', 'parent', 'staff'];
  if (!allowedRoles.includes(b.role || 'staff') && !(req.user.role === 'super_admin' && b.role === 'super_admin')) {
    return res.status(400).json({ message: 'Invalid or unauthorized role' });
  }
  if (b.role === 'super_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Only a super admin can create another super admin' });
  }
  try {
    const hash = await bcrypt.hash(b.password, 12);
    const newId = run(
      "INSERT INTO users(branch_id,name,email,password_hash,role,phone,status) VALUES(?,?,?,?,?,?,?)",
      [b.branch_id || null, b.name, b.email, hash, b.role || 'staff', b.phone || null, b.status || 'active']
    );
    auditLog(req.user?.id, req.user?.name, 'CREATE', 'users', newId, `User "${b.name}" created with role ${b.role || 'staff'}`);
    res.status(201).json({ message: 'User created', id: newId });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.put('/users/:id', requirePermission('users.update'), async (req, res) => {
  const b = req.body;
  const old = one('SELECT * FROM users WHERE id=?', [req.params.id]);
  if (!old) return res.status(404).json({ message: 'User not found' });
  const allowedRoles = ['academy_admin', 'accountant', 'teacher', 'receptionist', 'parent', 'staff'];
  if (!allowedRoles.includes(b.role) && !(req.user.role === 'super_admin' && b.role === 'super_admin')) {
    return res.status(400).json({ message: 'Invalid or unauthorized role' });
  }
  if (b.role === 'super_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Only a super admin can assign the super admin role' });
  }

  const hash = b.password ? await bcrypt.hash(b.password, 12) : old.password_hash;
  run(
    "UPDATE users SET name=?,email=?,password_hash=?,role=?,phone=?,status=?,branch_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
    [b.name, b.email, hash, b.role, b.phone || null, b.status || 'active', b.branch_id || null, req.params.id]
  );
  auditLog(req.user?.id, req.user?.name, 'UPDATE', 'users', req.params.id, `User updated: ${b.name}`);
  res.json({ message: 'User updated' });
});

router.delete('/users/:id', requirePermission('users.delete'), (req, res) => {
  if (Number(req.params.id) === Number(req.user.id)) {
    return res.status(400).json({ message: 'You cannot deactivate your own account' });
  }
  run("UPDATE users SET status='inactive' WHERE id=?", [req.params.id]);
  auditLog(req.user?.id, req.user?.name, 'DELETE', 'users', req.params.id, 'User deactivated');
  res.json({ message: 'User deactivated' });
});

// ===== TEACHER ASSIGNMENTS =====
router.get('/assignments', requirePermission('users.view'), (req, res) => {
  res.json(query(
    `SELECT a.*,u.name teacher_name,b.name batch_name,sub.name subject_name
     FROM teacher_assignments a
     JOIN users u ON u.id=a.teacher_id
     LEFT JOIN batches b ON b.id=a.batch_id
     LEFT JOIN subjects sub ON sub.id=a.subject_id
     ORDER BY a.id DESC`
  ));
});

router.post('/assignments', requirePermission('users.create'), (req, res) => {
  const b = req.body;
  run('INSERT INTO teacher_assignments(teacher_id,batch_id,subject_id) VALUES(?,?,?)', [b.teacher_id, b.batch_id || null, b.subject_id || null]);
  auditLog(req.user?.id, req.user?.name, 'CREATE', 'teacher_assignments', null, 'Teacher assignment created');
  res.status(201).json({ message: 'Assignment created' });
});

router.delete('/assignments/:id', requirePermission('users.delete'), (req, res) => {
  run('DELETE FROM teacher_assignments WHERE id=?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// ===== AUDIT LOGS =====
router.get('/audit-logs', requirePermission('audit.view'), (req, res) => {
  res.json(query('SELECT a.*,u.name user_name FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 500'));
});

// ===== SETTINGS =====
router.get('/settings', requirePermission('settings.view'), (req, res) => {
  res.json(query('SELECT * FROM settings ORDER BY category, key'));
});

router.put('/settings/:key', requirePermission('settings.update'), (req, res) => {
  run(
    "INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP",
    [req.params.key, String(req.body.value ?? '')]
  );
  res.json({ message: 'Saved' });
});

export default router;
