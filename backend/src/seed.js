import bcrypt from 'bcryptjs';
import { initDb, one, run, query } from './db.js';

await initDb();

function makeNumber(prefix = 'AP') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}

function monthStr(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 7);
}

// Branches
let b1 = one('SELECT id FROM branches WHERE code="MAIN"');
if (!b1) {
  run("INSERT INTO branches(name,code,address,phone,email) VALUES('Main Campus','MAIN','123 Education Street, Lahore','+92-300-1111111','main@academypro.local')");
  b1 = one('SELECT id FROM branches WHERE code="MAIN"');
}

let b2 = one('SELECT id FROM branches WHERE code="BR2"');
if (!b2) {
  run("INSERT INTO branches(name,code,address,phone,email) VALUES('Downtown Branch','BR2','456 Knowledge Ave, Karachi','+92-300-2222222','downtown@academypro.local')");
  b2 = one('SELECT id FROM branches WHERE code="BR2"');
}

// Admin user
let admin = one("SELECT id FROM users WHERE email='admin@academypro.local'");
if (!admin) {
  const hash = await bcrypt.hash('Admin@123', 12);
  run("INSERT INTO users(branch_id,name,email,password_hash,role,phone) VALUES(?,?,?,?,?,?)",
    [b1.id, 'System Administrator', 'admin@academypro.local', hash, 'super_admin', '03000000000']);
  admin = one("SELECT id FROM users WHERE email='admin@academypro.local'");
}

// Academy Admin
let acadAdmin = one("SELECT id FROM users WHERE email='academy@academypro.local'");
if (!acadAdmin) {
  const hash = await bcrypt.hash('Admin@123', 12);
  run("INSERT INTO users(branch_id,name,email,password_hash,role,phone) VALUES(?,?,?,?,?,?)",
    [b1.id, 'Academy Manager', 'academy@academypro.local', hash, 'academy_admin', '03001111111']);
}

// Accountant
let accountant = one("SELECT id FROM users WHERE email='accountant@academypro.local'");
if (!accountant) {
  const hash = await bcrypt.hash('Admin@123', 12);
  run("INSERT INTO users(branch_id,name,email,password_hash,role,phone) VALUES(?,?,?,?,?,?)",
    [b1.id, 'Finance Manager', 'accountant@academypro.local', hash, 'accountant', '03002222222']);
}

// Teachers
const teacherNames = [
  ['Ali Khan', 'ali@academypro.local', '03001000001'],
  ['Sara Ahmed', 'sara@academypro.local', '03001000002'],
  ['Usman Malik', 'usman@academypro.local', '03001000003'],
  ['Fatima Bibi', 'fatima@academypro.local', '03001000004'],
  ['Hassan Raza', 'hassan@academypro.local', '03001000005'],
];

const teachers = [];
const hash = await bcrypt.hash('Teacher@123', 12);
for (const [name, email, phone] of teacherNames) {
  let t = one("SELECT id FROM users WHERE email=?", [email]);
  if (!t) {
    run("INSERT INTO users(branch_id,name,email,password_hash,role,phone) VALUES(?,?,?,?,?,?)",
      [b1.id, name, email, hash, 'teacher', phone]);
    t = one("SELECT id FROM users WHERE email=?", [email]);
  }
  teachers.push(t);
}

// Classes
const classData = [
  ['Play Group', 'PG', 'pre-primary'],
  ['Nursery', 'NUR', 'pre-primary'],
  ['Kindergarten', 'KG', 'pre-primary'],
  ['Class 1', 'C1', 'primary'],
  ['Class 2', 'C2', 'primary'],
  ['Class 3', 'C3', 'primary'],
  ['Class 4', 'C4', 'primary'],
  ['Class 5', 'C5', 'primary'],
  ['Class 6', 'C6', 'middle'],
  ['Class 7', 'C7', 'middle'],
  ['Class 8', 'C8', 'middle'],
  ['Class 9', 'C9', 'secondary'],
  ['Class 10', 'C10', 'secondary'],
];

const classes = [];
for (const [name, code, level] of classData) {
  let c = one('SELECT id FROM classes WHERE code=?', [code]);
  if (!c) {
    run("INSERT INTO classes(branch_id,name,code,level) VALUES(?,?,?,?)", [b1.id, name, code, level]);
    c = one('SELECT id FROM classes WHERE code=?', [code]);
  }
  classes.push(c);
}

// Batches
const batches = [];
for (let i = 0; i < classes.length; i++) {
  const cls = classes[i];
  const batchName = `${classData[i][0]} - Section A`;
  let batch = one('SELECT id FROM batches WHERE class_id=? AND name=?', [cls.id, batchName]);
  if (!batch) {
    run("INSERT INTO batches(class_id,branch_id,name,shift,capacity,fee,status) VALUES(?,?,?,?,?,?,?)",
      [cls.id, b1.id, batchName, 'morning', 40, [2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000][i], 'active']);
    batch = one('SELECT id FROM batches WHERE class_id=? AND name=?', [cls.id, batchName]);
  }
  batches.push(batch);
}

