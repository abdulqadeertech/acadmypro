import { Router } from 'express';
import { query, one } from '../db.js';
import { today } from '../utils.js';
import { requirePermission } from '../auth.js';

const router = Router();

// Finance report
router.get('/finance', requirePermission('reports.view'), (req, res) => {
  const from = req.query.from || new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const to = req.query.to || today();
  const branchId = req.query.branch_id;

  const branchCond = branchId ? ` AND p.student_id IN (SELECT id FROM students WHERE branch_id=${Number(branchId)})` : '';
  const branchCond2 = branchId ? ` AND e.branch_id=${Number(branchId)}` : '';

  const collections = query(
    `SELECT date(paid_at) date, SUM(amount) amount, COUNT(*) count
     FROM payments WHERE date(paid_at) BETWEEN ? AND ?${branchCond}
     GROUP BY date ORDER BY date`,
    [from, to]
  );

  const expenses = query(
    `SELECT date, SUM(amount) amount, category, COUNT(*) count
     FROM expenses WHERE date BETWEEN ? AND ?${branchCond2}
     GROUP BY date ORDER BY date`,
    [from, to]
  );

  const expenseByCategory = query(
    `SELECT category, SUM(amount) amount
     FROM expenses WHERE date BETWEEN ? AND ?${branchCond2}
     GROUP BY category ORDER BY amount DESC`,
    [from, to]
  );

  const summary = one(
    `SELECT
      (SELECT COALESCE(SUM(amount),0) FROM payments WHERE date(paid_at) BETWEEN ? AND ?${branchCond}) income,
      (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE date BETWEEN ? AND ?${branchCond2}) expenses,
      (SELECT COALESCE(SUM(discount),0) FROM payments p JOIN fee_invoices i ON i.id=p.invoice_id WHERE date(p.paid_at) BETWEEN ? AND ?) discounts,
      (SELECT COALESCE(SUM(amount),0) FROM fee_invoices WHERE status != 'paid') pending_fees`,
    [from, to, from, to, from, to]
  );

  res.json({ from, to, collections, expenses, expenseByCategory, summary: { ...summary, net: Number(summary.income || 0) - Number(summary.expenses || 0) } });
});

// Fee collection report
router.get('/fees', requirePermission('reports.view'), (req, res) => {
  const from = req.query.from || '';
  const to = req.query.to || '';
  const classId = req.query.class_id;
  const batchId = req.query.batch_id;

  let where = 'WHERE 1=1';
  const params = [];
  if (from) { where += ' AND i.billing_month >= ?'; params.push(from); }
  if (to) { where += ' AND i.billing_month <= ?'; params.push(to); }
  if (classId) { where += ' AND s.id IN (SELECT sb.student_id FROM student_batches sb JOIN batches b ON b.id=sb.batch_id WHERE b.class_id=?)'; params.push(classId); }
  if (batchId) { where += ' AND s.id IN (SELECT sb.student_id FROM student_batches sb WHERE sb.batch_id=?)'; params.push(batchId); }

  const invoices = query(
    `SELECT i.*, s.name student_name, s.admission_no,
      COALESCE((SELECT SUM(amount) FROM payments p WHERE p.invoice_id=i.id),0) paid,
      (i.amount - i.discount - i.scholarship_discount + i.fine + i.previous_due - COALESCE((SELECT SUM(amount) FROM payments p2 WHERE p2.invoice_id=i.id),0)) balance
     FROM fee_invoices i JOIN students s ON s.id=i.student_id ${where}
     ORDER BY i.id DESC`,
    params
  );

  const summary = one(
    `SELECT COUNT(*) total, SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END) paid, SUM(CASE WHEN status!='paid' THEN 1 ELSE 0 END) unpaid,
      SUM(amount) total_amount, SUM(discount) discounts, SUM(fine) fines
     FROM fee_invoices i ${where}`,
    params
  );

  res.json({ invoices, summary });
});

