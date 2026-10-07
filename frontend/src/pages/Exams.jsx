import { useState, useEffect } from 'react';
import CrudPage from '../components/CrudPage';
import { get, post } from '../lib/api';
import { Button, Modal, showToast, Badge } from '../components/ui';
import { Award, BookOpen, CheckCircle, Save, Loader2, X, Plus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Exams() {
  const [marksModal, setMarksModal] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    Promise.all([get('/subjects'), get('/batches')])
      .then(([s, b]) => {
        setSubjects(Array.isArray(s) ? s : (s?.data || []));
        setBatches(Array.isArray(b) ? b : (b?.data || []));
      })
      .catch(() => {});
  }, []);

  const openMarksEntry = (exam) => {
    setMarksModal(exam);
    setSelectedSubject('');
    setSelectedBatch(exam.batch_id ? String(exam.batch_id) : '');
    setStudents([]);
    setMarksData({});
  };

  const loadExamStudents = () => {
    if (!selectedSubject) return;
    setLoadingStudents(true);
    const url = selectedBatch ? `/attendance/students?batch_id=${selectedBatch}` : '/attendance/students';
    get(url)
      .then(d => {
        const list = Array.isArray(d) ? d : (d?.data || []);
        setStudents(list);
        // Initialize marks state
        const initial = {};
        list.forEach(st => {
          initial[st.id] = { obtained_marks: '', total_marks: 100, remarks: '' };
        });
        setMarksData(initial);
      })
      .catch(() => showToast('Could not load students for marks entry', 'error'))
      .finally(() => setLoadingStudents(false));
  };

  useEffect(() => {
    if (marksModal && selectedSubject) {
      loadExamStudents();
    }
  }, [selectedSubject, selectedBatch]);

  const updateMark = (studentId, field, value) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [field]: value,
      },
    }));
  };

  const calculateGrade = (obtained, total) => {
    const obt = Number(obtained);
    const tot = Number(total || 100);
    if (!obtained || isNaN(obt) || tot <= 0) return '—';
    const pct = (obt / tot) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
  };

  const saveAllMarks = async () => {
    if (!marksModal || !selectedSubject) return;
    setSavingMarks(true);
    const records = [];
    Object.entries(marksData).forEach(([studentId, data]) => {
      if (data.obtained_marks !== '' && data.obtained_marks !== null && data.obtained_marks !== undefined) {
        records.push({
          student_id: Number(studentId),
          obtained_marks: Number(data.obtained_marks),
          total_marks: Number(data.total_marks || 100),
          remarks: data.remarks || '',
        });
      }
    });

    if (records.length === 0) {
      showToast('Please enter obtained marks for at least one student', 'warning');
      setSavingMarks(false);
      return;
    }

    try {
      const res = await post('/results/bulk', {
        exam_id: marksModal.id,
        subject_id: Number(selectedSubject),
        records,
      });
      showToast(res.message || `Saved marks for ${records.length} students`, 'success');
      setMarksModal(null);
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to save marks', 'error');
    } finally {
      setSavingMarks(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <CrudPage
        resource="exams"
        title="Exams & Tests"
        subtitle="Schedule examinations, tests, and record student marks."
        columns={[
          { key: 'name', label: 'Exam' },
          { key: 'session', label: 'Session' },
          { key: 'type', label: 'Type' },
          { key: 'start_date', label: 'Start Date' },
          { key: 'end_date', label: 'End Date' },
          { key: 'status', label: 'Status' },
        ]}
        fields={[
          { name: 'name', label: 'Exam Name', required: true },
          { name: 'session', label: 'Session (e.g. 2024-2025)' },
          { name: 'type', label: 'Type', type: 'select', options: ['Monthly Test', 'Midterm', 'Final', 'Entry Test', 'Custom'] },
          { name: 'start_date', label: 'Start Date', type: 'date' },
          { name: 'end_date', label: 'End Date', type: 'date' },
          { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published', 'completed'] },
        ]}
        customActions={exam => (
          <button
            onClick={() => openMarksEntry(exam)}
            className="p-2 border border-indigo-200 rounded-lg text-indigo-600 hover:bg-indigo-50 flex items-center gap-1 text-xs font-semibold"
            title="Enter Marks"
          >
            <Award size={14} /> Marks
          </button>
        )}
      />

      {/* Marks Entry Modal */}
      {marksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => !savingMarks && setMarksModal(null)}>
          <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Award className="text-indigo-600" size={20} />
                  Enter Marks: {marksModal.name}
                </h3>
                <p className="text-xs text-slate-500">Record obtained marks and auto-calculate grades.</p>
              </div>
              <button onClick={() => setMarksModal(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>

            {/* Selection bar */}
            <div className="p-5 bg-slate-50 border-b border-slate-100 grid sm:grid-cols-2 gap-4 shrink-0">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Select Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Choose subject...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Filter by Batch (Optional)
                </label>
                <select
                  value={selectedBatch}
                  onChange={e => setSelectedBatch(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">All active students</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Students marks table */}
            <div className="overflow-y-auto flex-1 p-5">
              {!selectedSubject ? (
                <div className="text-center py-12 text-slate-400">
                  <BookOpen size={36} className="mx-auto mb-2 opacity-50" />
                  <p>Please select a subject above to load student marks sheet.</p>
                </div>
              ) : loadingStudents ? (
                <div className="text-center py-12 text-slate-400">
                  <Loader2 size={28} className="animate-spin mx-auto mb-2" />
                  <p>Loading students...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p>No active students found in this batch.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold">#</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Student Name</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Admission No</th>
                      <th className="px-4 py-2.5 text-center font-semibold">Total Marks</th>
                      <th className="px-4 py-2.5 text-center font-semibold">Obtained Marks</th>
                      <th className="px-4 py-2.5 text-center font-semibold">Grade</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((st, i) => {
                      const entry = marksData[st.id] || {};
                      const grade = calculateGrade(entry.obtained_marks, entry.total_marks);
                      return (
                        <tr key={st.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{st.name}</td>
                          <td className="px-4 py-3 text-slate-500 font-mono text-xs">{st.admission_no}</td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={entry.total_marks ?? 100}
                              onChange={e => updateMark(st.id, 'total_marks', e.target.value)}
                              className="w-20 px-2 py-1 text-center border border-slate-200 rounded-lg text-sm"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max={entry.total_marks || 100}
                              placeholder="0"
                              value={entry.obtained_marks ?? ''}
                              onChange={e => updateMark(st.id, 'obtained_marks', e.target.value)}
                              className="w-24 px-2 py-1 text-center font-bold border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-center font-bold">
                            <span className={grade === 'F' ? 'text-red-600' : grade !== '—' ? 'text-emerald-600' : 'text-slate-400'}>
                              {grade}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              placeholder="Good / Average"
                              value={entry.remarks ?? ''}
                              onChange={e => updateMark(st.id, 'remarks', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <span className="text-xs text-slate-500">
                {students.length} student(s) loaded
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setMarksModal(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={saveAllMarks}
                  loading={savingMarks}
                  disabled={!selectedSubject || students.length === 0}
                  icon={Save}
                >
                  Save Marks
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
