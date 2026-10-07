import { useEffect, useState } from 'react';
import { BookOpen, Link2, Loader2, Plus, Trash2, UserRound } from 'lucide-react';
import { del, get, post } from '../lib/api';
import { showToast } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';

const rowsFrom = value => Array.isArray(value) ? value : value?.data || [];

export default function TeacherSubjects() {
  const { t } = useLanguage();
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState({ teacher_id: '', subject_id: '', batch_id: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [assignmentData, teacherData, subjectData, batchData] = await Promise.all([
        get('/admin/assignments'), get('/teachers'), get('/subjects'), get('/batches'),
      ]);
      setAssignments(rowsFrom(assignmentData));
      setTeachers(rowsFrom(teacherData));
      setSubjects(rowsFrom(subjectData));
      setBatches(rowsFrom(batchData));
    } catch (error) {
      showToast(error.response?.data?.message || 'Could not load teacher subjects', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      await post('/admin/assignments', {
        teacher_id: Number(form.teacher_id),
        subject_id: Number(form.subject_id),
        batch_id: form.batch_id ? Number(form.batch_id) : null,
      });
      showToast('Subject assigned to teacher');
      setForm({ teacher_id: '', subject_id: '', batch_id: '' });
      load();
    } catch (error) {
      showToast(error.response?.data?.message || 'Could not assign subject', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async id => {
    if (!window.confirm('Remove this subject assignment?')) return;
    try {
      await del(`/admin/assignments/${id}`);
      showToast('Assignment removed');
      setAssignments(current => current.filter(row => row.id !== id));
    } catch (error) {
      showToast(error.response?.data?.message || 'Could not remove assignment', 'error');
    }
  };

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">{t('Teacher Subjects')}</h1>
          <p className="mt-1 text-slate-500">Assign a separate subject to each teacher and class.</p>
        </div>
        <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
          {assignments.length} assignments
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={save} className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Link2 size={19} /></div>
            <div><h2 className="font-bold">Assign Subject</h2><p className="text-xs text-slate-500">Create teacher subject mapping</p></div>
          </div>
          <label className="mb-4 block"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Teacher</span>
            <select required value={form.teacher_id} onChange={event => setForm({ ...form, teacher_id: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
              <option value="">Select teacher</option>{teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
            </select>
          </label>
          <label className="mb-4 block"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Subject</span>
            <select required value={form.subject_id} onChange={event => setForm({ ...form, subject_id: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
              <option value="">Select subject</option>{subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}{subject.code ? ` (${subject.code})` : ''}</option>)}
            </select>
          </label>
          <label className="mb-5 block"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Class / Batch (optional)</span>
            <select value={form.batch_id} onChange={event => setForm({ ...form, batch_id: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
              <option value="">All classes</option>{batches.map(batch => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
            </select>
          </label>
          <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Assign Subject
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5"><h2 className="font-bold">Teacher Subject List</h2><p className="mt-1 text-sm text-slate-500">Each teacher's assigned subject and class.</p></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-5 py-3 text-left">Teacher</th><th className="px-5 py-3 text-left">Subject</th><th className="px-5 py-3 text-left">Class / Batch</th><th className="px-5 py-3 text-right">Action</th></tr></thead>
              <tbody>{loading ? <tr><td colSpan="4" className="p-10 text-center text-slate-400"><Loader2 size={22} className="mx-auto animate-spin" /></td></tr> : assignments.length === 0 ? <tr><td colSpan="4" className="p-10 text-center text-slate-400">No teacher subjects assigned yet.</td></tr> : assignments.map(row => <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-5 py-3 font-semibold"><span className="mr-2 inline-grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600"><UserRound size={15} /></span>{row.teacher_name}</td><td className="px-5 py-3"><span className="mr-2 inline-grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><BookOpen size={15} /></span>{row.subject_name || 'All subjects'}</td><td className="px-5 py-3 text-slate-500">{row.batch_name || 'All classes'}</td><td className="px-5 py-3 text-right"><button type="button" onClick={() => remove(row.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Remove assignment" aria-label="Remove assignment"><Trash2 size={16} /></button></td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
