import initSqlJs from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

let db;
let SQL;

export async function initDb() {
  SQL = await initSqlJs();
  const file = path.resolve(config.dbFile);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  db = fs.existsSync(file) ? new SQL.Database(fs.readFileSync(file)) : new SQL.Database();
  createSchema();
  migrateSchema();
  persist();
  return db;
}

function migrateSchema() {
  // Keep existing SQLite installations compatible with newer profile fields.
  try { db.run('ALTER TABLE users ADD COLUMN photo_url TEXT'); } catch {}
  // Older seed data accidentally swapped parent name and relation.
  try {
    db.run("UPDATE parents SET name=relation, relation='father' WHERE name='father' AND relation IS NOT NULL AND relation <> 'father'");
  } catch {}
}

export function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function persist() {
  try {
    const file = path.resolve(config.dbFile);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(db.export()));
  } catch (e) {
    console.error('DB persist error:', e.message);
  }
}

export function query(sql, params = []) {
  const stmt = db.prepare(sql);
  // sql.js throws (as a plain string) on undefined params — normalize to null
  stmt.bind(params.map(p => (p === undefined ? null : p)));
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

export function one(sql, params = []) {
  return query(sql, params)[0] || null;
}

export function run(sql, params = []) {
  const stmt = db.prepare(sql);
  // sql.js throws (as a plain string) on undefined params — normalize to null
  stmt.run(params.map(p => (p === undefined ? null : p)));
  // Get last_insert_rowid before export (export resets it in sql.js)
  const idStmt = db.prepare('SELECT last_insert_rowid() as id');
  idStmt.step();
  const lid = idStmt.getAsObject().id;
  idStmt.free();
  stmt.free();
  persist();
  return lid;
}

export function runBatch(statements) {
  for (const { sql, params } of statements) {
    run(sql, params);
  }
}

function createSchema() {
  db.run(`
    PRAGMA foreign_keys=ON;

    -- Branches
    CREATE TABLE IF NOT EXISTS branches(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Users (admins, teachers, staff, parents)
    CREATE TABLE IF NOT EXISTS users(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'staff',
      phone TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(branch_id) REFERENCES branches(id)
    );

    -- Parents/Guardians
    CREATE TABLE IF NOT EXISTS parents(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      relation TEXT DEFAULT 'father',
      phone TEXT,
      whatsapp TEXT,
      email TEXT,
      address TEXT,
      occupation TEXT,
      cnic TEXT,
      photo_url TEXT,
      user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    -- Students
    CREATE TABLE IF NOT EXISTS students(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      parent_id INTEGER,
      admission_no TEXT UNIQUE NOT NULL,
      roll_no TEXT,
      name TEXT NOT NULL,
      father_name TEXT,
      mother_name TEXT,
      dob TEXT,
      gender TEXT,
      phone TEXT,
      whatsapp TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      cnic TEXT,
      photo_url TEXT,
      admission_date TEXT NOT NULL,
      monthly_fee REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      emergency_contact TEXT,
      emergency_phone TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(branch_id) REFERENCES branches(id),
      FOREIGN KEY(parent_id) REFERENCES parents(id)
    );

    -- Classes
    CREATE TABLE IF NOT EXISTS classes(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      name TEXT NOT NULL,
      code TEXT,
      level TEXT,
      status TEXT DEFAULT 'active',
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(branch_id) REFERENCES branches(id)
    );

    -- Batches
    CREATE TABLE IF NOT EXISTS batches(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER,
      branch_id INTEGER,
      name TEXT NOT NULL,
      shift TEXT,
      room TEXT,
      capacity INTEGER DEFAULT 40,
      fee REAL DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(class_id) REFERENCES classes(id),
      FOREIGN KEY(branch_id) REFERENCES branches(id)
    );

    -- Subjects
    CREATE TABLE IF NOT EXISTS subjects(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER,
      name TEXT NOT NULL,
      code TEXT,
      max_marks REAL DEFAULT 100,
      passing_marks REAL DEFAULT 40,
      coefficient REAL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(class_id) REFERENCES classes(id)
    );

    -- Student-Batch assignments
    CREATE TABLE IF NOT EXISTS student_batches(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      batch_id INTEGER NOT NULL,
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      active INTEGER DEFAULT 1,
      UNIQUE(student_id, batch_id),
      FOREIGN KEY(student_id) REFERENCES students(id),
      FOREIGN KEY(batch_id) REFERENCES batches(id)
    );

    -- Teacher assignments (teacher -> batch -> subject)
    CREATE TABLE IF NOT EXISTS teacher_assignments(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      batch_id INTEGER,
      subject_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(teacher_id) REFERENCES users(id),
      FOREIGN KEY(batch_id) REFERENCES batches(id),
      FOREIGN KEY(subject_id) REFERENCES subjects(id)
    );

    -- Admissions
    CREATE TABLE IF NOT EXISTS admissions(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      application_no TEXT UNIQUE NOT NULL,
      student_name TEXT,
      father_name TEXT,
      phone TEXT,
      previous_school TEXT,
      previous_class TEXT,
      applied_class TEXT,
      applied_batch TEXT,
      admission_date TEXT,
      initial_fee REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      documents TEXT,
      status TEXT DEFAULT 'pending',
      remarks TEXT,
      branch_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(student_id) REFERENCES students(id),
      FOREIGN KEY(branch_id) REFERENCES branches(id)
    );

    -- Attendance (students)
    CREATE TABLE IF NOT EXISTS attendance(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      batch_id INTEGER,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT,
      marked_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, batch_id, date),
      FOREIGN KEY(student_id) REFERENCES students(id),
      FOREIGN KEY(batch_id) REFERENCES batches(id)
    );

    -- Teacher attendance
    CREATE TABLE IF NOT EXISTS teacher_attendance(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT,
      marked_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(teacher_id, date),
      FOREIGN KEY(teacher_id) REFERENCES users(id)
    );

    -- Leave requests
    CREATE TABLE IF NOT EXISTS leave_requests(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_type TEXT NOT NULL,
      person_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      approved_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Rooms
    CREATE TABLE IF NOT EXISTS rooms(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      name TEXT NOT NULL,
      capacity INTEGER DEFAULT 30,
      type TEXT DEFAULT 'classroom',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(branch_id) REFERENCES branches(id)
    );

    -- Timetable
    CREATE TABLE IF NOT EXISTS timetable(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      batch_id INTEGER,
      teacher_id INTEGER,
      subject_id INTEGER,
      room_id INTEGER,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(branch_id) REFERENCES branches(id),
      FOREIGN KEY(batch_id) REFERENCES batches(id),
      FOREIGN KEY(teacher_id) REFERENCES users(id),
      FOREIGN KEY(subject_id) REFERENCES subjects(id),
      FOREIGN KEY(room_id) REFERENCES rooms(id)
    );

    -- Fee structures
    CREATE TABLE IF NOT EXISTS fee_structures(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      class_id INTEGER,
      admission_fee REAL DEFAULT 0,
      monthly_fee REAL DEFAULT 0,
      exam_fee REAL DEFAULT 0,
      transport_fee REAL DEFAULT 0,
      other_fee REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(class_id) REFERENCES classes(id)
    );

    -- Fee invoices
    CREATE TABLE IF NOT EXISTS fee_invoices(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      invoice_no TEXT UNIQUE NOT NULL,
      billing_month TEXT NOT NULL,
      amount REAL NOT NULL,
      discount REAL DEFAULT 0,
      scholarship_discount REAL DEFAULT 0,
      fine REAL DEFAULT 0,
      previous_due REAL DEFAULT 0,
      due_date TEXT,
      status TEXT DEFAULT 'unpaid',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, billing_month),
      FOREIGN KEY(student_id) REFERENCES students(id)
    );

    -- Payments
    CREATE TABLE IF NOT EXISTS payments(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      invoice_id INTEGER,
      receipt_no TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      method TEXT DEFAULT 'cash',
      paid_at TEXT NOT NULL,
      note TEXT,
      received_by INTEGER,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(student_id) REFERENCES students(id),
      FOREIGN KEY(invoice_id) REFERENCES fee_invoices(id)
    );

    -- Expenses
    CREATE TABLE IF NOT EXISTS expenses(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      reference TEXT,
      payment_method TEXT DEFAULT 'cash',
      receipt_url TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(branch_id) REFERENCES branches(id)
    );

    -- Expense categories
    CREATE TABLE IF NOT EXISTS expense_categories(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Exams
    CREATE TABLE IF NOT EXISTS exams(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      session TEXT,
      type TEXT,
      class_id INTEGER,
      batch_id INTEGER,
      start_date TEXT,
      end_date TEXT,
      start_time TEXT,
      end_time TEXT,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(class_id) REFERENCES classes(id),
      FOREIGN KEY(batch_id) REFERENCES batches(id)
    );

    -- Exam results
    CREATE TABLE IF NOT EXISTS exam_results(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      obtained_marks REAL NOT NULL,
      total_marks REAL NOT NULL,
      grade TEXT,
      remarks TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(exam_id, student_id, subject_id),
      FOREIGN KEY(exam_id) REFERENCES exams(id),
      FOREIGN KEY(student_id) REFERENCES students(id),
      FOREIGN KEY(subject_id) REFERENCES subjects(id)
    );

    -- Grade rules (configurable)
    CREATE TABLE IF NOT EXISTS grade_rules(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grade TEXT NOT NULL,
      min_percent REAL NOT NULL,
      max_percent REAL NOT NULL,
      gpa REAL DEFAULT 0,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'general',
      audience TEXT DEFAULT 'all',
      target_id INTEGER,
      target_role TEXT,
      scheduled_at TEXT,
      sent_at TEXT,
      status TEXT DEFAULT 'draft',
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Notification reads
    CREATE TABLE IF NOT EXISTS notification_reads(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      notification_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      read_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(notification_id, user_id),
      FOREIGN KEY(notification_id) REFERENCES notifications(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    -- Messages
    CREATE TABLE IF NOT EXISTS messages(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER,
      recipient_type TEXT,
      recipient_id INTEGER,
      subject TEXT,
      message TEXT,
      read_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(sender_id) REFERENCES users(id)
    );

    -- Payroll
    CREATE TABLE IF NOT EXISTS payroll(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      basic_salary REAL DEFAULT 0,
      allowance REAL DEFAULT 0,
      deduction REAL DEFAULT 0,
      advance REAL DEFAULT 0,
      bonus REAL DEFAULT 0,
      net_salary REAL DEFAULT 0,
      status TEXT DEFAULT 'unpaid',
      paid_at TEXT,
      payment_method TEXT DEFAULT 'cash',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(teacher_id, month),
      FOREIGN KEY(teacher_id) REFERENCES users(id)
    );

    -- Documents
    CREATE TABLE IF NOT EXISTS documents(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      file_url TEXT,
      file_size INTEGER,
      document_type TEXT,
      uploaded_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Scholarships/Discounts
    CREATE TABLE IF NOT EXISTS scholarships(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      name TEXT,
      type TEXT DEFAULT 'fixed',
      amount REAL DEFAULT 0,
      percent REAL DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      status TEXT DEFAULT 'active',
      approved_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(student_id) REFERENCES students(id)
    );

    -- Inventory
    CREATE TABLE IF NOT EXISTS inventory(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      item_name TEXT NOT NULL,
      category TEXT,
      quantity REAL DEFAULT 0,
      unit TEXT,
      unit_cost REAL DEFAULT 0,
      reorder_level REAL DEFAULT 0,
      supplier TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(branch_id) REFERENCES branches(id)
    );

    -- Inventory transactions
    CREATE TABLE IF NOT EXISTS inventory_transactions(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      reference TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(inventory_id) REFERENCES inventory(id)
    );

    -- Events
    CREATE TABLE IF NOT EXISTS events(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      title TEXT NOT NULL,
      event_date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      location TEXT,
      description TEXT,
      type TEXT DEFAULT 'general',
      status TEXT DEFAULT 'scheduled',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(branch_id) REFERENCES branches(id)
    );

    -- Front office visitor, call and inquiry logs
    CREATE TABLE IF NOT EXISTS front_office_logs(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      direction TEXT DEFAULT 'incoming',
      log_type TEXT DEFAULT 'visitor',
      person_name TEXT NOT NULL,
      phone TEXT,
      purpose TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'open',
      assigned_to TEXT,
      follow_up_date TEXT,
      notes TEXT,
      checked_in_at TEXT DEFAULT CURRENT_TIMESTAMP,
      checked_out_at TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(branch_id) REFERENCES branches(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    -- Settings
    CREATE TABLE IF NOT EXISTS settings(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      category TEXT DEFAULT 'general',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Audit logs
    CREATE TABLE IF NOT EXISTS audit_logs(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      action TEXT NOT NULL,
      entity TEXT,
      entity_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      details TEXT,
      ip TEXT,
      device TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Sync queue for offline
    CREATE TABLE IF NOT EXISTS sync_queue(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity TEXT NOT NULL,
      entity_id INTEGER,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      attempts INTEGER DEFAULT 0,
      last_error TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
    CREATE INDEX IF NOT EXISTS idx_students_branch ON students(branch_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
    CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
    CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(paid_at);
    CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_expenses_branch ON expenses(branch_id);
    CREATE INDEX IF NOT EXISTS idx_results_exam ON exam_results(exam_id);
    CREATE INDEX IF NOT EXISTS idx_results_student ON exam_results(student_id);
    CREATE INDEX IF NOT EXISTS idx_fee_invoices_student ON fee_invoices(student_id);
    CREATE INDEX IF NOT EXISTS idx_fee_invoices_month ON fee_invoices(billing_month);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity);
    CREATE INDEX IF NOT EXISTS idx_front_office_status ON front_office_logs(status);
    CREATE INDEX IF NOT EXISTS idx_front_office_created ON front_office_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
  `);

  // Seed default grade rules if empty
  const gradeCount = one('SELECT COUNT(*) count FROM grade_rules');
  if (gradeCount && gradeCount.count === 0) {
    const grades = [
      ['A+', 90, 100, 4.0, 'Excellent'],
      ['A', 80, 89.99, 3.7, 'Very Good'],
      ['B+', 70, 79.99, 3.3, 'Good'],
      ['B', 60, 69.99, 3.0, 'Above Average'],
      ['C', 50, 59.99, 2.0, 'Average'],
      ['D', 40, 49.99, 1.0, 'Below Average'],
      ['F', 0, 39.99, 0, 'Fail'],
    ];
    for (const g of grades) {
      run('INSERT INTO grade_rules(grade, min_percent, max_percent, gpa, description) VALUES(?,?,?,?,?)', g);
    }
  }

  // Seed default expense categories if empty
  const catCount = one('SELECT COUNT(*) count FROM expense_categories');
  if (catCount && catCount.count === 0) {
    const cats = ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Maintenance', 'Transport', 'Marketing', 'Miscellaneous'];
    for (const c of cats) {
      run('INSERT INTO expense_categories(name) VALUES(?)', [c]);
    }
  }

  // Seed default settings if empty
  const settingsCount = one('SELECT COUNT(*) count FROM settings');
  if (settingsCount && settingsCount.count === 0) {
    const defaults = [
      ['academy_name', 'AcademyPro Academy', 'academy'],
      ['academy_address', 'Main Campus, Pakistan', 'academy'],
      ['academy_phone', '+92-300-0000000', 'academy'],
      ['academy_email', 'info@academypro.local', 'academy'],
      ['academy_website', '', 'academy'],
      ['currency', 'PKR', 'academy'],
      ['timezone', 'Asia/Karachi', 'academy'],
      ['academic_year', new Date().getFullYear().toString(), 'academy'],
      ['academic_session', '2024-2025', 'academy'],
      ['attendance_lock_days', '7', 'rules'],
      ['late_fee_per_day', '100', 'rules'],
      ['max_file_size', '10485760', 'system'],
    ];
    for (const [k, v, cat] of defaults) {
      run('INSERT INTO settings(key,value,category) VALUES(?,?,?)', [k, v, cat]);
    }
  }
}
