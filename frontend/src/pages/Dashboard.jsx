import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../lib/api';
import { getPersonAvatar } from '../lib/defaultAvatars';
import { Card, StatCard, Badge } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';
import { Users, GraduationCap, BookOpen, Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, Calendar, AlertCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';

const COLORS = ['#4f46e5', '#16a34a', '#d97706', '#dc2626', '#64748b', '#0284c7'];

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const loadDashboard = () => {
      setLoading(true);
      setError('');
      get('/dashboard').then(setD).catch((requestError) => {
        console.error('Dashboard request failed:', requestError);
        setError(requestError.response?.data?.message || requestError.message || 'Network error');
      }).finally(() => setLoading(false));
    };
    loadDashboard();
  }, []);

  if (loading) return <div className="p-10 text-center text-slate-500">{t('Loading dashboard...')}</div>;
  if (!d) return (
    <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <h1 className="text-lg font-bold text-red-700">{t('Failed to load dashboard')}</h1>
      <p className="mt-2 text-sm text-red-600">{error}</p>
      <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">{t('Retry')}</button>
    </div>
  );

  const c = d.cards;
  const attPercent = c.attendanceTotal ? Math.round(c.attendance / c.attendanceTotal * 100) : 0;

  return (
    <div className="max-w-[1500px] mx-auto space-y-5">
      <div className="dashboard-hero rounded-3xl px-5 py-6 sm:px-7 sm:py-7">
        <div className="dashboard-hero-content flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="dashboard-section-label mb-2">Academy overview</div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t('Dashboard')} <span aria-hidden="true"></span></h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600 sm:text-base">Complete academy operations at a glance.</p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-white/80 px-3 py-2 text-xs font-bold text-emerald-700 sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Live operations
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-section-label px-1 pt-1">Key metrics</div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active Students" value={c.students} icon={Users} description={`${c.newAdmissions} new this month`} onClick={() => navigate('/students')} />
        <StatCard title="Active Teachers" value={c.teachers} icon={GraduationCap} onClick={() => navigate('/teachers')} />
        <StatCard title="Active Classes" value={c.classes} icon={BookOpen} description={`${c.batches || 0} batches`} onClick={() => navigate('/classes')} />
        <StatCard title="Pending Fees" value={`PKR ${Number(c.pendingFees).toLocaleString()}`} icon={Wallet} description="Outstanding dues" onClick={() => navigate('/fees')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Collection" value={`PKR ${Number(c.income).toLocaleString()}`} icon={ArrowUpRight} description="All time" onClick={() => navigate('/payments')} />
        <StatCard title="Monthly Income" value={`PKR ${Number(c.monthlyIncome).toLocaleString()}`} icon={TrendingUp} description="This month" onClick={() => navigate('/payments')} />
        <StatCard title="Monthly Expenses" value={`PKR ${Number(c.monthlyExpenses).toLocaleString()}`} icon={ArrowDownRight} description="This month" onClick={() => navigate('/expenses')} />
        <StatCard title="Net Income" value={`PKR ${Number(c.net).toLocaleString()}`} icon={Wallet} description="Income - Expenses" onClick={() => navigate('/reports')} />
      </div>

      {/* Attendance + Charts Row */}
      <div className="dashboard-section-label px-1 pt-2">Performance pulse</div>
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Attendance Card */}
        <Card className="p-5">
          <h2 className="font-bold text-lg mb-4">Today's Attendance</h2>
          <div className="text-center mb-4">
            <div className="text-4xl font-black text-indigo-600">{attPercent}%</div>
            <p className="text-sm text-slate-500">{c.attendance} present / {c.attendanceTotal} total</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-emerald-600">Present</span><span className="font-semibold">{c.attendance}</span></div>
            <div className="flex justify-between text-sm"><span className="text-red-600">Absent</span><span className="font-semibold">{c.attendanceAbsent}</span></div>
            <div className="flex justify-between text-sm"><span className="text-amber-600">Late</span><span className="font-semibold">{c.attendanceLate}</span></div>
          </div>
          <div className="mt-4 h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${attPercent}%` }} />
          </div>
        </Card>

        {/* Fee Trend Chart */}
        <Card className="dashboard-chart p-5 lg:col-span-2">
          <h2 className="font-bold text-lg mb-4">Fee Collection Trend</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.charts?.feeTrend || []}>
                <defs>
                  <linearGradient id="colorFee" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`PKR ${Number(v).toLocaleString()}`, 'Amount']} />
                <Area type="monotone" dataKey="amount" stroke="#4f46e5" fillOpacity={1} fill="url(#colorFee)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Expense Trend */}
        <Card className="dashboard-chart p-5">
          <h2 className="font-bold text-lg mb-4">Expense Trend</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.charts?.expenseTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`PKR ${Number(v).toLocaleString()}`, 'Amount']} />
                <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Class Distribution */}
        <Card className="dashboard-chart p-5">
          <h2 className="font-bold text-lg mb-4">Student Distribution by Class</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.charts?.classDistribution || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="student_count" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Student Growth + Attendance Trend */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-bold text-lg mb-4">Student Admissions Growth</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={d.charts?.studentGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-lg mb-4">Attendance Trend (7 Days)</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={(d.charts?.attendanceTrend || []).map(a => ({ ...a, percentage: a.total ? Math.round(a.present / a.total * 100) : 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} />
                <Line type="monotone" dataKey="percentage" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-5 mt-5">
        {/* Recent Payments */}
        <Card className="p-5">
          <h2 className="font-bold text-lg mb-4">Recent Payments</h2>
          {d.recentPayments?.length ? d.recentPayments.map(x => (
            <div key={x.id} className="flex justify-between items-center py-3 border-b last:border-0">
              <div>
                <div className="font-semibold text-sm">{x.student_name}</div>
                <div className="text-xs text-slate-500">{x.receipt_no} • {x.method}</div>
              </div>
              <div className="font-bold text-sm">PKR {Number(x.amount).toLocaleString()}</div>
            </div>
          )) : <p className="text-slate-400 text-center py-8">No recent payments</p>}
        </Card>

        {/* Upcoming Exams */}
        <Card className="p-5">
          <h2 className="font-bold text-lg mb-4">Upcoming Exams</h2>
          {d.upcomingExams?.length ? d.upcomingExams.map(x => (
            <div key={x.id} className="flex items-center gap-3 py-3 border-b last:border-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 grid place-items-center"><Calendar size={18} /></div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{x.name}</div>
                <div className="text-xs text-slate-500">{x.start_date} • {x.type}</div>
              </div>
              <Badge variant={x.status === 'completed' ? 'success' : 'info'}>{x.status}</Badge>
            </div>
          )) : <p className="text-slate-400 text-center py-8">No upcoming exams</p>}
        </Card>
      </div>

      {/* Recent Admissions + Low Stock */}
      <div className="grid lg:grid-cols-2 gap-5 mt-5">
        <Card className="p-5">
          <h2 className="font-bold text-lg mb-4">Recent Admissions</h2>
          {d.recentAdmissions?.length ? d.recentAdmissions.map(x => (
            <div key={x.id} className="flex items-center gap-3 py-3 border-b last:border-0">
              <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-blue-100 ring-1 ring-blue-200">
                <img src={x.photo_url || getPersonAvatar(x)} alt={x.name || 'Student'} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{x.name}</div>
                <div className="text-xs text-slate-500">{x.admission_no}</div>
              </div>
              <Badge variant={x.status === 'active' ? 'success' : 'default'}>{x.status}</Badge>
            </div>
          )) : <p className="text-slate-400 text-center py-8">No recent admissions</p>}
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-lg mb-4">Low Stock Alerts</h2>
          {d.lowStock?.length ? d.lowStock.map(x => (
            <div key={x.id} className="flex items-center gap-3 py-3 border-b last:border-0">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 grid place-items-center"><AlertCircle size={18} /></div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{x.item_name}</div>
                <div className="text-xs text-slate-500">Reorder level: {x.reorder_level}</div>
              </div>
              <Badge variant="danger">{x.quantity} {x.unit || 'pcs'}</Badge>
            </div>
          )) : <p className="text-slate-400 text-center py-8">All inventory levels are healthy ✓</p>}
        </Card>
      </div>

      {/* Upcoming Events */}
      {d.upcomingEvents?.length > 0 && (
        <Card className="p-5 mt-5">
          <h2 className="font-bold text-lg mb-4">Upcoming Events</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {d.upcomingEvents.map(x => (
              <div key={x.id} className="border rounded-xl p-4">
                <div className="font-semibold">{x.title}</div>
                <div className="text-sm text-slate-500 mt-1">{x.event_date} {x.start_time ? `at ${x.start_time}` : ''}</div>
                {x.location && <div className="text-xs text-slate-400 mt-1">📍 {x.location}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
