import { Router } from 'express';
import { one, query, run, persist } from '../db.js';
import { allowRoles, requirePermission, hasPermission, auditLog, branchFilter } from '../auth.js';
import { makeNumber, gradeFor, today } from '../utils.js';

const router = Router();

// ===== GENERIC CRUD HELPER =====
function crudRoutes(name, table, baseSelect, fields, options = {}) {
  const {
    searchFields = [], selectTransform, insertHook, updateHook, deleteHook,
    branchScoped = false, permissions = {}, sortFields = ['id'],
  } = options;
  const viewPermission = permissions.view || `${name}.view`;
  const createPermission = permissions.create || `${name}.create`;
  const updatePermission = permissions.update || `${name}.update`;
  const deletePermission = permissions.delete || `${name}.delete`;
  const scopedFilter = (req, alias = '') => {
    if (!branchScoped || req.user.role === 'super_admin') return { sql: '', params: [] };
    const column = alias ? `${alias}.branch_id` : 'branch_id';
    return { sql: ` ${column}=?`, params: [req.user.branchId || 0] };
  };

  // GET all
  router.get('/' + name, requirePermission(viewPermission), (req, res) => {
    let select = baseSelect;
    const params = [];
    let hasWhere = /\bwhere\b/i.test(select);

    // Branch filter for non-super_admin
    const branch = scopedFilter(req);
    if (branch.sql) {
      select += `${hasWhere ? ' AND' : ' WHERE'}${branch.sql}`;
      params.push(...branch.params);
      hasWhere = true;
    }

    // Search
    if (req.query.search && searchFields.length) {
      const s = `%${req.query.search}%`;
      const conditions = searchFields.map(f => `${f} LIKE ?`).join(' OR ');
      select += `${hasWhere ? ' AND ' : ' WHERE '}(${conditions})`;
      hasWhere = true;
      searchFields.forEach(() => params.push(s));
    }

    // Sorting
    const requestedSort = String(req.query.sort || 'id');
    const [requestedColumn, requestedDirection] = requestedSort.split(/\s+/);
    const sortColumn = sortFields.includes(requestedColumn) ? requestedColumn : 'id';
    const sortDirection = requestedDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    select += ` ORDER BY ${sortColumn} ${sortDirection}`;

    // Pagination
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const offset = (page - 1) * limit;

    try {
      const rows = query(select, params);

      // For search, do client-side filtering as SQL LIKE might miss some
      let filteredRows = rows;
      if (req.query.search) {
        const s = req.query.search.toLowerCase();
        filteredRows = rows.filter(r => {
          for (const f of searchFields) {
            if (String(r[f] || '').toLowerCase().includes(s)) return true;
          }
          // Also search all fields as fallback
          for (const key of Object.keys(r)) {
            if (String(r[key] || '').toLowerCase().includes(s)) return true;
          }
          return false;
        });
      }

      const total = filteredRows.length;
      const paged = filteredRows.slice(offset, offset + limit);

      res.json({ data: paged, total, page, limit, pages: Math.ceil(total / limit) });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // GET one
  router.get('/' + name + '/:id', requirePermission(viewPermission), (req, res) => {
    try {
      const branch = scopedFilter(req);
      const row = one(`SELECT * FROM ${table} WHERE id=?${branch.sql ? ` AND${branch.sql}` : ''}`, [Number(req.params.id), ...branch.params]);
      row ? res.json(row) : res.status(404).json({ message: 'Not found' });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // POST create
  router.post('/' + name, requirePermission(createPermission), (req, res) => {
    const body = req.body || {};
    if (branchScoped && req.user.role !== 'super_admin') body.branch_id = req.user.branchId || null;
    let cols = [];
    let vals = [];

    // Apply fields
    const allFields = [...fields];
    if (insertHook) {
      const hookResult = insertHook(body, req);
      if (hookResult.extraFields) allFields.push(...hookResult.extraFields);
      if (hookResult.extraValues) vals.push(...hookResult.extraValues);
    }

    for (const f of allFields) {
      if (body[f] !== undefined && body[f] !== null) {
        cols.push(f);
        vals.push(body[f]);
      }
    }

    // Auto-generate fields
    if (table === 'students' && !cols.includes('admission_no')) {
      cols.push('admission_no');
      vals.push(makeNumber('STU'));
    }
    if (table === 'students' && !cols.includes('admission_date')) {
      cols.push('admission_date');
      vals.push(today());
    }
    if (branchScoped && !cols.includes('branch_id') && req.user.role !== 'super_admin' && req.user.branchId) {
      cols.push('branch_id');
      vals.push(req.user.branchId);
    }
    if (table === 'fee_invoices' && !cols.includes('invoice_no')) {
      cols.push('invoice_no');
      vals.push(makeNumber('INV'));
    }
    if (table === 'payments' && !cols.includes('receipt_no')) {
      cols.push('receipt_no');
      vals.push(makeNumber('REC'));
    }
    if (table === 'payments' && !cols.includes('created_by')) {
      cols.push('created_by');
      vals.push(req.user?.id);
    }
    if (table === 'admissions' && !cols.includes('application_no')) {
      cols.push('application_no');
      vals.push(makeNumber('ADM'));
    }
    if (table === 'expenses' && !cols.includes('created_by')) {
      cols.push('created_by');
      vals.push(req.user?.id);
    }
    if (table === 'payroll' && body.basic_salary !== undefined && body.net_salary === undefined) {
      cols.push('net_salary');
      vals.push(Number(body.basic_salary || 0) + Number(body.allowance || 0) - Number(body.deduction || 0) - Number(body.advance || 0) + Number(body.bonus || 0));
    }

    if (!cols.length) return res.status(400).json({ message: 'No fields supplied' });

    try {
      const newId = run(`INSERT INTO ${table}(${cols.join(',')}) VALUES(${cols.map(() => '?').join(',')})`, vals);
      auditLog(req.user?.id, req.user?.name, 'CREATE', table, newId, `${table} record created`);
      res.status(201).json({ message: 'Created', id: newId });
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  });

  // PUT update
  router.put('/' + name + '/:id', requirePermission(updatePermission), (req, res) => {
    const body = req.body || {};
    if (branchScoped && req.user.role !== 'super_admin') body.branch_id = req.user.branchId || null;
    const id = req.params.id;
    let cols = [];
    let vals = [];

    for (const f of fields) {
      if (body[f] !== undefined) {
        cols.push(f + '=?');
        vals.push(body[f]);
      }
    }

    if (updateHook) updateHook(body, req, cols, vals);

    // Add updated_at
    if (table === 'students' || table === 'users') {
      cols.push('updated_at=CURRENT_TIMESTAMP');
    }

    if (!cols.length) return res.status(400).json({ message: 'No fields supplied' });

    try {
      // Get old value for audit
      const branch = scopedFilter(req);
      const oldVal = one(`SELECT * FROM ${table} WHERE id=?${branch.sql ? ` AND${branch.sql}` : ''}`, [id, ...branch.params]);
      if (!oldVal) return res.status(404).json({ message: 'Not found' });

      run(`UPDATE ${table} SET ${cols.join(',')} WHERE id=?${branch.sql ? ` AND${branch.sql}` : ''}`, [...vals, id, ...branch.params]);
      auditLog(req.user?.id, req.user?.name, 'UPDATE', table, id, `${table} record updated`, null, JSON.stringify(oldVal), JSON.stringify(body));
      res.json({ message: 'Updated' });
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  });

  // DELETE
  router.delete('/' + name + '/:id', requirePermission(deletePermission), (req, res) => {
    try {
      const branch = scopedFilter(req);
      const oldVal = one(`SELECT * FROM ${table} WHERE id=?${branch.sql ? ` AND${branch.sql}` : ''}`, [req.params.id, ...branch.params]);
      if (!oldVal) return res.status(404).json({ message: 'Not found' });
      if (deleteHook) {
        return deleteHook(req.params.id, req, res);
      }
      run(`DELETE FROM ${table} WHERE id=?${branch.sql ? ` AND${branch.sql}` : ''}`, [req.params.id, ...branch.params]);
      auditLog(req.user?.id, req.user?.name, 'DELETE', table, req.params.id, `${table} record deleted`, null, JSON.stringify(oldVal));
      res.json({ message: 'Deleted' });
    } catch (e) {
      res.status(409).json({ message: 'Cannot delete: record may be linked to other data.' });
    }
  });
}

// ===== REGISTER RESOURCES =====

crudRoutes('branches', 'branches',
  'SELECT * FROM branches',
  ['name', 'code', 'address', 'phone', 'email', 'status'],
  { searchFields: ['name', 'code'], permissions: { view: 'branches.view', create: 'branches.create', update: 'branches.update', delete: 'branches.delete' } }
);

crudRoutes('parents', 'parents',
  'SELECT * FROM parents',
  ['name', 'relation', 'phone', 'whatsapp', 'email', 'address', 'occupation', 'cnic', 'photo_url'],
  { searchFields: ['name', 'phone', 'email'], permissions: { view: 'parents.view', create: 'parents.create', update: 'parents.update', delete: 'parents.delete' } }
);

crudRoutes('students', 'students',
  'SELECT s.*,p.name parent_name,p.phone parent_phone FROM students s LEFT JOIN parents p ON p.id=s.parent_id',
  ['branch_id', 'parent_id', 'admission_no', 'roll_no', 'name', 'father_name', 'mother_name', 'dob', 'gender', 'phone', 'whatsapp', 'email', 'address', 'city', 'cnic', 'photo_url', 'admission_date', 'monthly_fee', 'discount', 'status', 'emergency_contact', 'emergency_phone', 'notes'],
  { searchFields: ['name', 'father_name', 'admission_no', 'roll_no', 'phone', 'email'], branchScoped: true, permissions: { view: 'students.view', create: 'students.create', update: 'students.update', delete: 'students.delete' } }
);

crudRoutes('classes', 'classes',
  'SELECT * FROM classes',
  ['branch_id', 'name', 'code', 'level', 'status', 'description'],
  { searchFields: ['name', 'code'], branchScoped: true, permissions: { view: 'classes.view', create: 'classes.create', update: 'classes.update', delete: 'classes.delete' } }
);

crudRoutes('batches', 'batches',
  'SELECT b.*,c.name class_name FROM batches b LEFT JOIN classes c ON c.id=b.class_id',
  ['class_id', 'branch_id', 'name', 'shift', 'room', 'capacity', 'fee', 'start_date', 'end_date', 'status'],
  { searchFields: ['name'], branchScoped: true, permissions: { view: 'classes.view', create: 'classes.create', update: 'classes.update', delete: 'classes.delete' } }
);

crudRoutes('subjects', 'subjects',
  'SELECT * FROM subjects',
  ['class_id', 'name', 'code', 'max_marks', 'passing_marks', 'coefficient'],
  { searchFields: ['name', 'code'], permissions: { view: 'classes.view', create: 'subjects.create', update: 'subjects.update', delete: 'subjects.delete' } }
);

crudRoutes('rooms', 'rooms',
  'SELECT * FROM rooms',
  ['branch_id', 'name', 'capacity', 'type', 'status'],
  { searchFields: ['name'], branchScoped: true, permissions: { view: 'rooms.view', create: 'rooms.create', update: 'rooms.update', delete: 'rooms.delete' } }
);

crudRoutes('fee-structures', 'fee_structures',
  'SELECT * FROM fee_structures',
  ['name', 'class_id', 'admission_fee', 'monthly_fee', 'exam_fee', 'transport_fee', 'other_fee', 'discount', 'status'],
  { searchFields: ['name'], permissions: { view: 'fees.view', create: 'fees.create', update: 'fees.update', delete: 'fees.delete' } }
);

// expenses, exams, fees, payments - handled by explicit handlers below

crudRoutes('expense-categories', 'expense_categories',
  'SELECT * FROM expense_categories',
  ['name', 'status'],
  { searchFields: ['name'], permissions: { view: 'expenses.view', create: 'expenses.create', update: 'expenses.update', delete: 'expenses.delete' } }
);

crudRoutes('inventory', 'inventory',
  'SELECT * FROM inventory',
  ['branch_id', 'item_name', 'category', 'quantity', 'unit', 'unit_cost', 'reorder_level', 'supplier', 'status'],
  { searchFields: ['item_name', 'category'], branchScoped: true, permissions: { view: 'inventory.view', create: 'inventory.create', update: 'inventory.update', delete: 'inventory.delete' } }
);

crudRoutes('events', 'events',
  'SELECT * FROM events',
  ['branch_id', 'title', 'event_date', 'start_time', 'end_time', 'location', 'description', 'type', 'status'],
  { searchFields: ['title'], branchScoped: true, permissions: { view: 'events.view', create: 'events.create', update: 'events.update', delete: 'events.delete' } }
);

crudRoutes('documents', 'documents',
  'SELECT * FROM documents',
  ['entity_type', 'entity_id', 'title', 'file_url', 'file_size', 'document_type', 'uploaded_by'],
  { searchFields: ['title'], permissions: { view: 'documents.view', create: 'documents.create', update: 'documents.update', delete: 'documents.delete' } }
);

crudRoutes('scholarships', 'scholarships',
  'SELECT s.*, st.name student_name FROM scholarships s LEFT JOIN students st ON st.id=s.student_id',
  ['student_id', 'name', 'type', 'amount', 'percent', 'start_date', 'end_date', 'status', 'approved_by'],
  { searchFields: ['name'], permissions: { view: 'scholarships.view', create: 'scholarships.create', update: 'scholarships.update', delete: 'scholarships.delete' } }
);

crudRoutes('leave-requests', 'leave_requests',
  'SELECT lr.*, CASE WHEN lr.person_type="teacher" THEN u.name ELSE s.name END as person_name FROM leave_requests lr LEFT JOIN users u ON u.id=lr.person_id AND lr.person_type="teacher" LEFT JOIN students s ON s.id=lr.person_id AND lr.person_type="student"',
  ['person_type', 'person_id', 'start_date', 'end_date', 'reason', 'status', 'approved_by'],
  { searchFields: ['reason'], permissions: { view: 'leave.view', create: 'leave.create', update: 'leave.approve', delete: 'leave.approve' } }
);

crudRoutes('notifications', 'notifications',
  'SELECT * FROM notifications',
  ['title', 'message', 'type', 'audience', 'target_id', 'target_role', 'scheduled_at', 'sent_at', 'status', 'created_by'],
  { searchFields: ['title', 'message'], permissions: { view: 'notifications.view', create: 'notifications.create', update: 'notifications.create', delete: 'notifications.create' } }
);

crudRoutes('front-office-logs', 'front_office_logs',
  'SELECT * FROM front_office_logs',
  ['branch_id', 'direction', 'log_type', 'person_name', 'phone', 'purpose', 'priority', 'status', 'assigned_to', 'follow_up_date', 'notes', 'checked_in_at', 'checked_out_at', 'created_by'],
  { searchFields: ['person_name', 'phone', 'purpose', 'notes'], branchScoped: true, permissions: { view: 'admissions.view', create: 'admissions.create', update: 'admissions.update', delete: 'admissions.update' } }
);

crudRoutes('messages', 'messages',
  'SELECT m.*, u.name sender_name FROM messages m LEFT JOIN users u ON u.id=m.sender_id',
  ['sender_id', 'recipient_type', 'recipient_id', 'subject', 'message', 'read_at'],
  { searchFields: ['subject', 'message'], permissions: { view: 'messages.view', create: 'messages.create', update: 'messages.create', delete: 'messages.create' } }
);

// ===== TEACHERS (special handling) =====
router.get('/teachers', (req, res) => {
  let select = "SELECT id,name,email,phone,status,branch_id,photo_url,created_at FROM users WHERE role='teacher'";
  if (req.user.role !== 'super_admin' && req.user.branchId) {
    select += ` AND branch_id=${Number(req.user.branchId)}`;
  }
  if (req.query.search) {
    const s = `%${req.query.search}%`;
    select += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
    return res.json(query(select + ' ORDER BY id DESC', [s, s, s]));
  }
  res.json(query(select + ' ORDER BY id DESC'));
});

router.get('/teachers/:id', (req, res) => {
  const teacher = one("SELECT id,name,email,phone,status,branch_id,photo_url,created_at FROM users WHERE id=? AND role='teacher'", [req.params.id]);
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

  // Get assignments
  const assignments = query(
    `SELECT ta.*, b.name batch_name, s.name subject_name
     FROM teacher_assignments ta
     LEFT JOIN batches b ON b.id=ta.batch_id
     LEFT JOIN subjects s ON s.id=ta.subject_id
     WHERE ta.teacher_id=?`, [req.params.id]
  );

  // Get attendance summary
  const attendance = one(
    `SELECT COUNT(*) total, SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) present,
      SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) absent
     FROM teacher_attendance WHERE teacher_id=?`, [req.params.id]
  );

  // Get payroll
  const payroll = query('SELECT * FROM payroll WHERE teacher_id=? ORDER BY month DESC LIMIT 12', [req.params.id]);

  // Get leave requests
  const leaves = query('SELECT * FROM leave_requests WHERE person_type="teacher" AND person_id=? ORDER BY id DESC LIMIT 20', [req.params.id]);

  res.json({ ...teacher, assignments, attendance, payroll, leaves });
});

router.post('/teachers', requirePermission('teachers.create'), async (req, res) => {
  const b = req.body;
  if (!b.name || !b.email) return res.status(400).json({ message: 'Name and email required' });
  try {
    const bcrypt = await import('bcryptjs');
    const hash = b.password ? await bcrypt.hash(b.password, 12) : await bcrypt.hash('Teacher@123', 12);
    const newId = run(
      "INSERT INTO users(name,email,password_hash,role,phone,status,branch_id,photo_url) VALUES(?,?,?,?,?,?,?,?)",
      [b.name, b.email, hash, 'teacher', b.phone || null, b.status || 'active', b.branch_id || req.user.branchId || null, b.photo_url || null]
    );
    auditLog(req.user?.id, req.user?.name, 'CREATE', 'users', newId, `Teacher "${b.name}" created`);
    res.status(201).json({ message: 'Teacher created', id: newId });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.put('/teachers/:id', requirePermission('teachers.update'), (req, res) => {
  const b = req.body;
  try {
    run(
      "UPDATE users SET name=?,email=?,phone=?,status=?,branch_id=?,photo_url=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND role='teacher'",
      [b.name, b.email, b.phone || null, b.status || 'active', b.branch_id || null, b.photo_url || null, req.params.id]
    );
    auditLog(req.user?.id, req.user?.name, 'UPDATE', 'users', req.params.id, `Teacher updated`);
    res.json({ message: 'Updated' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.delete('/teachers/:id', requirePermission('teachers.delete'), (req, res) => {
  run("UPDATE users SET status='inactive' WHERE id=? AND role='teacher'", [req.params.id]);
  auditLog(req.user?.id, req.user?.name, 'DELETE', 'users', req.params.id, `Teacher deactivated`);
  res.json({ message: 'Teacher deactivated' });
});

// ===== ATTENDANCE =====
router.get('/attendance', requirePermission('attendance.view'), (req, res) => {
  const d = req.query.date || today();
  const batchId = req.query.batch_id;

  let select = `SELECT a.*,s.name student_name,s.admission_no,b.name batch_name
    FROM attendance a JOIN students s ON s.id=a.student_id
    LEFT JOIN batches b ON b.id=a.batch_id WHERE a.date=?`;
  const params = [d];

  if (batchId) {
    select += ' AND a.batch_id=?';
    params.push(batchId);
  }

  select += ' ORDER BY s.name';
  res.json(query(select, params));
});

// Get students for attendance marking (by batch)
router.get('/attendance/students', requirePermission('attendance.mark'), (req, res) => {
  const batchId = req.query.batch_id;
  if (!batchId) {
    // Return all active students
    return res.json(query("SELECT id,name,admission_no,branch_id FROM students WHERE status='active' ORDER BY name"));
  }
  res.json(query(
    `SELECT s.id,s.name,s.admission_no,s.branch_id FROM students s
     JOIN student_batches sb ON sb.student_id=s.id AND sb.active=1
     WHERE sb.batch_id=? ORDER BY s.name`,
    [batchId]
  ));
});

router.post('/attendance/bulk', requirePermission('attendance.mark'), (req, res) => {
  const { date = today(), batch_id, records = [] } = req.body;
  for (const r of records) {
    run(
      `INSERT INTO attendance(student_id,batch_id,date,status,note,marked_by) VALUES(?,?,?,?,?,?)
       ON CONFLICT(student_id,batch_id,date) DO UPDATE SET status=excluded.status,note=excluded.note,marked_by=excluded.marked_by`,
      [r.student_id, batch_id || null, date, r.status, r.note || null, req.user?.id || null]
    );
  }
  auditLog(req.user?.id, req.user?.name, 'ATTENDANCE_MARK', 'attendance', null, `Attendance saved for ${date}: ${records.length} records`);
  res.json({ message: 'Attendance saved', count: records.length });
});

// Get student attendance history
router.get('/attendance/student/:id', requirePermission('attendance.view'), (req, res) => {
  const from = req.query.from || new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
  const to = req.query.to || today();
  const data = query(
    `SELECT * FROM attendance WHERE student_id=? AND date BETWEEN ? AND ? ORDER BY date DESC`,
    [req.params.id, from, to]
  );
  const summary = one(
    `SELECT COUNT(*) total, SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) present,
      SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) absent,
      SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) late,
      SUM(CASE WHEN status='leave' THEN 1 ELSE 0 END) leave_count
     FROM attendance WHERE student_id=? AND date BETWEEN ? AND ?`,
    [req.params.id, from, to]
  );
  res.json({ data, summary });
});

// ===== TEACHER ATTENDANCE =====
router.get('/teacher-attendance', requirePermission('teacher_attendance.view'), (req, res) => {
  const d = req.query.date || today();
  // Return ALL active teachers for the date, with existing attendance status if marked,
  // so the marking UI shows the full list instead of only previously-marked rows.
  const rows = query(
    `SELECT u.id AS teacher_id, u.id, u.name, u.email, u.status,
      COALESCE(a.status, 'present') AS status,
      COALESCE(a.note, NULL) AS note,
      a.marked_by, a.id AS attendance_id
     FROM users u
     LEFT JOIN teacher_attendance a ON a.teacher_id=u.id AND a.date=?
     WHERE u.role='teacher' AND u.status='active'
     ORDER BY u.name`,
    [d]
  );
  res.json(rows);
});

router.post('/teacher-attendance/bulk', requirePermission('teacher_attendance.mark'), (req, res) => {
  const { date = today(), records = [] } = req.body;
  for (const r of records) {
    run(
      `INSERT INTO teacher_attendance(teacher_id,date,status,note,marked_by) VALUES(?,?,?,?,?)
       ON CONFLICT(teacher_id,date) DO UPDATE SET status=excluded.status,note=excluded.note,marked_by=excluded.marked_by`,
      [r.teacher_id, date, r.status, r.note || null, req.user?.id || null]
    );
  }
  auditLog(req.user?.id, req.user?.name, 'TEACHER_ATTENDANCE_MARK', 'teacher_attendance', null, `Teacher attendance saved for ${date}`);
  res.json({ message: 'Teacher attendance saved' });
});

// ===== TIMETABLE =====
router.get('/timetable', requirePermission('timetable.view'), (req, res) => {
  let select = `SELECT t.*,b.name batch_name,u.name teacher_name,s.name subject_name,r.name room_name,
    c.name class_name
    FROM timetable t
    LEFT JOIN batches b ON b.id=t.batch_id
    LEFT JOIN users u ON u.id=t.teacher_id
    LEFT JOIN subjects s ON s.id=t.subject_id
    LEFT JOIN rooms r ON r.id=t.room_id
    LEFT JOIN classes c ON c.id=b.class_id`;

  const params = [];
  if (req.query.batch_id) { select += ' WHERE t.batch_id=?'; params.push(req.query.batch_id); }
  if (req.query.teacher_id) { select += params.length ? ' AND' : ' WHERE'; select += ' t.teacher_id=?'; params.push(req.query.teacher_id); }
  if (req.query.day_of_week !== undefined) { select += params.length ? ' AND' : ' WHERE'; select += ' t.day_of_week=?'; params.push(Number(req.query.day_of_week)); }

  select += ' ORDER BY t.day_of_week, t.start_time';
  res.json(query(select, params));
});

router.post('/timetable', requirePermission('timetable.create'), (req, res) => {
  const { branch_id, batch_id, teacher_id, subject_id, room_id, day_of_week, start_time, end_time } = req.body;

  // Conflict detection
  const conflict = one(
    `SELECT id FROM timetable WHERE day_of_week=? AND status='active'
     AND (teacher_id=? OR batch_id=? OR (room_id IS NOT NULL AND room_id=?))
     AND start_time<? AND end_time>?`,
    [day_of_week, teacher_id, batch_id, room_id, end_time, start_time]
  );

  if (conflict) {
    return res.status(409).json({ message: 'Timetable conflict: teacher, batch, or room is already booked during this time.' });
  }

  run(
    `INSERT INTO timetable(branch_id,batch_id,teacher_id,subject_id,room_id,day_of_week,start_time,end_time) VALUES(?,?,?,?,?,?,?,?)`,
    [branch_id, batch_id, teacher_id, subject_id, room_id, day_of_week, start_time, end_time]
  );
  auditLog(req.user?.id, req.user?.name, 'CREATE', 'timetable', null, 'Timetable slot created');
  res.status(201).json({ message: 'Timetable slot created' });
});

router.put('/timetable/:id', requirePermission('timetable.update'), (req, res) => {
  const b = req.body;
  run(
    `UPDATE timetable SET branch_id=?,batch_id=?,teacher_id=?,subject_id=?,room_id=?,day_of_week=?,start_time=?,end_time=?,status=? WHERE id=?`,
    [b.branch_id, b.batch_id, b.teacher_id, b.subject_id, b.room_id, b.day_of_week, b.start_time, b.end_time, b.status || 'active', req.params.id]
  );
  res.json({ message: 'Updated' });
});

router.delete('/timetable/:id', requirePermission('timetable.delete'), (req, res) => {
  run('DELETE FROM timetable WHERE id=?', [req.params.id]);
  auditLog(req.user?.id, req.user?.name, 'DELETE', 'timetable', req.params.id, 'Timetable slot deleted');
  res.json({ message: 'Deleted' });
});

// ===== FEES =====
router.get('/fees', requirePermission('fees.view'), (req, res) => {
  let select = `SELECT i.*,s.name student_name,s.admission_no,
    COALESCE((SELECT SUM(amount) FROM payments p WHERE p.invoice_id=i.id),0) paid,
    (i.amount - i.discount - i.scholarship_discount + i.fine + i.previous_due - COALESCE((SELECT SUM(amount) FROM payments p2 WHERE p2.invoice_id=i.id),0)) balance
    FROM fee_invoices i JOIN students s ON s.id=i.student_id`;

  const params = [];
  if (req.query.student_id) { select += ' WHERE i.student_id=?'; params.push(req.query.student_id); }
  if (req.query.status) { select += params.length ? ' AND' : ' WHERE'; select += ' i.status=?'; params.push(req.query.status); }
  if (req.query.month) { select += params.length ? ' AND' : ' WHERE'; select += ' i.billing_month=?'; params.push(req.query.month); }

  select += ' ORDER BY i.id DESC';
  res.json(query(select, params));
});

router.post('/fees/generate', requirePermission('fees.generate'), (req, res) => {
  const month = req.body.billing_month;
  if (!month) return res.status(400).json({ message: 'billing_month required' });

  let created = 0;
  const students = query("SELECT * FROM students WHERE status='active'");
  for (const s of students) {
    if (!one('SELECT id FROM fee_invoices WHERE student_id=? AND billing_month=?', [s.id, month])) {
      // Calculate previous due
      const prevDue = one(
        `SELECT COALESCE(SUM(amount-discount-scholarship_discount+fine+previous_due),0) - COALESCE((SELECT SUM(amount) FROM payments p WHERE p.student_id=?),0) due FROM fee_invoices WHERE student_id=?`,
        [s.id, s.id]
      )?.due || 0;

      // Check for scholarships
      const scholarship = one(
        `SELECT * FROM scholarships WHERE student_id=? AND status='active' AND (start_date IS NULL OR start_date<=?) AND (end_date IS NULL OR end_date>=?)`,
        [s.id, `${month}-01`, `${month}-28`]
      );
      let scholarshipDiscount = 0;
      if (scholarship) {
        scholarshipDiscount = scholarship.type === 'percent'
          ? s.monthly_fee * (scholarship.percent / 100)
          : scholarship.amount;
      }

      run(
        `INSERT INTO fee_invoices(student_id,invoice_no,billing_month,amount,discount,scholarship_discount,previous_due,due_date) VALUES(?,?,?,?,?,?,?,?)`,
        [s.id, makeNumber('INV'), month, s.monthly_fee, s.discount, scholarshipDiscount, Math.max(0, prevDue), `${month}-10`]
      );
      created++;
    }
  }
  auditLog(req.user?.id, req.user?.name, 'FEE_GENERATE', 'fee_invoices', null, `Invoices generated for ${month}: ${created} created`);
  res.json({ message: 'Invoices generated', created });
});

router.post('/fees/:id/apply-scholarship', requirePermission('fees.update'), (req, res) => {
  const { scholarship_id } = req.body;
  const invoice = one('SELECT * FROM fee_invoices WHERE id=?', [req.params.id]);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  const scholarship = one('SELECT * FROM scholarships WHERE id=? AND status="active"', [scholarship_id]);
  if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });

  let discount = scholarship.type === 'percent'
    ? invoice.amount * (scholarship.percent / 100)
    : scholarship.amount;

  run('UPDATE fee_invoices SET scholarship_discount=? WHERE id=?', [discount, req.params.id]);
  res.json({ message: 'Scholarship applied', discount });
});

router.post('/fees/:id/add-fine', requirePermission('fees.update'), (req, res) => {
  const { amount, reason } = req.body;
  if (!amount || Number(amount) <= 0) return res.status(400).json({ message: 'Valid fine amount required' });
  run('UPDATE fee_invoices SET fine=fine+? WHERE id=?', [Number(amount), req.params.id]);
  auditLog(req.user?.id, req.user?.name, 'FEE_FINE', 'fee_invoices', req.params.id, `Fine of ${amount} added: ${reason || ''}`);
  res.json({ message: 'Fine added' });
});

router.get('/fees/:id', requirePermission('fees.view'), (req, res) => {
  const invoice = one(
    `SELECT i.*, s.name student_name, s.admission_no,
     COALESCE((SELECT SUM(amount) FROM payments p WHERE p.invoice_id=i.id),0) paid,
     (i.amount - i.discount - i.scholarship_discount + i.fine + i.previous_due - COALESCE((SELECT SUM(amount) FROM payments p2 WHERE p2.invoice_id=i.id),0)) balance
     FROM fee_invoices i JOIN students s ON s.id=i.student_id WHERE i.id=?`,
    [Number(req.params.id)]
  );
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  const invoicePayments = query('SELECT * FROM payments WHERE invoice_id=? ORDER BY paid_at DESC', [invoice.id]);
  res.json({ ...invoice, payments: invoicePayments });
});

router.put('/fees/:id', requirePermission('fees.update'), (req, res) => {
  const b = req.body || {};
  const sets = [];
  const vals = [];
  for (const k of ['amount', 'discount', 'scholarship_discount', 'fine', 'previous_due', 'due_date', 'status', 'notes']) {
    if (b[k] !== undefined) {
      sets.push(`${k}=?`);
      vals.push(b[k]);
    }
  }
  if (!sets.length) return res.status(400).json({ message: 'No fields to update' });
  try {
    run(`UPDATE fee_invoices SET ${sets.join(',')} WHERE id=?`, [...vals, Number(req.params.id)]);
    auditLog(req.user?.id, req.user?.name, 'UPDATE', 'fee_invoices', req.params.id, 'Fee invoice updated');
    res.json({ message: 'Updated' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.delete('/fees/:id', requirePermission('fees.delete'), (req, res) => {
  try {
    run('DELETE FROM payments WHERE invoice_id=?', [Number(req.params.id)]);
    run('DELETE FROM fee_invoices WHERE id=?', [Number(req.params.id)]);
    auditLog(req.user?.id, req.user?.name, 'DELETE', 'fee_invoices', req.params.id, 'Fee invoice deleted');
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(409).json({ message: 'Cannot delete invoice' });
  }
});

// ===== PAYMENTS =====
router.get('/payments', requirePermission('payments.view'), (req, res) => {
  let select = `SELECT p.*,s.name student_name,s.admission_no
    FROM payments p JOIN students s ON s.id=p.student_id`;

  const params = [];
  if (req.query.student_id) { select += ' WHERE p.student_id=?'; params.push(req.query.student_id); }
  if (req.query.method) { select += params.length ? ' AND' : ' WHERE'; select += ' p.method=?'; params.push(req.query.method); }

  select += ' ORDER BY p.id DESC';
  res.json(query(select, params));
});

router.post('/payments', requirePermission('payments.create'), (req, res) => {
  const b = req.body;
  if (!b.student_id || Number(b.amount) <= 0) return res.status(400).json({ message: 'Valid student and amount required' });

  run(
    `INSERT INTO payments(student_id,invoice_id,receipt_no,amount,method,paid_at,note,created_by) VALUES(?,?,?,?,?,?,?,?)`,
    [b.student_id, b.invoice_id || null, makeNumber('REC'), b.amount, b.method || 'cash', b.paid_at || today(), b.note || null, req.user?.id || null]
  );

  // Auto-update invoice status
  if (b.invoice_id) {
    const inv = one('SELECT amount,discount,scholarship_discount,previous_due,fine FROM fee_invoices WHERE id=?', [b.invoice_id]);
    const paid = one('SELECT COALESCE(SUM(amount),0) total FROM payments WHERE invoice_id=?', [b.invoice_id])?.total || 0;
    const totalDue = Number(inv?.amount || 0) - Number(inv?.discount || 0) - Number(inv?.scholarship_discount || 0) + Number(inv?.previous_due || 0) + Number(inv?.fine || 0);
    if (inv && paid >= totalDue) {
      run("UPDATE fee_invoices SET status='paid' WHERE id=?", [b.invoice_id]);
    } else if (inv && paid > 0) {
      run("UPDATE fee_invoices SET status='partial' WHERE id=?", [b.invoice_id]);
    }
  }

  auditLog(req.user?.id, req.user?.name, 'PAYMENT', 'payments', null, `Payment of ${b.amount} recorded for student ${b.student_id}`);
  res.status(201).json({ message: 'Payment recorded', receipt_no: makeNumber('REC') });
});


// ===== EXPLICIT EXPENSES HANDLERS (fix Express 5 routing) =====
router.get('/expenses', requirePermission('expenses.view'), (req, res) => {
  const params = [];
  let select = 'SELECT * FROM expenses WHERE 1=1';
  if (req.query.category) { select += ' AND category=?'; params.push(req.query.category); }
  if (req.query.from) { select += ' AND date>=?'; params.push(req.query.from); }
  if (req.query.to) { select += ' AND date<=?'; params.push(req.query.to); }
  select += ' ORDER BY id DESC';
  res.json(query(select, params));
});
router.get('/expenses/:id', requirePermission('expenses.view'), (req, res) => {
  const row = one('SELECT * FROM expenses WHERE id=?', [Number(req.params.id)]);
  row ? res.json(row) : res.status(404).json({ message: 'Not found' });
});
router.post('/expenses', requirePermission('expenses.create'), (req, res) => {
  const b = req.body || {};
  const cols = ['category', 'amount', 'date'];
  const vals = [b.category, Number(b.amount), b.date];
  if (b.description) { cols.push('description'); vals.push(b.description); }
  if (b.reference) { cols.push('reference'); vals.push(b.reference); }
  if (b.payment_method) { cols.push('payment_method'); vals.push(b.payment_method); }
  if (b.branch_id) { cols.push('branch_id'); vals.push(b.branch_id); }
  if (b.receipt_url) { cols.push('receipt_url'); vals.push(b.receipt_url); }
  cols.push('created_by'); vals.push(req.user?.id);
  try {
    const id = run(`INSERT INTO expenses(${cols.join(',')}) VALUES(${cols.map(()=>'?').join(',')})`, vals);
    auditLog(req.user?.id, req.user?.name, 'CREATE', 'expenses', id, 'Expense created');
    res.status(201).json({ message: 'Created', id });
  } catch (e) { res.status(400).json({ message: e.message }); }
});
router.put('/expenses/:id', requirePermission('expenses.update'), (req, res) => {
  const b = req.body || {};
  const sets = []; const vals = [];
  for (const k of ['category','amount','date','description','reference','payment_method','branch_id']) {
    if (b[k] !== undefined) { sets.push(k+'=?'); vals.push(b[k]); }
  }
  if (!sets.length) return res.status(400).json({ message: 'No fields' });
  try { run(`UPDATE expenses SET ${sets.join(',')} WHERE id=?`, [...vals, Number(req.params.id)]); res.json({ message: 'Updated' }); }
  catch (e) { res.status(400).json({ message: e.message }); }
});
router.delete('/expenses/:id', requirePermission('expenses.delete'), (req, res) => {
  try { run('DELETE FROM expenses WHERE id=?', [Number(req.params.id)]); res.json({ message: 'Deleted' }); }
  catch (e) { res.status(409).json({ message: 'Cannot delete' }); }
});

// ===== EXPLICIT EXAMS HANDLERS =====
router.get('/exams', requirePermission('exams.view'), (req, res) => {
  let select = 'SELECT e.*, c.name class_name, b.name batch_name FROM exams e LEFT JOIN classes c ON c.id=e.class_id LEFT JOIN batches b ON b.id=e.batch_id WHERE 1=1';
  const params = [];
  if (req.query.class_id) { select += ' AND e.class_id=?'; params.push(req.query.class_id); }
  if (req.query.status) { select += ' AND e.status=?'; params.push(req.query.status); }
  select += ' ORDER BY e.id DESC';
  res.json(query(select, params));
});
router.get('/exams/:id', requirePermission('exams.view'), (req, res) => {
  const row = one('SELECT * FROM exams WHERE id=?', [Number(req.params.id)]);
  row ? res.json(row) : res.status(404).json({ message: 'Not found' });
});
router.post('/exams', requirePermission('exams.create'), (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ message: 'Name required' });
  const cols = ['name']; const vals = [b.name];
  for (const k of ['session','type','class_id','batch_id','start_date','end_date','start_time','end_time','status']) {
    if (b[k] !== undefined) { cols.push(k); vals.push(b[k]); }
  }
  try {
    const id = run(`INSERT INTO exams(${cols.join(',')}) VALUES(${cols.map(()=>'?').join(',')})`, vals);
    auditLog(req.user?.id, req.user?.name, 'CREATE', 'exams', id, 'Exam created');
    res.status(201).json({ message: 'Created', id });
  } catch (e) { res.status(400).json({ message: e.message }); }
});
router.put('/exams/:id', requirePermission('exams.update'), (req, res) => {
  const b = req.body || {};
  const sets = []; const vals = [];
  for (const k of ['name','session','type','class_id','batch_id','start_date','end_date','start_time','end_time','status']) {
    if (b[k] !== undefined) { sets.push(k+'=?'); vals.push(b[k]); }
  }
  if (!sets.length) return res.status(400).json({ message: 'No fields' });
  try { run(`UPDATE exams SET ${sets.join(',')} WHERE id=?`, [...vals, Number(req.params.id)]); res.json({ message: 'Updated' }); }
  catch (e) { res.status(400).json({ message: e.message }); }
});
router.delete('/exams/:id', requirePermission('exams.delete'), (req, res) => {
  try { run('DELETE FROM exams WHERE id=?', [Number(req.params.id)]); res.json({ message: 'Deleted' }); }
  catch (e) { res.status(409).json({ message: 'Cannot delete' }); }
});

// NOTE: POST /admissions is handled further below (with requirePermission).
// A duplicate permission-less handler was removed — it shadowed the real one.

// ===== RESULTS =====
router.get('/results/:studentId', requirePermission('results.view'), (req, res) => {
  res.json(query(
    `SELECT r.*,e.name exam_name,e.session,e.type,s.name subject_name
     FROM exam_results r JOIN exams e ON e.id=r.exam_id JOIN subjects s ON s.id=r.subject_id
     WHERE r.student_id=? ORDER BY e.start_date DESC`,
    [req.params.studentId]
  ));
});

router.post('/results', requirePermission('results.create'), (req, res) => {
  const b = req.body;
  if (Number(b.obtained_marks) > Number(b.total_marks)) {
    return res.status(400).json({ message: 'Marks cannot exceed total' });
  }
  const p = Number(b.obtained_marks) / Number(b.total_marks) * 100;
  run(
    `INSERT INTO exam_results(exam_id,student_id,subject_id,obtained_marks,total_marks,grade,remarks) VALUES(?,?,?,?,?,?,?)
     ON CONFLICT(exam_id,student_id,subject_id) DO UPDATE SET obtained_marks=excluded.obtained_marks,total_marks=excluded.total_marks,grade=excluded.grade,remarks=excluded.remarks`,
    [b.exam_id, b.student_id, b.subject_id, b.obtained_marks, b.total_marks, gradeFor(p), b.remarks || null]
  );
  auditLog(req.user?.id, req.user?.name, 'RESULT_UPDATE', 'exam_results', null, `Result updated for exam ${b.exam_id}, student ${b.student_id}`);
  res.json({ message: 'Result saved', grade: gradeFor(p) });
});

// Bulk marks entry
router.post('/results/bulk', requirePermission('results.create'), (req, res) => {
  const { exam_id, subject_id, records = [] } = req.body;
  let count = 0;
  for (const r of records) {
    if (Number(r.obtained_marks) > Number(r.total_marks || 100)) continue;
    const p = Number(r.obtained_marks) / Number(r.total_marks || 100) * 100;
    run(
      `INSERT INTO exam_results(exam_id,student_id,subject_id,obtained_marks,total_marks,grade,remarks) VALUES(?,?,?,?,?,?,?)
       ON CONFLICT(exam_id,student_id,subject_id) DO UPDATE SET obtained_marks=excluded.obtained_marks,total_marks=excluded.total_marks,grade=excluded.grade,remarks=excluded.remarks`,
      [exam_id, r.student_id, subject_id, r.obtained_marks, r.total_marks || 100, gradeFor(p), r.remarks || null]
    );
    count++;
  }
  res.json({ message: `Results saved for ${count} students`, count });
});

// ===== STUDENT BATCH ASSIGNMENTS =====
router.post('/student-batches', requirePermission('students.update'), (req, res) => {
  const { student_id, batch_id } = req.body;
  if (!student_id || !batch_id) return res.status(400).json({ message: 'student_id and batch_id required' });

  // Check capacity
  const batch = one('SELECT capacity FROM batches WHERE id=?', [batch_id]);
  const enrolled = one('SELECT COUNT(*) count FROM student_batches WHERE batch_id=? AND active=1', [batch_id])?.count || 0;
  if (batch && enrolled >= batch.capacity) {
    return res.status(400).json({ message: 'Batch is at full capacity' });
  }

  // Deactivate old assignments
  run('UPDATE student_batches SET active=0 WHERE student_id=?', [student_id]);

  // Create new
  run(
    'INSERT INTO student_batches(student_id,batch_id) VALUES(?,?) ON CONFLICT(student_id,batch_id) DO UPDATE SET active=1',
    [student_id, batch_id]
  );
  auditLog(req.user?.id, req.user?.name, 'BATCH_ASSIGN', 'student_batches', null, `Student ${student_id} assigned to batch ${batch_id}`);
  res.json({ message: 'Student assigned to batch' });
});

// Get batch students
router.get('/batch-students/:batchId', (req, res) => {
  res.json(query(
    `SELECT s.id,s.name,s.admission_no,s.phone,s.status FROM students s
     JOIN student_batches sb ON sb.student_id=s.id AND sb.active=1
     WHERE sb.batch_id=? ORDER BY s.name`,
    [req.params.batchId]
  ));
});

// ===== TEACHER ASSIGNMENTS =====
router.get('/admin/assignments', requirePermission('users.view'), (req, res) => {
  res.json(query(
    `SELECT a.*,u.name teacher_name,b.name batch_name,sub.name subject_name
     FROM teacher_assignments a
     JOIN users u ON u.id=a.teacher_id
     LEFT JOIN batches b ON b.id=a.batch_id
     LEFT JOIN subjects sub ON sub.id=a.subject_id
     ORDER BY a.id DESC`
  ));
});

router.post('/admin/assignments', requirePermission('users.create'), (req, res) => {
  const b = req.body;
  run('INSERT INTO teacher_assignments(teacher_id,batch_id,subject_id) VALUES(?,?,?)', [b.teacher_id, b.batch_id || null, b.subject_id || null]);
  auditLog(req.user?.id, req.user?.name, 'CREATE', 'teacher_assignments', null, 'Teacher assignment created');
  res.status(201).json({ message: 'Assignment created' });
});

router.delete('/admin/assignments/:id', requirePermission('users.delete'), (req, res) => {
  run('DELETE FROM teacher_assignments WHERE id=?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// ===== ADMISSIONS =====
router.get('/admissions', requirePermission('admissions.view'), (req, res) => {
  let select = `SELECT a.*, s.name student_name, s.admission_no FROM admissions a LEFT JOIN students s ON s.id=a.student_id`;
  if (req.query.status) { select += ' WHERE a.status=?'; return res.json(query(select, [req.query.status])); }
  res.json(query(select + ' ORDER BY a.id DESC'));
});

router.post('/admissions', requirePermission('admissions.create'), (req, res) => {
  const b = req.body;
  const appNo = makeNumber('ADM');
  run(
    `INSERT INTO admissions(student_name,father_name,phone,previous_school,previous_class,applied_class,applied_batch,application_no,admission_date,initial_fee,discount,documents,status,remarks,branch_id)
     VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [b.student_name, b.father_name, b.phone, b.previous_school, b.previous_class, b.applied_class, b.applied_batch, appNo, b.admission_date || today(), b.initial_fee || 0, b.discount || 0, b.documents || null, 'pending', b.remarks || null, b.branch_id || req.user.branchId || null]
  );
  auditLog(req.user?.id, req.user?.name, 'CREATE', 'admissions', null, `Admission application ${appNo} created`);
  res.status(201).json({ message: 'Admission application created', application_no: appNo });
});

// Approve admission
router.post('/admissions/:id/approve', requirePermission('admissions.update'), (req, res) => {
  const admission = one('SELECT * FROM admissions WHERE id=?', [req.params.id]);
  if (!admission) return res.status(404).json({ message: 'Admission not found' });
  run("UPDATE admissions SET status='approved' WHERE id=?", [req.params.id]);
  auditLog(req.user?.id, req.user?.name, 'ADMISSION_APPROVE', 'admissions', req.params.id, 'Admission approved');
  res.json({ message: 'Admission approved' });
});

// Reject admission
router.post('/admissions/:id/reject', requirePermission('admissions.update'), (req, res) => {
  run("UPDATE admissions SET status='rejected' WHERE id=?", [req.params.id]);
  auditLog(req.user?.id, req.user?.name, 'ADMISSION_REJECT', 'admissions', req.params.id, 'Admission rejected');
  res.json({ message: 'Admission rejected' });
});

// Convert admission to student
router.post('/admissions/:id/convert', requirePermission('admissions.update'), (req, res) => {
  const admission = one('SELECT * FROM admissions WHERE id=?', [req.params.id]);
  if (!admission) return res.status(404).json({ message: 'Admission not found' });

  const studentNo = makeNumber('STU');
  const studentId = run(
    `INSERT INTO students(name,father_name,phone,admission_no,admission_date,monthly_fee,discount,status,branch_id) VALUES(?,?,?,?,?,?,?,?,?)`,
    [admission.student_name, admission.father_name, admission.phone, studentNo, admission.admission_date || today(), 0, admission.discount || 0, 'active', admission.branch_id]
  );
  run('UPDATE admissions SET student_id=?, status="confirmed" WHERE id=?', [studentId, req.params.id]);

  // Create payment if initial fee
  if (admission.initial_fee > 0) {
    run(
      `INSERT INTO payments(student_id,receipt_no,amount,method,paid_at,created_by) VALUES(?,?,?,?,?,?)`,
      [studentId, makeNumber('REC'), admission.initial_fee, 'cash', today(), req.user?.id]
    );
  }

  auditLog(req.user?.id, req.user?.name, 'ADMISSION_CONVERT', 'admissions', req.params.id, `Admission converted to student ${studentId}`);
  res.json({ message: 'Admission converted to student', student_id: studentId, admission_no: studentNo });
});

// ===== PAYROLL =====
router.get('/payroll', requirePermission('payroll.view'), (req, res) => {
  let select = `SELECT p.*,u.name teacher_name FROM payroll p LEFT JOIN users u ON u.id=p.teacher_id`;
  if (req.query.month) { select += ' WHERE p.month=?'; return res.json(query(select, [req.query.month])); }
  if (req.query.status) { select += ' WHERE p.status=?'; return res.json(query(select, [req.query.status])); }
  res.json(query(select + ' ORDER BY p.month DESC, u.name'));
});

const PAYROLL_FIELDS = ['teacher_id', 'month', 'basic_salary', 'allowance', 'deduction', 'advance', 'bonus', 'status', 'paid_at', 'payment_method', 'notes'];

router.post('/payroll', requirePermission('payroll.create'), (req, res) => {
  const b = req.body || {};
  if (!b.teacher_id || !b.month) return res.status(400).json({ message: 'teacher_id and month required' });
  const net = Number(b.basic_salary || 0) + Number(b.allowance || 0) - Number(b.deduction || 0) - Number(b.advance || 0) + Number(b.bonus || 0);
  try {
    const id = run(
      `INSERT INTO payroll(teacher_id,month,basic_salary,allowance,deduction,advance,bonus,net_salary,status,paid_at,payment_method,notes)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(teacher_id,month) DO UPDATE SET basic_salary=excluded.basic_salary,allowance=excluded.allowance,
         deduction=excluded.deduction,advance=excluded.advance,bonus=excluded.bonus,net_salary=excluded.net_salary,
         status=excluded.status,paid_at=excluded.paid_at,payment_method=excluded.payment_method,notes=excluded.notes`,
      [b.teacher_id, b.month, Number(b.basic_salary || 0), Number(b.allowance || 0), Number(b.deduction || 0),
        Number(b.advance || 0), Number(b.bonus || 0), net, b.status || 'unpaid', b.paid_at || null, b.payment_method || 'cash', b.notes || null]
    );
    auditLog(req.user?.id, req.user?.name, 'CREATE', 'payroll', id, `Payroll record for teacher ${b.teacher_id}, month ${b.month}`);
    res.status(201).json({ message: 'Payroll saved', id });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.put('/payroll/:id', requirePermission('payroll.update'), (req, res) => {
  const b = req.body || {};
  const sets = [];
  const vals = [];
  for (const k of PAYROLL_FIELDS) {
    if (b[k] !== undefined) { sets.push(k + '=?'); vals.push(b[k]); }
  }
  if (['basic_salary', 'allowance', 'deduction', 'advance', 'bonus'].some(k => b[k] !== undefined) || b.net_salary === undefined) {
    // Recompute net salary when any component changes
    const current = one('SELECT * FROM payroll WHERE id=?', [req.params.id]);
    if (current) {
      const net = Number(b.basic_salary ?? (current.basic_salary || 0))
        + Number(b.allowance ?? (current.allowance || 0))
        - Number(b.deduction ?? (current.deduction || 0))
        - Number(b.advance ?? (current.advance || 0))
        + Number(b.bonus ?? (current.bonus || 0));
      sets.push('net_salary=?');
      vals.push(net);
    }
  }
  if (!sets.length) return res.status(400).json({ message: 'No fields to update' });
  try {
    run(`UPDATE payroll SET ${sets.join(',')} WHERE id=?`, [...vals, Number(req.params.id)]);
    auditLog(req.user?.id, req.user?.name, 'UPDATE', 'payroll', req.params.id, 'Payroll updated');
    res.json({ message: 'Payroll updated' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.delete('/payroll/:id', requirePermission('payroll.delete'), (req, res) => {
  try {
    run('DELETE FROM payroll WHERE id=?', [Number(req.params.id)]);
    auditLog(req.user?.id, req.user?.name, 'DELETE', 'payroll', req.params.id, 'Payroll deleted');
    res.json({ message: 'Payroll deleted' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// ===== ASSIGNMENT UPDATE (was missing; edit form 404) =====
router.put('/admin/assignments/:id', requirePermission('users.update'), (req, res) => {
  const b = req.body || {};
  run('UPDATE teacher_assignments SET teacher_id=?,batch_id=?,subject_id=? WHERE id=?',
    [b.teacher_id, b.batch_id || null, b.subject_id || null, req.params.id]);
  auditLog(req.user?.id, req.user?.name, 'UPDATE', 'teacher_assignments', req.params.id, 'Assignment updated');
  res.json({ message: 'Assignment updated' });
});

// ===== ADMISSION UPDATE (was missing; edit form 404) =====
router.put('/admissions/:id', requirePermission('admissions.update'), (req, res) => {
  const b = req.body || {};
  const sets = [];
  const vals = [];
  for (const k of ['student_name', 'father_name', 'phone', 'previous_school', 'previous_class', 'applied_class', 'applied_batch', 'admission_date', 'initial_fee', 'discount', 'status', 'remarks']) {
    if (b[k] !== undefined) { sets.push(k + '=?'); vals.push(b[k]); }
  }
  if (!sets.length) return res.status(400).json({ message: 'No fields to update' });
  try {
    run(`UPDATE admissions SET ${sets.join(',')} WHERE id=?`, [...vals, Number(req.params.id)]);
    auditLog(req.user?.id, req.user?.name, 'UPDATE', 'admissions', req.params.id, 'Admission updated');
    res.json({ message: 'Admission updated' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// ===== LEAVE REQUESTS =====
router.get('/leave-requests', requirePermission('leave.view'), (req, res) => {
  let select = `SELECT lr.*,
    CASE WHEN lr.person_type='teacher' THEN u.name ELSE s.name END as person_name
    FROM leave_requests lr
    LEFT JOIN users u ON u.id=lr.person_id AND lr.person_type='teacher'
    LEFT JOIN students s ON s.id=lr.person_id AND lr.person_type='student'`;
  if (req.query.status) { select += ' WHERE lr.status=?'; return res.json(query(select, [req.query.status])); }
  res.json(query(select + ' ORDER BY lr.id DESC'));
});

router.post('/leave-requests', requirePermission('leave.create'), (req, res) => {
  const b = req.body;
  run(
    'INSERT INTO leave_requests(person_type,person_id,start_date,end_date,reason) VALUES(?,?,?,?,?)',
    [b.person_type, b.person_id, b.start_date, b.end_date, b.reason || '']
  );
  res.status(201).json({ message: 'Leave request submitted' });
});

router.post('/leave-requests/:id/approve', requirePermission('leave.approve'), (req, res) => {
  run("UPDATE leave_requests SET status='approved', approved_by=? WHERE id=?", [req.user?.id, req.params.id]);
  auditLog(req.user?.id, req.user?.name, 'LEAVE_APPROVE', 'leave_requests', req.params.id, 'Leave approved');
  res.json({ message: 'Leave approved' });
});

router.post('/leave-requests/:id/reject', requirePermission('leave.approve'), (req, res) => {
  run("UPDATE leave_requests SET status='rejected', approved_by=? WHERE id=?", [req.user?.id, req.params.id]);
  res.json({ message: 'Leave rejected' });
});

// ===== DOCUMENTS =====
router.post('/documents/upload', requirePermission('documents.create'), (req, res) => {
  const b = req.body;
  run(
    'INSERT INTO documents(entity_type,entity_id,title,file_url,file_size,document_type,uploaded_by) VALUES(?,?,?,?,?,?,?)',
    [b.entity_type, b.entity_id, b.title, b.file_url, b.file_size || 0, b.document_type || null, req.user?.id]
  );
  res.status(201).json({ message: 'Document uploaded' });
});

// ===== MESSAGES =====
router.post('/messages/send', requirePermission('messages.create'), (req, res) => {
  const b = req.body;
  run(
    'INSERT INTO messages(sender_id,recipient_type,recipient_id,subject,message) VALUES(?,?,?,?,?)',
    [req.user?.id, b.recipient_type, b.recipient_id, b.subject, b.message]
  );
  res.status(201).json({ message: 'Message sent' });
});

// Mark message as read
router.post('/messages/:id/read', (req, res) => {
  run('UPDATE messages SET read_at=CURRENT_TIMESTAMP WHERE id=? AND read_at IS NULL', [req.params.id]);
  res.json({ message: 'Marked as read' });
});

// ===== AUDIT LOGS =====
router.get('/audit-logs', requirePermission('audit.view'), (req, res) => {
  let select = 'SELECT a.*,u.name user_name FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id';
  const params = [];
  if (req.query.entity) { select += ' WHERE a.entity=?'; params.push(req.query.entity); }
  if (req.query.user_id) { select += params.length ? ' AND' : ' WHERE'; select += ' a.user_id=?'; params.push(req.query.user_id); }
  select += ' ORDER BY a.id DESC LIMIT 500';
  res.json(query(select, params));
});

export default router;
