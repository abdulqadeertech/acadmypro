import { useEffect, useState } from 'react';
import { api, get } from '../lib/api';
import { getPersonAvatar } from '../lib/defaultAvatars';
import { useAuth } from '../context/AuthContext';
import { Card, PageHeader, Badge, Tabs, StatCard } from '../components/ui';
import { Users, Calendar, DollarSign, Award, BookOpen, Loader2 } from 'lucide-react';

export default function Portal() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    setLoading(true);
    api.get('/portal/me')
      .then(r => setData(r.data))
      .catch(x => setError(x.response?.data?.message || 'Unable to load portal'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" size={24} /></div>;

  const isParent = user?.role === 'parent';
  const isTeacher = user?.role === 'teacher';

  return (
    <div className="max-w-[1200px] mx-auto">
      <PageHeader title="My Portal" subtitle={`Welcome, ${user?.name} (${user?.role})`} />

      {error && <Card className="p-5 text-red-700 mb-4">{error}</Card>}

      {data && (
        <>
          {/* Overview Cards */}
          <div className="grid sm:grid-cols-3 gap-4 mb-5">
            <Card className="p-5">
              <div className="text-sm text-slate-500">Name</div>
              <div className="mt-1 text-xl font-bold">{data.user?.name}</div>
            </Card>
            <Card className="p-5">
              <div className="text-sm text-slate-500">Role</div>
              <div className="mt-1 text-xl font-bold capitalize">{data.user?.role?.replace('_', ' ')}</div>
            </Card>
            <Card className="p-5">
              <div className="text-sm text-slate-500">Branch</div>
              <div className="mt-1 text-xl font-bold">{data.user?.branchId || 'All Branches'}</div>
            </Card>
          </div>

          {/* Parent View */}
          {isParent && data.children?.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">My Children ({data.children.length})</h2>
              {data.children.map(child => (
                <ChildCard key={child.id} studentId={child.id} student={child} />
              ))}
            </div>
          )}

          {isParent && (!data.children || data.children.length === 0) && (
            <Card className="p-8 text-center">
              <Users size={48} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-semibold">No Children Found</h3>
              <p className="text-slate-500 text-sm mt-1">No student records are linked to your account.</p>
            </Card>
          )}

          {/* Teacher View */}
          {isTeacher && data.assignments && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">My Assignments ({data.assignments.length})</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.assignments.map((a, i) => (
                  <Card key={i} className="p-5">
                    <div className="text-sm text-slate-500">Subject</div>
                    <div className="font-bold">{a.subject_name || '—'}</div>
                    <div className="text-sm text-slate-500 mt-2">Batch</div>
                    <div className="font-semibold">{a.batch_name || '—'}</div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Admin View */}
          {!isParent && !isTeacher && data.summary && (
            <div className="grid sm:grid-cols-3 gap-4">
              <StatCard title="Total Students" value={data.summary.students} icon={Users} />
              <StatCard title="Total Teachers" value={data.summary.teachers} icon={Users} />
              <StatCard title="Active Classes" value={data.summary.classes} icon={BookOpen} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ChildCard({ studentId, student }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    get(`/portal/student/${studentId}`).then(setDetail).finally(() => setLoading(false));
  }, [studentId]);

  return (
    <Card className="overflow-hidden">
      <div className="p-5 border-b bg-slate-50">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-blue-100 ring-1 ring-blue-200">
            <img src={student.photo_url || getPersonAvatar(student)} alt={student.name || 'Student'} className="h-full w-full object-cover" />
          </div>
          <div>
            <h3 className="text-lg font-bold">{student.name}</h3>
            <div className="text-sm text-slate-500">{student.admission_no} • {student.father_name}</div>
          </div>
          <Badge variant="success" className="ml-auto">{student.status}</Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b overflow-x-auto">
        {['overview', 'attendance', 'fees', 'results'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
            }`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      <div className="p-5">
        {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : detail && (
          <>
            {tab === 'overview' && (
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div><strong>Class:</strong> {student.father_name || '—'}</div>
                <div><strong>Phone:</strong> {student.phone || '—'}</div>
                <div><strong>Monthly Fee:</strong> PKR {student.monthly_fee}</div>
                <div><strong>Admission Date:</strong> {student.admission_date}</div>
              </div>
            )}
            {tab === 'attendance' && (
              <div className="space-y-2">
                {detail.attendance?.slice(0, 15).map((a, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b text-sm">
                    <span>{a.date}</span>
                    <Badge variant={a.status === 'present' ? 'success' : a.status === 'absent' ? 'danger' : 'warning'}>
                      {a.status}
                    </Badge>
                  </div>
                ))}
                {(!detail.attendance || detail.attendance.length === 0) && <p className="text-slate-400 text-center py-4">No attendance records</p>}
              </div>
            )}
            {tab === 'fees' && (
              <div className="space-y-2">
                {detail.fees?.map((f, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b text-sm">
                    <div>
                      <div className="font-medium">{f.billing_month}</div>
                      <div className="text-xs text-slate-500">Due: PKR {f.amount}</div>
                    </div>
                    <Badge variant={f.status === 'paid' ? 'success' : 'danger'}>{f.status}</Badge>
                  </div>
                ))}
                {(!detail.fees || detail.fees.length === 0) && <p className="text-slate-400 text-center py-4">No fee records</p>}
              </div>
            )}
            {tab === 'results' && (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b">
                    <th className="p-2 text-left">Exam</th>
                    <th className="p-2 text-left">Subject</th>
                    <th className="p-2 text-center">Marks</th>
                    <th className="p-2 text-center">Grade</th>
                  </tr></thead>
                  <tbody>
                    {detail.results?.map((r, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{r.exam_name}</td>
                        <td className="p-2">{r.subject_name}</td>
                        <td className="p-2 text-center">{r.obtained_marks}/{r.total_marks}</td>
                        <td className="p-2 text-center font-bold">{r.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!detail.results || detail.results.length === 0) && <p className="text-slate-400 text-center py-4">No results available</p>}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