// Attendance report
router.get('/attendance', requirePermission('reports.view'), (req, res) => {
  const from = req.query.from || new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const to = req.query.to || today();
  const classId = req.query.class_id;
  const batchId = req.query.batch_id;

  let studentWhere = '';
  const params = [];
  if (classId) {
    studentWhere = ' AND s.id IN (SELECT sb.student_id FROM student_batches sb JOIN batches b ON b.id=sb.batch_id WHERE b.class_id=?)';
    params.push(classId);
  } else if (batchId) {
    studentWhere = ' AND s.id IN (SELECT sb.student_id FROM student_batches sb WHERE sb.batch_id=?)';
    params.push(batchId);
  }

  const studentAttendance = query(
    `SELECT s.id, s.name, s.admission_no,
      COUNT(a.id) total_days,
      SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) present,
      SUM(CASE WHEN a.status='absent' THEN 1 ELSE 0 END) absent,
      SUM(CASE WHEN a.status='late' THEN 1 ELSE 0 END) late,
      SUM(CASE WHEN a.status='leave' THEN 1 ELSE 0 END) leave_count,
      ROUND(100.0*SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END)/NULLIF(COUNT(a.id),0),2) percentage
     FROM students s
     LEFT JOIN attendance a ON a.student_id=s.id AND a.date BETWEEN ? AND ?
     WHERE s.status='active'${studentWhere}
     GROUP BY s.id ORDER BY percentage DESC`,
    [from, to, ...params]
  );

  // Daily summary
  const dailySummary = query(
    `SELECT date, COUNT(*) total,
      SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) present,
      SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) absent,
      SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) late,
      ROUND(100.0*SUM(CASE WHEN status='present' THEN 1 ELSE 0 END)/NULLIF(COUNT(*),0),2) percentage
     FROM attendance WHERE date BETWEEN ? AND ?
     GROUP BY date ORDER BY date`,
    [from, to]
  );

  res.json({ studentAttendance, dailySummary, from, to });
});

// Teacher attendance report
router.get('/teacher-attendance', requirePermission('reports.view'), (req, res) => {
  const from = req.query.from || new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const to = req.query.to || today();

  const data = query(
    `SELECT u.id, u.name,
      COUNT(a.id) total_days,
      SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) present,
      SUM(CASE WHEN a.status='absent' THEN 1 ELSE 0 END) absent,
      SUM(CASE WHEN a.status='late' THEN 1 ELSE 0 END) late,
      SUM(CASE WHEN a.status='leave' THEN 1 ELSE 0 END) leave_count,
      ROUND(100.0*SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END)/NULLIF(COUNT(a.id),0),2) percentage
     FROM users u
     LEFT JOIN teacher_attendance a ON a.teacher_id=u.id AND a.date BETWEEN ? AND ?
     WHERE u.role='teacher' AND u.status='active'
     GROUP BY u.id ORDER BY percentage DESC`,
    [from, to]
  );

  res.json({ data, from, to });
});

// Exam results report
router.get('/exam-results', requirePermission('reports.view'), (req, res) => {
  const examId = req.query.exam_id;
  const classId = req.query.class_id;
  const batchId = req.query.batch_id;

  let where = 'WHERE 1=1';
  const params = [];
  if (examId) { where += ' AND er.exam_id=?'; params.push(examId); }

  const results = query(
    `SELECT er.*, s.name student_name, s.admission_no, sub.name subject_name, e.name exam_name, e.session
     FROM exam_results er
     JOIN students s ON s.id=er.student_id
     JOIN subjects sub ON sub.id=er.subject_id
     JOIN exams e ON e.id=er.exam_id
     ${where} ORDER BY s.name, sub.name`,
    params
  );

  // Class performance
  const performance = query(
    `SELECT s.name student_name, s.id student_id,
      COUNT(er.id) subjects,
      SUM(er.obtained_marks) total_obtained,
      SUM(er.total_marks) total_marks,
      ROUND(100.0*SUM(er.obtained_marks)/NULLIF(SUM(er.total_marks),0),2) percentage,
      er.grade
     FROM students s
     LEFT JOIN exam_results er ON er.student_id=s.id
     ${where}
     GROUP BY s.id
     ORDER BY percentage DESC`,
    params
  );

  res.json({ results, performance });
});

// Student performance report
router.get('/student-performance/:id', requirePermission('reports.view'), (req, res) => {
  const identifier = req.params.id;
  const student = one('SELECT * FROM students WHERE id=? OR admission_no=?', [identifier, identifier]);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  const studentId = student.id;

  const results = query(
    `SELECT er.*, e.name exam_name, e.session, e.type, sub.name subject_name
     FROM exam_results er
     JOIN exams e ON e.id=er.exam_id
     JOIN subjects sub ON sub.id=er.subject_id
     WHERE er.student_id=? ORDER BY e.start_date DESC, sub.name`,
    [studentId]
  );

  const attendance = one(
    `SELECT COUNT(*) total,
      SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) present,
      SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) absent,
      SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) late,
      ROUND(100.0*SUM(CASE WHEN status='present' THEN 1 ELSE 0 END)/NULLIF(COUNT(*),0),2) percentage
     FROM attendance WHERE student_id=?`,
    [studentId]
  );

  const payments = query(
    `SELECT p.*, i.billing_month FROM payments p
     LEFT JOIN fee_invoices i ON i.id=p.invoice_id
     WHERE p.student_id=? ORDER BY p.paid_at DESC LIMIT 20`,
    [studentId]
  );

  res.json({ student, results, attendance, payments });
});

