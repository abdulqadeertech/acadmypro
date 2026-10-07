import { Router } from 'express';
import { query, one, run, persist } from '../db.js';
import { allowRoles, auditLog } from '../auth.js';
import { makeNumber } from '../utils.js';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

const router = Router();

// All tables that can be backed up
const BACKUP_TABLES = [
  'branches', 'users', 'parents', 'students', 'classes', 'batches', 'subjects',
  'student_batches', 'teacher_assignments', 'admissions', 'attendance',
  'teacher_attendance', 'leave_requests', 'rooms', 'timetable',
  'fee_structures', 'fee_invoices', 'payments', 'expenses', 'expense_categories',
  'exams', 'exam_results', 'grade_rules', 'notifications', 'notification_reads',
  'messages', 'payroll', 'documents', 'scholarships', 'inventory',
  'inventory_transactions', 'events', 'settings', 'audit_logs'
];

// Create full backup
router.get('/export', allowRoles('super_admin', 'academy_admin'), (req, res) => {
  const tables = {};
  for (const t of BACKUP_TABLES) {
    try {
      tables[t] = query(`SELECT * FROM ${t}`);
    } catch {
      tables[t] = [];
    }
  }

  const backup = {
    version: 2,
    created_at: new Date().toISOString(),
    created_by: req.user?.name || 'system',
    tables,
    metadata: {
      total_records: Object.values(tables).reduce((sum, t) => sum + t.length, 0),
      tables_count: BACKUP_TABLES.length,
    },
  };

  auditLog(req.user?.id, req.user?.name, 'BACKUP_CREATE', 'backup', null, `Full backup created: ${backup.metadata.total_records} records`);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="academypro-backup-${Date.now()}.json"`);
  res.json(backup);
});

// Validate backup before restore
router.post('/validate', allowRoles('super_admin'), (req, res) => {
  const data = req.body;
  if (!data || !data.tables || typeof data.tables !== 'object') {
    return res.status(400).json({ message: 'Invalid backup format' });
  }

  const issues = [];
  const warnings = [];

  // Check required tables
  for (const t of ['branches', 'users', 'students', 'classes', 'batches']) {
    if (!data.tables[t]) {
      issues.push(`Missing required table: ${t}`);
    }
  }

  // Check data integrity
  if (data.tables.students) {
    for (const s of data.tables.students) {
      if (!s.name || !s.admission_no) {
        issues.push(`Invalid student record: missing name or admission_no`);
        break;
      }
    }
  }

  if (data.tables.users) {
    for (const u of data.tables.users) {
      if (!u.email || !u.password_hash) {
        issues.push(`Invalid user record: missing email or password_hash`);
        break;
      }
    }
  }

  if (data.version && data.version < 2) {
    warnings.push('Backup is from an older version. Some data may not map correctly.');
  }

  if (issues.length) {
    return res.status(400).json({ message: 'Backup validation failed', issues, warnings });
  }

  // Summary
  const summary = {};
  for (const [t, rows] of Object.entries(data.tables)) {
    summary[t] = rows.length;
  }

  res.json({ message: 'Backup is valid', summary, warnings, total_records: Object.values(summary).reduce((a, b) => a + b, 0) });
});

// Restore from backup
router.post('/restore', allowRoles('super_admin'), (req, res) => {
  const { tables, confirm } = req.body;
  if (!tables || typeof tables !== 'object') {
    return res.status(400).json({ message: 'Invalid backup data' });
  }
  if (!confirm) {
    return res.status(400).json({ message: 'Restore must be confirmed. Pass confirm=true' });
  }

  try {
    // Create safety backup first
    const safetyBackup = {};
    for (const t of BACKUP_TABLES) {
      try {
        safetyBackup[t] = query(`SELECT * FROM ${t}`);
      } catch {}
    }
    const backupFile = path.resolve(`./data/backup-before-restore-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(backupFile), { recursive: true });
    fs.writeFileSync(backupFile, JSON.stringify({ version: 2, tables: safetyBackup, created_at: new Date().toISOString() }));

    // Disable foreign keys for restore
    run('PRAGMA foreign_keys=OFF');

    // Clear existing data and restore
    for (const [tableName, rows] of Object.entries(tables)) {
      if (!BACKUP_TABLES.includes(tableName)) continue;

      // Delete existing
      try {
        run(`DELETE FROM ${tableName}`);
      } catch (e) {
        // Table might not exist
      }

      // Insert backed up rows
      if (rows && rows.length > 0) {
        const cols = Object.keys(rows[0]).filter(c => c !== 'id');
        for (const row of rows) {
          try {
            const vals = cols.map(c => row[c] !== undefined ? row[c] : null);
            run(
              `INSERT INTO ${tableName}(${cols.join(',')}) VALUES(${cols.map(() => '?').join(',')})`,
              vals
            );
          } catch {
            // Skip problematic rows
          }
        }
      }
    }

    // Re-enable foreign keys
    run('PRAGMA foreign_keys=ON');

    auditLog(req.user?.id, req.user?.name, 'BACKUP_RESTORE', 'backup', null, `Database restored from backup. Safety backup saved to ${backupFile}`);

    res.json({
      message: 'Database restored successfully. Safety backup saved.',
      safety_backup: backupFile,
    });
  } catch (e) {
    res.status(500).json({ message: 'Restore failed: ' + e.message });
  }
});

export default router;
