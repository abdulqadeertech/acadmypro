import { useEffect, useMemo, useState } from 'react';
import { Award, BookOpen, CalendarCheck, ChevronRight, CreditCard, FileText, GraduationCap, Search, ShieldCheck, UserRound, Users, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import { get } from '../lib/api';
import { getPersonAvatar } from '../lib/defaultAvatars';

const areas = [
  { label: 'Admissions', description: 'Registration and admission history', icon: UserRound, to: '/admissions', color: 'blue' },
  { label: 'Attendance', description: 'Daily attendance and punctuality', icon: CalendarCheck, to: '/attendance', color: 'emerald' },
  { label: 'Grades & Exams', description: 'Results, marks and report cards', icon: Award, to: '/report-cards', color: 'violet' },
  { label: 'Fees & Payments', description: 'Invoices, discounts and receipts', icon: WalletCards, to: '/fees', color: 'amber' },
  { label: 'Documents', description: 'Certificates and student files', icon: FileText, to: '/documents', color: 'cyan' },
];

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600', violet: 'bg-violet-50 text-violet-600', amber: 'bg-amber-50 text-amber-600', cyan: 'bg-cyan-50 text-cyan-600',
};

export default function StudentInformation() {
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    Promise.all([get('/students?limit=500'), get('/dashboard')]).then(([studentData, dashboardData]) => {
      const list = Array.isArray(studentData) ? studentData : studentData?.data || [];
      setStudents(list);
      setDashboard(dashboardData);
      if (list[0]) setSelectedId(String(list[0].id));
    }).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => students.filter(student => `${student.name} ${student.admission_no} ${student.father_name || ''} ${student.phone || ''}`.toLowerCase().includes(query.toLowerCase())), [students, query]);
  const student = students.find(item => String(item.id) === String(selectedId)) || filtered[0];
  const cards = dashboard?.cards || {};

  return <section className="mx-auto max-w-7xl pb-8">
    <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-10 text-white md:px-10 md:py-12">
      <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[32px] border-cyan-400/15" />
      <div className="absolute bottom-[-100px] left-1/3 h-60 w-60 rounded-full border-[24px] border-amber-300/10" />
      <div className="relative max-w-3xl"><div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-300"><ShieldCheck size={16} /> Student Information System</div><h1 className="text-3xl font-black tracking-tight md:text-5xl">Every learner. One complete story.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">A cloud-ready student management system for Pakistani schools and colleges. Keep admissions, attendance, grades, fees and documents connected from registration to passing out.</p></div>
    </div>

    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-sm text-slate-500"><span>Total students</span><Users className="text-blue-600" size={20} /></div><p className="mt-2 text-3xl font-black text-slate-900">{cards.students ?? students.length}</p><p className="mt-1 text-xs text-slate-400">One connected student register</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-sm text-slate-500"><span>New admissions</span><GraduationCap className="text-emerald-600" size={20} /></div><p className="mt-2 text-3xl font-black text-slate-900">{cards.newAdmissions ?? '—'}</p><p className="mt-1 text-xs text-slate-400">This academic period</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-sm text-slate-500"><span>Attendance today</span><CalendarCheck className="text-violet-600" size={20} /></div><p className="mt-2 text-3xl font-black text-slate-900">{cards.attendanceTotal ? `${Math.round(cards.attendance / cards.attendanceTotal * 100)}%` : '—'}</p><p className="mt-1 text-xs text-slate-400">Live daily overview</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-sm text-slate-500"><span>Pending fees</span><CreditCard className="text-amber-600" size={20} /></div><p className="mt-2 text-3xl font-black text-slate-900">{cards.pendingFees != null ? `Rs ${Number(cards.pendingFees).toLocaleString()}` : '—'}</p><p className="mt-1 text-xs text-slate-400">Actionable finance view</p></div></div>

    <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-4"><h2 className="font-black text-slate-900">Student directory</h2><div className="relative mt-3"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search student, admission no..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-200" /></div></div><div className="max-h-[520px] overflow-y-auto p-2">{loading ? <p className="p-8 text-center text-sm text-slate-400">Loading students...</p> : filtered.length === 0 ? <p className="p-8 text-center text-sm text-slate-400">No students found.</p> : filtered.map(item => <button key={item.id} onClick={() => setSelectedId(String(item.id))} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${String(item.id) === String(student?.id) ? 'bg-blue-50 ring-1 ring-blue-100' : 'hover:bg-slate-50'}`}><div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-100 ring-1 ring-blue-200"><img src={item.photo_url || getPersonAvatar(item)} alt={item.name || 'Student'} className="h-full w-full object-cover" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{item.name}</p><p className="truncate text-xs text-slate-500">{item.admission_no} · {item.father_name || 'No guardian'}</p></div><ChevronRight size={16} className="text-slate-400" /></button>)}</div></div>

      <div className="space-y-6">{student ? <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-blue-100 ring-1 ring-blue-200"><img src={student.photo_url || getPersonAvatar(student)} alt={student.name || 'Student'} className="h-full w-full object-cover" /></div><div><p className="text-xs font-black uppercase tracking-widest text-blue-600">360° student profile</p><h2 className="mt-1 text-2xl font-black text-slate-900">{student.name}</h2><p className="mt-1 text-sm text-slate-500">{student.admission_no} · {student.status || 'active'}</p></div></div><Link to="/students" className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Manage record <ChevronRight size={16} /></Link></div><div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Guardian</p><p className="mt-1 text-sm font-semibold text-slate-800">{student.father_name || '—'}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Phone</p><p className="mt-1 text-sm font-semibold text-slate-800">{student.phone || student.parent_phone || '—'}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Admission date</p><p className="mt-1 text-sm font-semibold text-slate-800">{student.admission_date || '—'}</p></div></div></div> : <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400">Select a student to see their complete profile.</div>}
        <div><div className="mb-3 flex items-center justify-between"><div><h2 className="text-xl font-black text-slate-900">Student journey</h2><p className="text-sm text-slate-500">Jump into any part of the learner record.</p></div><BookOpen className="text-blue-600" size={22} /></div><div className="grid gap-3 sm:grid-cols-2">{areas.map(area => { const Icon = area.icon; return <Link key={area.label} to={area.to} className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"><div className={`grid h-11 w-11 place-items-center rounded-xl ${colorClasses[area.color]}`}><Icon size={20} /></div><div className="min-w-0 flex-1"><h3 className="font-bold text-slate-800">{area.label}</h3><p className="mt-1 text-xs text-slate-500">{area.description}</p></div><ChevronRight className="text-slate-300 transition group-hover:text-blue-600" size={18} /></Link>; })}</div></div>
      </div>
    </div>
  </section>;
}
