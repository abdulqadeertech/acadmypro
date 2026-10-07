import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, get } from '../lib/api';
import { Card, PageHeader, Button, Badge, Input, showToast } from '../components/ui';
import { Printer, Download, Loader2, Award, BookOpen, Users } from 'lucide-react';

export default function ReportCards() {
  const [searchParams] = useSearchParams();
  const [id, setId] = useState(searchParams.get('student') || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [students, setStudents] = useState([]);

  useEffect(() => {
    get('/students')
      .then(d => setStudents(Array.isArray(d) ? d : (d?.data || [])))
      .catch(() => {});
  }, []);

  async function generate(targetId = id) {
    const studentToFetch = targetId || id;
    if (!studentToFetch) return;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const result = await api.get(`/reports/report-card/${encodeURIComponent(studentToFetch)}`);
      setData(result.data);
    } catch (x) {
      setError(x.response?.data?.message || 'Unable to generate report card');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialStudent = searchParams.get('student');
    if (initialStudent) {
      setId(initialStudent);
      generate(initialStudent);
    }
  }, [searchParams]);

  const printCard = () => {
    const content = document.getElementById('report-card-content');
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Report Card</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background: #f5f5f5; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
        .logo { font-size: 24px; font-weight: bold; }
        .info { font-size: 12px; color: #666; margin-top: 5px; }
        .footer { margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 11px; }
        .grade { font-weight: bold; }
        .pass { color: green; }
        .fail { color: red; }
        @media print { body { padding: 0; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      <PageHeader title="Report Cards" subtitle="Generate student report cards" />

      {/* Search & Select */}
      <Card className="p-5 mb-5">
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Choose from Students</label>
            <select
              value={id}
              onChange={e => {
                setId(e.target.value);
                if (e.target.value) generate(e.target.value);
              }}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select a student...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.admission_no})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Or Enter ID / Admission No</label>
            <input
              value={id}
              onChange={e => setId(e.target.value)}
              placeholder="e.g. STU-1001 or 1"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200"
              onKeyDown={e => e.key === 'Enter' && generate()}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => generate()} loading={loading} icon={Award}>Generate</Button>
            {data && <Button variant="secondary" onClick={printCard} icon={Printer}>Print</Button>}
          </div>
        </div>
        {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
      </Card>

      {/* Report Card */}
      {data && (
        <div id="report-card-content">
          <Card className="p-8">
            {/* Header */}
            <div className="text-center mb-6 pb-4 border-b-2 border-slate-800">
              <div className="text-3xl font-black">{data.settings?.academy_name || 'AcademyPro Academy'}</div>
              <div className="text-sm text-slate-500 mt-1">{data.settings?.academy_address || ''}</div>
              <div className="text-sm text-slate-500">{data.settings?.academy_phone || ''}</div>
              <div className="mt-3 text-lg font-bold">STUDENT REPORT CARD</div>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p><strong>Name:</strong> {data.student?.name}</p>
                <p><strong>Father:</strong> {data.student?.father_name}</p>
                <p><strong>Admission No:</strong> {data.student?.admission_no}</p>
              </div>
              <div>
                <p><strong>Class:</strong> {data.batchInfo?.class_name || '—'}</p>
                <p><strong>Batch:</strong> {data.batchInfo?.batch_name || '—'}</p>
                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Results Table */}
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2 text-left">#</th>
                  <th className="border border-slate-300 p-2 text-left">Subject</th>
                  <th className="border border-slate-300 p-2 text-center">Max Marks</th>
                  <th className="border border-slate-300 p-2 text-center">Obtained</th>
                  <th className="border border-slate-300 p-2 text-center">%</th>
                  <th className="border border-slate-300 p-2 text-center">Grade</th>
                  <th className="border border-slate-300 p-2 text-left">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {(data.results || []).map((r, i) => {
                  const pct = r.total_marks ? Math.round(r.obtained_marks / r.total_marks * 100) : 0;
                  return (
                    <tr key={i}>
                      <td className="border border-slate-300 p-2">{i + 1}</td>
                      <td className="border border-slate-300 p-2 font-medium">{r.subject_name}</td>
                      <td className="border border-slate-300 p-2 text-center">{r.total_marks}</td>
                      <td className="border border-slate-300 p-2 text-center font-bold">{r.obtained_marks}</td>
                      <td className="border border-slate-300 p-2 text-center">{pct}%</td>
                      <td className={`border border-slate-300 p-2 text-center font-bold ${pct >= 50 ? 'text-green-600' : 'text-red-600'}`}>{r.grade}</td>
                      <td className="border border-slate-300 p-2">{r.remarks || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Summary */}
            {data.results?.length > 0 && (() => {
              const totalMax = data.results.reduce((s, r) => s + Number(r.total_marks), 0);
              const totalObt = data.results.reduce((s, r) => s + Number(r.obtained_marks), 0);
              const overallPct = totalMax ? Math.round(totalObt / totalMax * 100) : 0;
              return (
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  <div className="grid grid-cols-4 gap-4 text-center text-sm">
                    <div><div className="text-slate-500">Total Marks</div><div className="text-lg font-bold">{totalMax}</div></div>
                    <div><div className="text-slate-500">Obtained</div><div className="text-lg font-bold">{totalObt}</div></div>
                    <div><div className="text-slate-500">Percentage</div><div className="text-lg font-bold">{overallPct}%</div></div>
                    <div><div className="text-slate-500">Grade</div><div className="text-lg font-bold">{data.results[0]?.grade || '—'}</div></div>
                  </div>
                </div>
              );
            })()}

            {/* Attendance */}
            {data.attendance && (
              <div className="mb-6 text-sm">
                <strong>Attendance:</strong> {data.attendance.present || 0}/{data.attendance.total || 0} days present ({data.attendance.percentage || 0}%)
              </div>
            )}

            {/* Ranking */}
            {data.ranking && (
              <div className="mb-6 text-sm">
                <strong>Class Position:</strong> {data.ranking.position} out of {data.ranking.total} students
              </div>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 mt-12 pt-6 border-t">
              <div className="text-center">
                <div className="border-t border-slate-800 w-48 mx-auto mb-1"></div>
                <div className="text-sm text-slate-500">Class Teacher Signature</div>
              </div>
              <div className="text-center">
                <div className="border-t border-slate-800 w-48 mx-auto mb-1"></div>
                <div className="text-sm text-slate-500">Principal/Admin Signature</div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-slate-400 border-t pt-3">
              Generated by AcademyPro Management System • {new Date().toLocaleDateString()}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
