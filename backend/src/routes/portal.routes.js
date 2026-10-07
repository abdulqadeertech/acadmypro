import { Router } from 'express';
import { query, one } from '../db.js';
import { hasPermission } from '../auth.js';

const router = Router();

// Portal - get user info and related data
router.get('/me', (req, res) => {
  const user = req.user;
  const result = { user, children: [], attendance: [], fees: [], results: [], timetable: [] };

  if (user.role === 'parent') {
    // Find children via parent link
    const parent = one('SELECT * FROM parents WHERE user_id=? OR phone=(SELECT phone FROM users WHERE id=?)', [user.id, user.id]);
    if (parent) {
      result.children = query('SELECT * FROM students WHERE parent_id=?', [parent.id]);
    }
  } else if (user.role === 'teacher') {
    // Teacher's assigned batches and subjects
    result.assignments = query(
      `SELECT ta.*, b.name batch_name, s.name subject_name
       FROM teacher_assignments ta
       LEFT JOIN batches b ON b.id=ta.batch_id
       LEFT JOIN subjects s ON s.id=ta.subject_id
       WHERE ta.teacher_id=?`, [user.id]
    );
  } else {
    // Admin sees summary
    result.summary = {
      students: one("SELECT COUNT(*) count FROM students WHERE status='active'")?.count || 0,
      teachers: one("SELECT COUNT(*) count FROM users WHERE role='teacher' AND status='active'")?.count || 0,
      classes: one("SELECT COUNT(*) count FROM classes WHERE status='active'")?.count || 0,
    };
  }

  res.json(result);
});

// Student portal (when student has a user account)
router.get('/student/:id', (req, res) => {
  const student = one('SELECT * FROM students WHERE id=?', [req.params.id]);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  let allowed = req.user.role === 'super_admin';
  if (req.user.role === 'parent') {
    allowed = Boolean(one(
      `SELECT s.id FROM students s JOIN parents p ON p.id=s.parent_id
       WHERE s.id=? AND (p.user_id=? OR p.phone=(SELECT phone FROM users WHERE id=?))`,
      [req.params.id, req.user.id, req.user.id]
    ));
  } else if (req.user.role === 'teacher') {
    allowed = Boolean(one(
      `SELECT s.id FROM students s JOIN student_batches sb ON sb.student_id=s.id AND sb.active=1
       JOIN teacher_assignments ta ON ta.batch_id=sb.batch_id WHERE s.id=? AND ta.teacher_id=?`,
      [req.params.id, req.user.id]
    ));
  } else if (req.user.branchId) {
    allowed = Number(student.branch_id) === Number(req.user.branchId);
  }
  if (!allowed) return res.status(403).json({ message: 'You do not have access to this student' });

  const attendance = query(
    `SELECT * FROM attendance WHERE student_id=? ORDER BY date DESC LIMIT 30`,
    [req.params.id]
  );

  const fees = query(
    `SELECT i.*, COALESCE((SELECT SUM(amount) FROM payments p WHERE p.invoice_id=i.id),0) paid
     FROM fee_invoices i WHERE i.student_id=? ORDER BY i.id DESC`,
    [req.params.id]
  );

  const results = query(
    `SELECT r.*, e.name exam_name, s.name subject_name
     FROM exam_results r JOIN exams e ON e.id=r.exam_id JOIN subjects s ON s.id=r.subject_id
     WHERE r.student_id=? ORDER BY e.start_date DESC`,
    [req.params.id]
  );

  const timetable = query(
    `SELECT t.*, b.name batch_name, s.name subject_name, u.name teacher_name, r.name room_name
     FROM timetable t
     LEFT JOIN batches b ON b.id=t.batch_id
     LEFT JOIN subjects s ON s.id=t.subject_id
     LEFT JOIN users u ON u.id=t.teacher_id
     LEFT JOIN rooms r ON r.id=t.room_id
     JOIN student_batches sb ON sb.batch_id=t.batch_id AND sb.active=1
     WHERE sb.student_id=? ORDER BY t.day_of_week, t.start_time`,
    [req.params.id]
  );

  res.json({ student, attendance, fees, results, timetable });
});

export default router;
