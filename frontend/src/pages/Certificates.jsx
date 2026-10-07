import { useEffect, useState } from 'react';
import { Award, Download, FileBadge, Loader2, Printer, Save } from 'lucide-react';
import { get, post } from '../lib/api';
import { showToast } from '../components/ui';

const certificateTypes = ['Achievement Certificate', 'Course Completion', 'Character Certificate', 'Leaving Certificate'];

export default function Certificates() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ studentId: '', type: certificateTypes[0], title: 'Certificate of Achievement', body: 'is hereby recognized for excellent performance and dedication during the academic session.', date: new Date().toISOString().slice(0, 10), signatory: 'Principal, AcademyPro' });

  useEffect(() => {
    get('/students').then(data => setStudents(Array.isArray(data) ? data : data?.data || [])).catch(() => showToast('Could not load students', 'error')).finally(() => setLoading(false));
  }, []);

  const student = students.find(item => String(item.id) === String(form.studentId));
  const set = (key, value) => setForm(previous => ({ ...previous, [key]: value }));

  const print = () => window.print();
  const saveCertificate = async () => {
    if (!student) return showToast('Select a student first', 'error');
    setSaving(true);
    try {
      await post('/documents', { entity_type: 'student', entity_id: student.id, title: form.title, document_type: 'certificate', file_url: `certificate://${student.id}/${form.type.toLowerCase().replaceAll(' ', '-')}` });
      showToast('Certificate record saved');
    } catch (error) {
      showToast(error.response?.data?.message || 'Could not save certificate', 'error');
    } finally { setSaving(false); }
  };

  return <section className="mx-auto max-w-7xl pb-8">
    <div className="no-print mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Academy records</p><h1 className="mt-2 text-3xl font-black text-slate-900">Certificate Generation System</h1><p className="mt-1 text-slate-500">Create a print-ready certificate and keep its record linked to the student.</p></div><div className="flex gap-2"><button onClick={saveCertificate} disabled={saving} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save record</button><button onClick={print} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"><Printer size={16} /> Print / PDF</button></div></div>
    <div className="no-print mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3"><label className="block"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Student</span><select value={form.studentId} onChange={event => set('studentId', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"><option value="">{loading ? 'Loading students...' : 'Select student'}</option>{students.map(item => <option value={item.id} key={item.id}>{item.name} {item.admission_no ? `(${item.admission_no})` : ''}</option>)}</select></label><label className="block"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Certificate type</span><select value={form.type} onChange={event => set('type', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200">{certificateTypes.map(type => <option key={type}>{type}</option>)}</select></label><label className="block"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Issue date</span><input type="date" value={form.date} onChange={event => set('date', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200" /></label><label className="block md:col-span-3"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Certificate title</span><input value={form.title} onChange={event => set('title', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200" /></label><label className="block md:col-span-2"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Certificate statement</span><textarea rows="2" value={form.body} onChange={event => set('body', event.target.value)} className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200" /></label><label className="block"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Signatory</span><input value={form.signatory} onChange={event => set('signatory', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200" /></label></div>
    <div className="print-card mx-auto max-w-5xl border-[10px] border-double border-blue-700 bg-white p-3 shadow-xl"><div className="border border-blue-200 p-8 text-center md:p-14"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-700 text-white"><Award size={34} /></div><p className="mt-5 text-xs font-black uppercase tracking-[0.3em] text-blue-600">AcademyPro Academy</p><h2 className="mt-5 text-3xl font-black uppercase tracking-wide text-slate-900 md:text-5xl">{form.title}</h2><div className="mx-auto mt-5 h-1 w-24 bg-amber-400" /><p className="mt-8 text-lg text-slate-600">This is to certify that</p><div className="mt-3 text-3xl font-black text-blue-800 md:text-4xl">{student?.name || 'Student Name'}</div><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">{form.body}</p><div className="mt-10 flex flex-wrap justify-center gap-x-16 gap-y-8 text-left"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Student ID</p><p className="mt-1 font-bold text-slate-800">{student?.admission_no || student?.id || '—'}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Issue date</p><p className="mt-1 font-bold text-slate-800">{form.date || '—'}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Session</p><p className="mt-1 font-bold text-slate-800">{student?.academic_session || 'Academic Session'}</p></div></div><div className="mt-14 flex justify-between gap-8 text-left"><div className="border-t border-slate-400 pt-2 text-xs font-bold text-slate-500">Academy Seal</div><div className="border-t border-slate-400 pt-2 text-xs font-bold text-slate-500">{form.signatory}</div></div></div></div>
    <div className="no-print mt-4 flex items-center justify-center gap-2 text-xs text-slate-500"><FileBadge size={14} /> Save the record first, then print or save as PDF.</div>
  </section>;
}