// Report card
router.get('/report-card/:studentId', requirePermission('reports.view'), (req, res) => {
  const identifier = req.params.studentId;
  const student = one('SELECT * FROM students WHERE id=? OR admission_no=?', [identifier, identifier]);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  const studentId = student.id;

  const examId = req.query.exam_id;
  let where = `WHERE er.student_id=?`;
  const params = [studentId];
  if (examId) { where += ' AND er.exam_id=?'; params.push(examId); }

  const results = query(
    `SELECT er.*, e.name exam_name, e.session, e.type, sub.name subject_name
     FROM exam_results er
     JOIN exams e ON e.id=er.exam_id
     JOIN subjects sub ON sub.id=er.subject_id
     ${where} ORDER BY e.start_date DESC, sub.name`,
    params
  );

  // Get batch/class info
  const batchInfo = one(
    `SELECT b.name batch_name, c.name class_name, c.id class_id
     FROM student_batches sb
     JOIN batches b ON b.id=sb.batch_id
     JOIN classes c ON c.id=b.class_id
     WHERE sb.student_id=? AND sb.active=1
     LIMIT 1`,
    [studentId]
  );

  // Attendance summary for the exam period
  const attendance = one(
    `SELECT COUNT(*) total, SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) present
     FROM attendance WHERE student_id=?`,
    [studentId]
  );

  // Academy settings
  const settings = {};
  query("SELECT key, value FROM settings WHERE category='academy'").forEach(s => settings[s.key] = s.value);

  // Ranking
  let ranking = null;
  if (results.length > 0 && batchInfo) {
    const firstExam = results[0];
    ranking = one(
      `SELECT COUNT(*) total,
        SUM(CASE WHEN avg_pct > ? THEN 1 ELSE 0 END) + 1 as position
       FROM (
         SELECT er.student_id, AVG(100.0*er.obtained_marks/er.total_marks) avg_pct
         FROM exam_results er
         JOIN students s ON s.id=er.student_id
         JOIN student_batches sb ON sb.student_id=s.id AND sb.active=1
         WHERE sb.batch_id=(SELECT batch_id FROM student_batches WHERE student_id=? AND active=1 LIMIT 1)
         AND er.exam_id=?
         GROUP BY er.student_id
       )`,
      [results.reduce((sum, r) => sum + (r.obtained_marks / r.total_marks * 100), 0) / results.length, studentId, firstExam.exam_id]
    );
  }

  res.json({ student, results, batchInfo, attendance, settings, ranking });
});

// Academic ranking
router.get('/ranking', requirePermission('reports.view'), (req, res) => {
  const examId = req.query.exam_id;
  const batchId = req.query.batch_id;

  let where = 'WHERE 1=1';
  const params = [];
  if (examId) { where += ' AND er.exam_id=?'; params.push(examId); }
  if (batchId) { where += ' AND sb.batch_id=?'; params.push(batchId); }

  const ranking = query(
    `SELECT s.id, s.name, s.admission_no, b.name batch_name,
      ROUND(AVG(100.0*er.obtained_marks/er.total_marks),2) percentage,
      SUM(er.obtained_marks) total_obtained,
      SUM(er.total_marks) total_marks,
      COUNT(er.id) subjects
     FROM exam_results er
     JOIN students s ON s.id=er.student_id
     LEFT JOIN student_batches sb ON sb.student_id=s.id AND sb.active=1
     LEFT JOIN batches b ON b.id=sb.batch_id
     ${where}
     GROUP BY s.id ORDER BY percentage DESC`,
    params
  );

  res.json({ ranking });
});

// Teacher workload
router.get('/teacher-workload', requirePermission('reports.view'), (req, res) => {
  const data = query(
    `SELECT u.id, u.name, u.email,
      COUNT(DISTINCT ta.batch_id) assigned_batches,
      COUNT(DISTINCT ta.subject_id) assigned_subjects,
      (SELECT COUNT(*) FROM teacher_attendance WHERE teacher_id=u.id AND date >= date('now','-30 days') AND status='present') attendance_days
     FROM users u
     LEFT JOIN teacher_assignments ta ON ta.teacher_id=u.id
     WHERE u.role='teacher' AND u.status='active'
     GROUP BY u.id ORDER BY assigned_batches DESC`
  );
  res.json({ data });
});

export default router;
