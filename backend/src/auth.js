import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { one, run } from './db.js';

// Permission matrix
export const PERMISSIONS = {
  super_admin: '*',
  academy_admin: [
    'students.view', 'students.create', 'students.update', 'students.delete',
    'students.attendance', 'students.fees', 'students.results',
    'teachers.view', 'teachers.create', 'teachers.update', 'teachers.delete',
    'parents.view', 'parents.create', 'parents.update', 'parents.delete',
    'classes.view', 'classes.create', 'classes.update', 'classes.delete',
    'batches.view', 'batches.create', 'batches.update', 'batches.delete',
    'subjects.view', 'subjects.create', 'subjects.update', 'subjects.delete',
    'admissions.view', 'admissions.create', 'admissions.update', 'admissions.delete',
    'attendance.view', 'attendance.mark', 'attendance.edit',
    'teacher_attendance.view', 'teacher_attendance.mark',
    'timetable.view', 'timetable.create', 'timetable.update', 'timetable.delete',
    'fees.view', 'fees.create', 'fees.update', 'fees.delete', 'fees.generate',
    'payments.view', 'payments.create', 'payments.update', 'payments.delete',
    'expenses.view', 'expenses.create', 'expenses.update', 'expenses.delete',
    'exams.view', 'exams.create', 'exams.update', 'exams.delete',
    'results.view', 'results.create', 'results.update', 'results.delete',
    'reports.view', 'reports.export',
    'users.view', 'users.create', 'users.update', 'users.delete',
    'branches.view', 'branches.create', 'branches.update', 'branches.delete',
    'settings.view', 'settings.update',
    'backup.create', 'backup.restore',
    'notifications.view', 'notifications.create', 'notifications.send',
    'messages.view', 'messages.create', 'messages.send',
    'payroll.view', 'payroll.create', 'payroll.update',
    'documents.view', 'documents.create', 'documents.delete',
    'scholarships.view', 'scholarships.create', 'scholarships.update', 'scholarships.delete',
    'inventory.view', 'inventory.create', 'inventory.update', 'inventory.delete',
    'events.view', 'events.create', 'events.update', 'events.delete',
    'rooms.view', 'rooms.create', 'rooms.update', 'rooms.delete',
    'leave.view', 'leave.create', 'leave.approve',
    'audit.view',
  ],
  accountant: [
    'students.view', 'fees.view', 'fees.create', 'fees.generate',
    'payments.view', 'payments.create', 'payments.update',
    'expenses.view', 'expenses.create', 'expenses.update',
    'reports.view', 'reports.export',
    'payroll.view', 'payroll.create', 'payroll.update',
    'fee_structures.view',
  ],
  teacher: [
    'students.view', 'students.attendance', 'students.results',
    'attendance.view', 'attendance.mark',
    'timetable.view',
    'exams.view', 'results.view', 'results.create', 'results.update',
    'messages.view', 'messages.create',
    'documents.view', 'documents.create',
  ],
  receptionist: [
    'students.view', 'students.create', 'students.update',
    'parents.view', 'parents.create', 'parents.update',
    'admissions.view', 'admissions.create', 'admissions.update',
    'fees.view',
    'payments.view', 'payments.create',
    'attendance.view',
    'messages.view', 'messages.create',
  ],
  parent: [
    'portal.view', 'portal.children', 'portal.attendance',
    'portal.fees', 'portal.results', 'portal.timetable',
    'messages.view', 'messages.create',
  ],
};

export function hasPermission(role, permission) {
  if (role === 'super_admin') return true;
  const perms = PERMISSIONS[role];
  if (!perms) return false;
  if (perms === '*') return true;
  return perms.includes(permission);
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, branchId: user.branch_id },
    config.jwtSecret,
    { expiresIn: config.jwtExpiry }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission for this action' });
    }
    next();
  };
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ message: `Permission denied: ${permission}` });
    }
    next();
  };
}

// Branch isolation: non-super_admin users only see their branch data
export function branchFilter(req) {
  if (req.user.role === 'super_admin') return '';
  return ` AND branch_id = ${Number(req.user.branchId) || 0}`;
}

export function branchFilterParam(req) {
  if (req.user.role === 'super_admin') return null;
  return req.user.branchId;
}

// Audit logging
export function auditLog(userId, userName, action, entity, entityId, details, ip, oldValue, newValue) {
  try {
    run(
      'INSERT INTO audit_logs(user_id,user_name,action,entity,entity_id,old_value,new_value,details,ip) VALUES(?,?,?,?,?,?,?,?,?)',
      [userId, userName, action, entity, entityId, oldValue || null, newValue || null, details || null, ip || null]
    );
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
}

export async function ensureAdmin() {
  const existing = one('SELECT id FROM users WHERE email = ?', ['admin@academypro.local']);
  if (!existing) {
    const branch = one('SELECT id FROM branches ORDER BY id LIMIT 1');
    const hash = await hashPassword('Admin@123');
    run(
      `INSERT INTO users (branch_id,name,email,password_hash,role,phone) VALUES(?,?,?,?,?,?)`,
      [branch?.id || null, 'System Administrator', 'admin@academypro.local', hash, 'super_admin', '03000000000']
    );
  }
}
