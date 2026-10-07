import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { isOnline } from '../lib/offline';

const C = createContext(null);

// Permission matrix (mirrors backend/src/auth.js PERMISSIONS)
const PERMISSIONS = {
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
    'leave.view', 'leave.approve',
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
  // Role used by Users page's role dropdown; treat as read-only viewer
  staff: [
    'students.view', 'parents.view', 'teachers.view', 'classes.view',
    'subjects.view', 'attendance.view', 'timetable.view', 'fees.view',
    'payments.view', 'exams.view', 'events.view', 'notifications.view',
    'reports.view', 'portal.view',
  ],
};

function hasPermission(role, permission) {
  if (!role) return false;
  if (role === 'super_admin') return true;
  const perms = PERMISSIONS[role];
  if (!perms) return false;
  if (perms === '*' || perms.includes('*')) return true;
  return perms.includes(permission);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('academypro_user') || 'null');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      let data;
      try {
        ({ data } = await api.post('/auth/login', { email, password }));
      } catch (error) {
        const offlineDemo = (!isOnline() || !error.response)
          && email.trim().toLowerCase() === 'admin@academypro.local'
          && password === 'Admin@123';
        if (!offlineDemo) throw error;
        data = {
          token: 'offline-demo-token',
          user: { id: 0, name: 'Offline Administrator', email: 'admin@academypro.local', role: 'super_admin' },
        };
      }
      localStorage.setItem('academypro_token', data.token);
      localStorage.setItem('academypro_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('academypro_token');
    localStorage.removeItem('academypro_user');
    setUser(null);
  }, []);

  const can = useCallback((permission) => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  }, [user]);

  const isRole = useCallback((...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const value = { user, login, logout, loading, can, isRole, isAuthenticated: !!user };

  return <C.Provider value={value}>{children}</C.Provider>;
}

export const useAuth = () => useContext(C);