// Subjects per class
const subjectNames = ['English', 'Mathematics', 'Urdu', 'Science', 'Social Studies', 'Islamic Studies', 'Computer Science'];
const subjects = [];
for (const cls of classes) {
  for (const subName of subjectNames) {
    let s = one('SELECT id FROM subjects WHERE class_id=? AND name=?', [cls.id, subName]);
    if (!s) {
      run("INSERT INTO subjects(class_id,name,code,max_marks,passing_marks) VALUES(?,?,?,?,?)",
        [cls.id, subName, subName.slice(0, 3).toUpperCase(), 100, 40]);
      s = one('SELECT id FROM subjects WHERE class_id=? AND name=?', [cls.id, subName]);
    }
    subjects.push(s);
  }
}

// Rooms
const roomData = ['Room 101', 'Room 102', 'Room 103', 'Room 201', 'Room 202', 'Room 301', 'Lab 1', 'Lab 2', 'Hall A'];
for (const name of roomData) {
  if (!one('SELECT id FROM rooms WHERE name=?', [name])) {
    run("INSERT INTO rooms(branch_id,name,capacity,type) VALUES(?,?,?,?)", [b1.id, name, 40, name.includes('Lab') ? 'lab' : name.includes('Hall') ? 'hall' : 'classroom']);
  }
}

// Parents
const parentData = [
  ['Ahmed Khan', '03002000001', 'ahmed@email.com'],
  ['Bilal Ahmed', '03002000002', 'bilal@email.com'],
  ['Chaudhry Muhammad', '03002000003', 'chaudhry@email.com'],
  ['Danish Ali', '03002000004', 'danish@email.com'],
  ['Ehsan Ullah', '03002000005', 'ehsan@email.com'],
  ['Farhan Raza', '03002000006', 'farhan@email.com'],
  ['Ghulam Abbas', '03002000007', 'ghulam@email.com'],
  ['Hafeez ur Rehman', '03002000008', 'hafeez@email.com'],
  ['Irfan Haider', '03002000009', 'irfan@email.com'],
  ['Junaid Akram', '03002000010', 'junaid@email.com'],
];

const parents = [];
for (const [name, phone, email] of parentData) {
  let p = one('SELECT id FROM parents WHERE phone=?', [phone]);
  if (!p) {
    run("INSERT INTO parents(name,relation,phone,email,address,occupation) VALUES(?,?,?,?,?,?)",
      [name, 'father', phone, email, 'Lahore', 'Business']);
  }
  p = one('SELECT id FROM parents WHERE phone=?', [phone]);
  parents.push(p);
}

// Students
const firstNames = ['Ayesha', 'Bilal', 'Cumair', 'Dania', 'Eman', 'Faisal', 'Ghania', 'Hassan', 'Inaya', 'Jamal',
  'Kainat', 'Laiba', 'Muhammad', 'Nadia', 'Omar', 'Parisa', 'Qasim', 'Rabia', 'Saad', 'Taimoor',
  'Umer', 'Waleed', 'Xavier', 'Yasir', 'Zainab', 'Ahmed', 'Bushra', 'Daniyal', 'Eshaal', 'Faizan'];

const students = [];
const studentHash = await bcrypt.hash('Student@123', 12);

for (let i = 0; i < firstNames.length; i++) {
  const parent = parents[i % parents.length];
  const batch = batches[Math.min(Math.floor(i / 3), batches.length - 1)];
  const className = classData[Math.min(Math.floor(i / 3), classData.length - 1)][0];
  const admissionNo = `STU-${2024}-${String(i + 1).padStart(3, '0')}`;

  let s = one('SELECT id FROM students WHERE admission_no=?', [admissionNo]);
  if (!s) {
    const monthlyFee = [2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000][Math.min(Math.floor(i / 3), 12)];
    run(
      `INSERT INTO students(branch_id,parent_id,admission_no,name,father_name,gender,dob,phone,address,admission_date,monthly_fee,status)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
      [b1.id, parent?.id, admissionNo, firstNames[i], parentData[i % parentData.length][0],
        i % 2 === 0 ? 'female' : 'male', `${2010 + (i % 8)}-${String((i % 12) + 1).padStart(2, '0')}-15`,
        `0300300${String(i).padStart(4, '0')}`, 'Lahore',
        monthAgo(Math.floor(Math.random() * 6)), monthlyFee, 'active']
    );
    s = one('SELECT id FROM students WHERE admission_no=?', [admissionNo]);
  }
  students.push(s);

  // Assign to batch
  if (s && batch) {
    try {
      run('INSERT OR IGNORE INTO student_batches(student_id,batch_id) VALUES(?,?)', [s.id, batch.id]);
    } catch {}
  }
}

// Generate fee invoices for last 3 months
for (let m = 0; m < 3; m++) {
  const month = monthStr(m);
  for (const s of students.slice(0, 15)) { // First 15 students
    const student = one('SELECT * FROM students WHERE id=?', [s.id]);
    if (!student) continue;
    if (!one('SELECT id FROM fee_invoices WHERE student_id=? AND billing_month=?', [s.id, month])) {
      const invNo = `INV-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
      run(
        `INSERT INTO fee_invoices(student_id,invoice_no,billing_month,amount,discount,due_date,status) VALUES(?,?,?,?,?,?,?)`,
        [s.id, invNo, month, student.monthly_fee, student.discount || 0, `${month}-10`, m === 0 ? 'unpaid' : 'paid']
      );
    }
  }
}

