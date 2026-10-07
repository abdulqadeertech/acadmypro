import { useEffect, useState } from 'react';
import { get, post, put, del } from '../lib/api';
import { Card, PageHeader, Button, Badge, SearchInput, Select, showToast } from '../components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { Download, Printer, Loader2, CheckCircle, XCircle, Clock, FileText, Upload, X } from 'lucide-react';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

// ===== ATTENDANCE =====
export function Attendance({ teacher = false }) {
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    if (teacher) {
      get('/teacher-attendance', { date }).then(setRows).finally(() => setLoading(false));
    } else {
      Promise.all([
        get('/attendance/students', selectedBatch ? { batch_id: selectedBatch } : {}),
        get('/attendance', { date, batch_id: selectedBatch }),
        get('/batches'),
      ]).then(([s, a, b]) => {
        setBatches(b?.data || b || []);
        const attendanceList = Array.isArray(a) ? a : (a?.data || []);
        const studentList = Array.isArray(s) ? s : (s?.data || []);
        setStudents(studentList.map(x => ({
          ...x,
          status: attendanceList.find(y => y.student_id === x.id)?.status || 'present',
        })));
      }).finally(() => setLoading(false));
    }
  };

  useEffect(load, [date, selectedBatch, teacher]);

  const save = async () => {
    setSaving(true);
    try {
      if (teacher) {
        await post('/teacher-attendance/bulk', { date, records: rows.map(x => ({ teacher_id: x.teacher_id || x.id, status: x.status })) });
      } else {
        await post('/attendance/bulk', { date, batch_id: selectedBatch || null, records: students.map(x => ({ student_id: x.id, status: x.status })) });
      }
      showToast('Attendance saved successfully');
      load();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = (id, status) => {
    if (teacher) {
      setRows(prev => prev.map(x => (x.teacher_id || x.id) === id ? { ...x, status } : x));
    } else {
      setStudents(prev => prev.map(x => x.id === id ? { ...x, status } : x));
    }
  };

  const statusIcon = (s) => {
    const map = { present: <CheckCircle size={14} className="text-emerald-600" />, absent: <XCircle size={14} className="text-red-600" />, late: <Clock size={14} className="text-amber-600" /> };
    return map[s] || null;
  };

  const data = teacher ? rows : students;
  const presentCount = data.filter(x => x.status === 'present').length;
  const totalCount = data.length;

  return (
    <div className="max-w-[1200px] mx-auto">
      <PageHeader
        title={teacher ? 'Teacher Attendance' : 'Student Attendance'}
        subtitle={`Mark attendance for ${date}`}
        action={
          <Button onClick={save} loading={saving} icon={CheckCircle}>
            Save Attendance
          </Button>
        }
      />

      {/* Controls */}
      <Card className="p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          {!teacher && (
            <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
              <option value="">All Students</option>
              {(Array.isArray(batches) ? batches : []).map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
          <div className="ml-auto text-sm text-slate-500">
            {presentCount}/{totalCount} Present ({totalCount ? Math.round(presentCount / totalCount * 100) : 0}%)
          </div>
        </div>
      </Card>

      {/* Attendance Table */}
      <Card className="overflow-hidden">
        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="text-left p-4 w-8">#</th>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">ID</th>
                <th className="text-center p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="animate-spin mx-auto" size={24} /></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-slate-400">No {teacher ? 'teachers' : 'students'} found</td></tr>
              ) : data.map((x, i) => (
                <tr key={x.id || x.teacher_id || i} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-4 text-slate-500">{i + 1}</td>
                  <td className="p-4 font-medium">{x.name || x.teacher_name}</td>
                  <td className="p-4 text-slate-500 text-xs">{x.admission_no || x.email || '—'}</td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      {['present', 'absent', 'late', 'leave'].map(s => (
                        <button key={s}
                          onClick={() => setStatus(x.id || x.teacher_id, s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                            x.status === s
                              ? s === 'present' ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                                : s === 'absent' ? 'bg-red-100 border-red-300 text-red-700'
                                : s === 'late' ? 'bg-amber-100 border-amber-300 text-amber-700'
                                : 'bg-slate-100 border-slate-300 text-slate-700'
                              : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ===== TIMETABLE =====
export function Timetable() {
  const [rows, setRows] = useState([]);
  const [batches, setBatches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ day_of_week: 0, start_time: '08:00', end_time: '09:00' });
  const [loading, setLoading] = useState(true);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const load = () => {
    setLoading(true);
    Promise.all([get('/timetable'), get('/batches'), get('/teachers'), get('/rooms')])
      .then(([t, b, te, r]) => {
        setRows(Array.isArray(t) ? t : []);
        setBatches(b?.data || b || []);
        setTeachers(te?.data || te || []);
        setRooms(r?.data || r || []);
        // Get subjects for first batch
        if (b?.length || b?.data?.length) {
          const batchId = (b[0] || b.data[0])?.id;
          if (batchId) get('/subjects').then(s => setSubjects(s?.data || s || []));
        }
      })
      .catch(() => get('/subjects').then(s => setSubjects(s?.data || s || [])))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const saveSlot = async () => {
    try {
      await post('/timetable', form);
      showToast('Timetable slot created');
      setShowForm(false);
      setForm({ day_of_week: 0, start_time: '08:00', end_time: '09:00' });
      load();
    } catch (e) {
      showToast(e.response?.data?.message || 'Conflict or error', 'error');
    }
  };

  const deleteSlot = async (id) => {
    if (!confirm('Delete this timetable slot?')) return;
    try {
      await del('/timetable/' + id);
      showToast('Slot deleted');
      load();
    } catch (e) {
      showToast('Failed to delete', 'error');
    }
  };

  // Group by day
  const byDay = {};
  for (const r of rows) {
    const day = r.day_of_week;
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(r);
  }

  const batchOptions = (batches?.data || batches || []).map(b => ({ value: b.id, label: b.name }));
  const teacherOptions = (teachers?.data || teachers || []).map(t => ({ value: t.id, label: t.name }));
  const subjectOptions = (subjects?.data || subjects || []).map(s => ({ value: s.id, label: s.name }));
  const roomOptions = (rooms?.data || rooms || []).map(r => ({ value: r.id, label: r.name }));

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader
        title="Timetable"
        subtitle="Manage class schedule with conflict detection"
        action={<Button onClick={() => setShowForm(true)}>Add Slot</Button>}
      />

      {/* Weekly View */}
      <div className="grid gap-4">
        {days.map((day, dayIdx) => (
          <Card key={dayIdx} className="overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between">
              <h3 className="font-bold">{day}</h3>
              <Badge>{(byDay[dayIdx] || []).length} slots</Badge>
            </div>
            {(byDay[dayIdx] || []).length === 0 ? (
              <div className="p-4 text-sm text-slate-400 text-center">No classes scheduled</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
                {(byDay[dayIdx] || []).sort((a, b) => a.start_time.localeCompare(b.start_time)).map(slot => (
                  <div key={slot.id} className="border border-slate-200 rounded-xl p-3 hover:bg-slate-50 group relative">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-blue-600">{slot.start_time}-{slot.end_time}</span>
                    </div>
                    <div className="text-sm font-semibold">{slot.subject_name || '—'}</div>
                    <div className="text-xs text-slate-500">{slot.teacher_name || '—'} • {slot.batch_name || '—'}</div>
                    {slot.room_name && <div className="text-xs text-slate-400">📍 {slot.room_name}</div>}
                    <button onClick={() => deleteSlot(slot.id)}
                      className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-500 transition">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Add Timetable Slot</h2>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <label className="block col-span-2">
                <span className="text-xs font-semibold text-slate-600">Day</span>
                <select value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm">
                  {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Start Time</span>
                <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })}
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">End Time</span>
                <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })}
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
              </label>
              <label className="block col-span-2">
                <span className="text-xs font-semibold text-slate-600">Batch</span>
                <select value={form.batch_id || ''} onChange={e => setForm({ ...form, batch_id: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm">
                  <option value="">Select batch</option>
                  {batchOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label className="block col-span-2">
                <span className="text-xs font-semibold text-slate-600">Subject</span>
                <select value={form.subject_id || ''} onChange={e => setForm({ ...form, subject_id: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm">
                  <option value="">Select subject</option>
                  {subjectOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label className="block col-span-2">
                <span className="text-xs font-semibold text-slate-600">Teacher</span>
                <select value={form.teacher_id || ''} onChange={e => setForm({ ...form, teacher_id: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm">
                  <option value="">Select teacher</option>
                  {teacherOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label className="block col-span-2">
                <span className="text-xs font-semibold text-slate-600">Room</span>
                <select value={form.room_id || ''} onChange={e => setForm({ ...form, room_id: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm">
                  <option value="">Select room</option>
                  {roomOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            </div>
            <div className="p-5 border-t flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={saveSlot}>Create Slot</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== REPORTS =====
export function Reports() {
  const [activeTab, setActiveTab] = useState('finance');
  const [att, setAtt] = useState([]);
  const [fin, setFin] = useState(null);
  const [teacherAtt, setTeacherAtt] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      get('/reports/finance', { from: dateFrom, to: dateTo }),
      get('/reports/attendance', { from: dateFrom, to: dateTo }),
      get('/reports/teacher-attendance', { from: dateFrom, to: dateTo }),
      get('/reports/exam-results'),
      get('/reports/teacher-workload'),
    ]).then(([f, a, ta, er, wl]) => {
      setFin(f);
      setAtt(a?.studentAttendance || []);
      setTeacherAtt(ta?.data || []);
      setExamResults(er?.performance || []);
      setWorkload(wl?.data || []);
    }).finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  const tabs = [
    { key: 'finance', label: 'Finance' },
    { key: 'attendance', label: 'Student Attendance' },
    { key: 'teacher-attendance', label: 'Teacher Attendance' },
    { key: 'academic', label: 'Academic' },
    { key: 'teacher', label: 'Teacher Workload' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader title="Reports & Analytics" subtitle="Comprehensive academy reports" />

      {/* Filters */}
      <Card className="p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <label className="text-sm font-medium text-slate-600">From:</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          <label className="text-sm font-medium text-slate-600">To:</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm" />
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-200 mb-4 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
              activeTab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" size={24} /></div>
      ) : (
        <>
          {/* Finance Tab */}
          {activeTab === 'finance' && fin && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  ['Total Income', fin.summary?.income, '#10b981'],
                  ['Total Expenses', fin.summary?.expenses, '#ef4444'],
                  ['Net Income', fin.summary?.net, '#3b82f6'],
                  ['Pending Fees', fin.summary?.pending_fees, '#f59e0b'],
                ].map(([label, value, color]) => (
                  <Card key={label} className="p-5">
                    <div className="text-sm text-slate-500">{label}</div>
                    <div className="text-2xl font-black mt-1" style={{ color }}>PKR {Number(value || 0).toLocaleString()}</div>
                  </Card>
                ))}
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <Card className="p-5">
                  <h3 className="font-bold mb-4">Income vs Expenses</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fin.collections?.map((c, i) => ({
                        date: c.date,
                        income: c.amount,
                        expense: fin.expenses?.[i]?.amount || 0,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => [`PKR ${Number(v).toLocaleString()}`]} />
                        <Legend />
                        <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                <Card className="p-5">
                  <h3 className="font-bold mb-4">Expenses by Category</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={fin.expenseByCategory || []} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>
                          {(fin.expenseByCategory || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => [`PKR ${Number(v).toLocaleString()}`]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <Card className="overflow-hidden">
              <div className="p-4 font-bold">Student Attendance Report ({dateFrom} to {dateTo})</div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left">Student</th>
                      <th className="p-3 text-center">Total</th>
                      <th className="p-3 text-center">Present</th>
                      <th className="p-3 text-center">Absent</th>
                      <th className="p-3 text-center">Late</th>
                      <th className="p-3 text-center">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {att.map(x => (
                      <tr key={x.id} className="border-t border-slate-100">
                        <td className="p-3 font-medium">{x.name}</td>
                        <td className="p-3 text-center">{x.total_days}</td>
                        <td className="p-3 text-center text-emerald-600">{x.present}</td>
                        <td className="p-3 text-center text-red-600">{x.absent}</td>
                        <td className="p-3 text-center text-amber-600">{x.late}</td>
                        <td className="p-3 text-center">
                          <Badge variant={x.percentage >= 80 ? 'success' : x.percentage >= 60 ? 'warning' : 'danger'}>
                            {x.percentage || 0}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Teacher Attendance Tab */}
          {activeTab === 'teacher-attendance' && (
            <Card className="overflow-hidden">
              <div className="p-4 font-bold">Teacher Attendance Report</div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left">Teacher</th>
                      <th className="p-3 text-center">Total Days</th>
                      <th className="p-3 text-center">Present</th>
                      <th className="p-3 text-center">Absent</th>
                      <th className="p-3 text-center">Leave</th>
                      <th className="p-3 text-center">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherAtt.map(x => (
                      <tr key={x.id} className="border-t border-slate-100">
                        <td className="p-3 font-medium">{x.name}</td>
                        <td className="p-3 text-center">{x.total_days}</td>
                        <td className="p-3 text-center text-emerald-600">{x.present}</td>
                        <td className="p-3 text-center text-red-600">{x.absent}</td>
                        <td className="p-3 text-center">{x.leave_count}</td>
                        <td className="p-3 text-center"><Badge variant="info">{x.percentage || 0}%</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Academic Tab */}
          {activeTab === 'academic' && (
            <Card className="overflow-hidden">
              <div className="p-4 font-bold">Student Academic Performance</div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left">Student</th>
                      <th className="p-3 text-center">Subjects</th>
                      <th className="p-3 text-center">Total Obtained</th>
                      <th className="p-3 text-center">Total Marks</th>
                      <th className="p-3 text-center">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examResults.map((x, i) => (
                      <tr key={x.student_id || i} className="border-t border-slate-100">
                        <td className="p-3 font-medium">{x.student_name}</td>
                        <td className="p-3 text-center">{x.subjects}</td>
                        <td className="p-3 text-center">{x.total_obtained}</td>
                        <td className="p-3 text-center">{x.total_marks}</td>
                        <td className="p-3 text-center">
                          <Badge variant={x.percentage >= 80 ? 'success' : x.percentage >= 60 ? 'warning' : 'danger'}>
                            {x.percentage || 0}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Teacher Workload Tab */}
          {activeTab === 'teacher' && (
            <Card className="overflow-hidden">
              <div className="p-4 font-bold">Teacher Workload</div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left">Teacher</th>
                      <th className="p-3 text-center">Assigned Batches</th>
                      <th className="p-3 text-center">Subjects</th>
                      <th className="p-3 text-center">Attendance Days (30d)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workload.map(x => (
                      <tr key={x.id} className="border-t border-slate-100">
                        <td className="p-3 font-medium">{x.name}</td>
                        <td className="p-3 text-center">{x.assigned_batches}</td>
                        <td className="p-3 text-center">{x.assigned_subjects}</td>
                        <td className="p-3 text-center">{x.attendance_days}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ===== BACKUP & RESTORE =====
export function Backup() {
  const [backupData, setBackupData] = useState(null);
  const [restoreFile, setRestoreFile] = useState(null);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const escapeHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  const printBackup = () => {
    if (!backupData?.tables) return;
    const tables = Object.entries(backupData.tables).map(([name, rows]) => {
      const columns = rows.length ? Object.keys(rows[0]) : [];
      const head = columns.map(column => `<th>${escapeHtml(column)}</th>`).join('');
      const body = rows.map(row => `<tr>${columns.map(column => `<td>${escapeHtml(row[column])}</td>`).join('')}</tr>`).join('');
      return `<section><h2>${escapeHtml(name)} <small>(${rows.length} records)</small></h2>${rows.length ? `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>` : '<p>No records</p>'}</section>`;
    }).join('');
    const report = window.open('', '_blank', 'width=1200,height=800');
    if (!report) {
      setError('Please allow pop-ups to print the backup report.');
      return;
    }
    report.document.write(`<!doctype html><html><head><title>AcademyPro Full Backup</title><style>
      @page{size:auto;margin:12mm}body{font-family:Arial,sans-serif;color:#172033;font-size:10px}h1{color:#1d4ed8;margin-bottom:4px}h2{border-bottom:2px solid #dbeafe;padding-bottom:4px;margin-top:24px;color:#1e3a8a}h2 small{font-size:10px;color:#64748b;font-weight:normal}p{color:#64748b}table{border-collapse:collapse;width:100%;margin-bottom:14px;page-break-inside:auto}thead{display:table-header-group}tr{page-break-inside:avoid}th,td{border:1px solid #cbd5e1;padding:4px;text-align:left;vertical-align:top;word-break:break-word}th{background:#eff6ff;color:#1e3a8a}
    </style></head><body><h1>AcademyPro Full Database Backup</h1><p>Created: ${escapeHtml(backupData.created_at)} | Records: ${escapeHtml(backupData.metadata?.total_records)} | Tables: ${escapeHtml(backupData.metadata?.tables_count)}</p>${tables}</body></html>`);
    report.document.close();
    report.focus();
    report.onload = () => report.print();
  };

  const exportBackup = async () => {
    setLoading(true);
    setMsg('');
    try {
      const data = await get('/backup/export');
      setBackupData(data);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `academypro-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setMsg('Backup exported successfully.');
    } catch (e) {
      setError(e.response?.data?.message || 'Backup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setRestoreFile(data);
        setValidation(null);
        setError('');

        // Validate
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/backup/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('academypro_token')}`,
          },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        setValidation(result);
      } catch (e) {
        setError('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const restoreBackup = async () => {
    if (!confirm('⚠️ WARNING: This will REPLACE ALL existing data. A safety backup will be created first. Continue?')) return;
    setLoading(true);
    setMsg('');
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/backup/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('academypro_token')}`,
        },
        body: JSON.stringify({ tables: restoreFile.tables, confirm: true }),
      });
      const result = await res.json();
      if (res.ok) {
        setMsg('Database restored successfully. Please refresh the page.');
      } else {
        setError(result.message || 'Restore failed');
      }
    } catch (e) {
      setError('Restore failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Backup & Restore" subtitle="Export and restore database backups" />

      <div className="grid md:grid-cols-2 gap-5">
        {/* Export */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-2">Export Backup</h2>
          <p className="text-sm text-slate-500 mb-4">Download a complete JSON backup of all data.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportBackup} loading={loading} icon={Download}>Export Full Backup</Button>
            {backupData && <Button onClick={printBackup} variant="outline" icon={Printer}>Print / Save PDF</Button>}
          </div>
          {msg && <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm">{msg}</div>}
          {backupData && (
            <div className="mt-4 text-xs text-slate-500">
              Records: {backupData.metadata?.total_records || '—'} • Tables: {backupData.metadata?.tables_count || '—'}
            </div>
          )}
        </Card>

        {/* Restore */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-2">Restore Backup</h2>
          <p className="text-sm text-slate-500 mb-4">Upload a backup file to restore the database.</p>
          <input type="file" accept=".json" onChange={handleFileSelect} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />

          {validation && (
            <div className="mt-4">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm mb-2">
                ✓ Valid backup • {validation.total_records} records
              </div>
              {validation.warnings?.map((w, i) => (
                <div key={i} className="p-2 bg-amber-50 text-amber-700 rounded-xl text-xs mb-1">⚠ {w}</div>
              ))}
              <Button variant="danger" onClick={restoreBackup} loading={loading} className="mt-3">
                Restore Database
              </Button>
            </div>
          )}
        </Card>
      </div>

      {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}

      <Card className="p-5 mt-5">
        <h3 className="font-bold mb-2">⚠ Important Notes</h3>
        <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
          <li>A safety backup is automatically created before any restore operation.</li>
          <li>Restore will replace ALL existing data with the backup contents.</li>
          <li>Never restore a backup from a different version without validation.</li>
          <li>Always verify backup contents before confirming restore.</li>
        </ul>
      </Card>
    </div>
  );
}
