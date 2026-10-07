import { Router } from 'express';
import { query, one } from '../db.js';
import { today } from '../utils.js';
import { branchFilter } from '../auth.js';

const router = Router();

router.get('/', (req, res) => {
  const bf = branchFilter(req);
  const studentBranch = req.user.role === 'super_admin' ? '' : ` AND p.student_id IN (SELECT id FROM students WHERE branch_id=${Number(req.user.branchId) || 0})`;
  const expenseBranch = req.user.role === 'super_admin' ? '' : ` AND branch_id=${Number(req.user.branchId) || 0}`;

  // Basic counts
  const totalStudents = one(`SELECT COUNT(*) count FROM students WHERE status='active'${bf}`)?.count || 0;
  const totalTeachers = one(`SELECT COUNT(*) count FROM users WHERE role='teacher' AND status='active'${bf}`)?.count || 0;
  const totalClasses = one(`SELECT COUNT(*) count FROM classes WHERE status='active'${bf}`)?.count || 0;
  const totalBatches = one(`SELECT COUNT(*) count FROM batches WHERE status='active'${bf}`)?.count || 0;
  const totalParents = one(`SELECT COUNT(*) count FROM parents`)?.count || 0;

  // New admissions (last 30 days)
  const newAdmissions = one(`SELECT COUNT(*) count FROM students WHERE admission_date >= date('now','-30 days')${bf}`)?.count || 0;

  // Financials
  const income = one(`SELECT COALESCE(SUM(p.amount),0) total FROM payments p WHERE 1=1${studentBranch}`)?.total || 0;
  const monthlyIncome = one(`SELECT COALESCE(SUM(p.amount),0) total FROM payments p WHERE date(p.paid_at) >= date('now','start of month')${studentBranch}`)?.total || 0;
  const totalExpenses = one(`SELECT COALESCE(SUM(amount),0) total FROM expenses WHERE 1=1${expenseBranch}`)?.total || 0;
  const monthlyExpenses = one(`SELECT COALESCE(SUM(amount),0) total FROM expenses WHERE date >= date('now','start of month')${expenseBranch}`)?.total || 0;
  const pendingFees = one(`SELECT COALESCE(SUM(i.amount-i.discount-i.scholarship_discount+i.fine+i.previous_due),0) total FROM fee_invoices i JOIN students s ON s.id=i.student_id WHERE i.status != 'paid'${req.user.role === 'super_admin' ? '' : ` AND s.branch_id=${Number(req.user.branchId) || 0}`}`)?.total || 0;

  // Today's attendance
  const td = today();
  const attendanceToday = one(`SELECT COUNT(*) total, SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) present, SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) absent, SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) late FROM attendance WHERE date=?`, [td]);

  // Student growth data (last 6 months)
  const studentGrowth = query(`
    SELECT strftime('%Y-%m', admission_date) as month, COUNT(*) count
    FROM students
    WHERE admission_date >= date('now', '-6 months')
    GROUP BY month ORDER BY month
  `);

  // Fee collection trend (last 6 months)
  const feeTrend = query(`
    SELECT strftime('%Y-%m', paid_at) as month, SUM(amount) amount
    FROM payments
    WHERE paid_at >= date('now', '-6 months')
    GROUP BY month ORDER BY month
  `);

  // Expense trend (last 6 months)
  const expenseTrend = query(`
    SELECT strftime('%Y-%m', date) as month, SUM(amount) amount
    FROM expenses
    WHERE date >= date('now', '-6 months')
    GROUP BY month ORDER BY month
  `);

  // Class/batch distribution
  const classDistribution = query(`
    SELECT c.name, COUNT(sb.id) student_count
    FROM classes c
    LEFT JOIN batches b ON b.class_id = c.id
    LEFT JOIN student_batches sb ON sb.batch_id = b.id AND sb.active = 1
    WHERE c.status = 'active'
    GROUP BY c.id ORDER BY student_count DESC
  `);

  // Attendance trend (last 7 days)
  const attendanceTrend = query(`
    SELECT date, COUNT(*) total, SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) present
    FROM attendance
    WHERE date >= date('now', '-7 days')
    GROUP BY date ORDER BY date
  `);

  // Recent activity
  const recentPayments = query(`SELECT p.*,s.name student_name FROM payments p JOIN students s ON s.id=p.student_id ORDER BY p.id DESC LIMIT 8`);
  const recentAdmissions = query(`SELECT * FROM students ORDER BY id DESC LIMIT 5`);
  const upcomingExams = query(`SELECT * FROM exams WHERE start_date >= date('now') AND status != 'cancelled' ORDER BY start_date LIMIT 6`);
  const upcomingEvents = query(`SELECT * FROM events WHERE event_date >= date('now') AND status != 'cancelled' ORDER BY event_date LIMIT 6`);
  const lowStock = query(`SELECT * FROM inventory WHERE quantity <= reorder_level AND status='active' LIMIT 8`);
  const recentNotifications = query(`SELECT * FROM notifications WHERE status='sent' ORDER BY id DESC LIMIT 5`);

  res.json({
    cards: {
      students: totalStudents,
      teachers: totalTeachers,
      classes: totalClasses,
      batches: totalBatches,
      parents: totalParents,
      newAdmissions,
      income,
      monthlyIncome,
      expenses: totalExpenses,
      monthlyExpenses,
      net: Number(income) - Number(totalExpenses),
      pendingFees,
      attendance: Number(attendanceToday?.present || 0),
      attendanceTotal: Number(attendanceToday?.total || 0),
      attendanceAbsent: Number(attendanceToday?.absent || 0),
      attendanceLate: Number(attendanceToday?.late || 0),
    },
    charts: {
      studentGrowth,
      feeTrend,
      expenseTrend,
      classDistribution,
      attendanceTrend,
    },
    recentPayments,
    recentAdmissions,
    upcomingExams,
    upcomingEvents,
    lowStock,
    recentNotifications,
  });
});

export default router;