// Record payments for past months
for (let m = 1; m < 3; m++) {
  const month = monthStr(m);
  for (const s of students.slice(0, 15)) {
    const inv = one('SELECT id FROM fee_invoices WHERE student_id=? AND billing_month=?', [s.id, month]);
    if (inv && !one('SELECT id FROM payments WHERE invoice_id=?', [inv.id])) {
      const student = one('SELECT * FROM students WHERE id=?', [s.id]);
      run(
        `INSERT INTO payments(student_id,invoice_id,receipt_no,amount,method,paid_at,created_by) VALUES(?,?,?,?,?,?,?)`,
        [s.id, inv.id, `REC-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`, student?.monthly_fee || 0, 'cash', `${month}-05`, admin.id]
      );
    }
  }
}

// Attendance for last 7 days
for (let d = 0; d < 7; d++) {
  const date = new Date();
  date.setDate(date.getDate() - d);
  const dateStr = date.toISOString().slice(0, 10);
  if (date.getDay() === 0) continue; // Skip Sunday

  for (const s of students.slice(0, 20)) {
    const statuses = ['present', 'present', 'present', 'present', 'absent', 'late'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    try {
      run(
        'INSERT OR IGNORE INTO attendance(student_id,batch_id,date,status,marked_by) VALUES(?,?,?,?,?)',
        [s.id, batches[0]?.id, dateStr, status, admin.id]
      );
    } catch {}
  }
}

// Teacher attendance for last 5 days
for (let d = 0; d < 5; d++) {
  const date = new Date();
  date.setDate(date.getDate() - d);
  const dateStr = date.toISOString().slice(0, 10);
  if (date.getDay() === 0) continue;
  for (const t of teachers) {
    try {
      run('INSERT OR IGNORE INTO teacher_attendance(teacher_id,date,status) VALUES(?,?,?)',
        [t.id, dateStr, Math.random() > 0.1 ? 'present' : 'late']);
    } catch {}
  }
}

// Teacher assignments
for (let i = 0; i < teachers.length; i++) {
  const batch = batches[i];
  const subIdx = (i * 7) % subjects.length;
  if (!one('SELECT id FROM teacher_assignments WHERE teacher_id=? AND batch_id=?', [teachers[i].id, batch.id])) {
    run('INSERT INTO teacher_assignments(teacher_id,batch_id,subject_id) VALUES(?,?,?)',
      [teachers[i].id, batch.id, subjects[subIdx]?.id]);
  }
}

// Timetable
for (let day = 0; day < 5; day++) {
  for (let period = 0; period < 6; period++) {
    const batch = batches[period % batches.length];
    const teacher = teachers[period % teachers.length];
    const subIdx = (day * 6 + period) % subjects.length;
    const roomIdx = period % 9;
    const rooms = query('SELECT id FROM rooms');
    if (!one('SELECT id FROM timetable WHERE batch_id=? AND day_of_week=? AND start_time=?',
      [batch.id, day, `${8 + period}:00`])) {
      run(
        'INSERT INTO timetable(branch_id,batch_id,teacher_id,subject_id,room_id,day_of_week,start_time,end_time) VALUES(?,?,?,?,?,?,?,?)',
        [b1.id, batch.id, teacher.id, subjects[subIdx]?.id, rooms[roomIdx]?.id, day, `${8 + period}:00`, `${9 + period}:00`]
      );
    }
  }
}

// Exams
const examTypes = ['Midterm', 'Final', 'Unit Test', 'Quiz'];
for (let i = 0; i < 4; i++) {
  if (!one('SELECT id FROM exams WHERE name=?', [`${examTypes[i]} ${new Date().getFullYear()}`])) {
    run(
      `INSERT INTO exams(name,session,type,class_id,batch_id,start_date,end_date,status) VALUES(?,?,?,?,?,?,?,?)`,
      [`${examTypes[i]} ${new Date().getFullYear()}`, '2024-2025', examTypes[i].toLowerCase(),
        classes[Math.min(i, classes.length - 1)].id, batches[Math.min(i, batches.length - 1)].id,
        monthAgo(2 - i), monthAgo(2 - i), i < 2 ? 'completed' : 'draft']
    );
  }
}

// Exam results for completed exams
const completedExams = query("SELECT * FROM exams WHERE status='completed'");
for (const exam of completedExams) {
  const classSubjects = subjects.filter(s => s.class_id === exam.class_id);
  for (const s of students.slice(0, 10)) {
    for (const sub of classSubjects.slice(0, 4)) {
      if (one('SELECT id FROM exam_results WHERE exam_id=? AND student_id=? AND subject_id=?', [exam.id, s.id, sub.id])) continue;
      const marks = Math.floor(Math.random() * 60) + 40;
      const p = (marks / 100) * 100;
      let grade = 'F';
      if (p >= 90) grade = 'A+';
      else if (p >= 80) grade = 'A';
      else if (p >= 70) grade = 'B+';
      else if (p >= 60) grade = 'B';
      else if (p >= 50) grade = 'C';
      else if (p >= 40) grade = 'D';

      run(
        'INSERT INTO exam_results(exam_id,student_id,subject_id,obtained_marks,total_marks,grade) VALUES(?,?,?,?,?,?)',
        [exam.id, s.id, sub.id, marks, 100, grade]
      );
    }
  }
}

// Expenses
const expenseCategories = ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Maintenance'];
const months = [0, 1, 2];
for (const m of months) {
  for (const cat of expenseCategories) {
    const amount = cat === 'Rent' ? 50000 : cat === 'Salaries' ? 150000 : Math.floor(Math.random() * 20000) + 5000;
    if (!one('SELECT id FROM expenses WHERE category=? AND date=?', [cat, `${monthStr(m)}-05`])) {
      run(
        'INSERT INTO expenses(branch_id,category,amount,date,description,payment_method,created_by) VALUES(?,?,?,?,?,?,?)',
        [b1.id, cat, amount, `${monthStr(m)}-05`, `${cat} for ${monthStr(m)}`, 'bank', admin.id]
      );
    }
  }
}

// Events
if (!one("SELECT id FROM events WHERE title='Annual Day'")) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 15);
  run("INSERT INTO events(branch_id,title,event_date,start_time,end_time,location,description,type) VALUES(?,?,?,?,?,?,?,?)",
    [b1.id, 'Annual Day', futureDate.toISOString().slice(0, 10), '10:00', '14:00', 'Main Hall', 'Annual celebration with prizes and performances', 'celebration']);
}

// Inventory
const invItems = [
  ['Notebooks', 'Stationery', 500, 'pcs', 20, 100],
  ['Pens', 'Stationery', 200, 'pcs', 5, 50],
  ['Whiteboard Markers', 'Supplies', 50, 'pcs', 50, 20],
  ['Printer Paper', 'Supplies', 30, 'reams', 300, 10],
  ['Chairs', 'Furniture', 100, 'pcs', 2000, 10],
];

for (const [name, cat, qty, unit, cost, reorder] of invItems) {
  if (!one('SELECT id FROM inventory WHERE item_name=?', [name])) {
    run('INSERT INTO inventory(branch_id,item_name,category,quantity,unit,unit_cost,reorder_level) VALUES(?,?,?,?,?,?,?)',
      [b1.id, name, cat, qty, unit, cost, reorder]);
  }
}

// Notifications
if (!one("SELECT id FROM notifications WHERE title='Welcome to AcademyPro'")) {
  run("INSERT INTO notifications(title,message,type,audience,status,sent_at,created_by) VALUES(?,?,?,?,?,?,?)",
    ['Welcome to AcademyPro', 'Welcome to the Academy Management System. Explore all features from the sidebar.', 'general', 'all', 'sent', new Date().toISOString(), admin.id]);
}

// Scholarships
for (const s of students.slice(0, 3)) {
  if (!one('SELECT id FROM scholarships WHERE student_id=?', [s.id])) {
    run('INSERT INTO scholarships(student_id,name,type,amount,percent,start_date,status) VALUES(?,?,?,?,?,?,?)',
      [s.id, 'Merit Scholarship', 'percent', 0, 20, monthAgo(6), 'active']);
  }
}

import { persist } from './db.js'; persist();
console.log('Seed complete! Database populated with demo data.');
console.log('Login: admin@academypro.local / Admin@123');
process.exit(0);
