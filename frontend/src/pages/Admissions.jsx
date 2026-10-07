
import { useEffect, useState } from 'react';
import { api, get } from '../lib/api';
import { Card, PageHeader, Badge, Select, Table, Button, showToast } from '../components/ui';
import { ArrowRight, Plus, X, Loader2 } from 'lucide-react';

const blankForm = {
  student_name: '', father_name: '', phone: '', previous_school: '', previous_class: '',
  applied_class: '', applied_batch: '', admission_date: new Date().toISOString().slice(0, 10),
  initial_fee: '', discount: '', documents: '', remarks: '',
};

export default function Admissions() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setError('');
    get('/admissions' + (statusFilter ? `?status=${statusFilter}` : ''))
      .then(d => setRows(Array.isArray(d) ? d : (d?.data || [])))
      .catch(e => setError(e.response?.data?.message || e.message));
  };
  useEffect(load, [statusFilter]);

  const update = (key, value) => setForm(previous => ({ ...previous, [key]: value }));

  const save = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/admissions', {
        ...form,
        initial_fee: Number(form.initial_fee || 0),
        discount: Number(form.discount || 0),
      });
      showToast('Admission application created successfully');
      setForm(blankForm);
      setShowForm(false);
      load();
    } catch (e) {
      showToast(e.response?.data?.message || 'Could not create admission', 'error');
    } finally {
      setSaving(false);
    }
  };

  const act = (id, action) => async () => {
    try {
      await api.post(`/admissions/${id}/${action}`);
      showToast(`Admission ${action === 'convert' ? 'converted to student' : action + 'ed'} successfully`);
      load();
    } catch (e) {
      showToast(e.response?.data?.message || 'Action failed', 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Admissions" subtitle="Admission workflow, student identity and fee-ready records."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onChange={v => setStatusFilter(v)} placeholder="All statuses"
              options={['pending', 'approved', 'rejected', 'confirmed']} />
            <Button onClick={() => setShowForm(true)} icon={Plus}>New Admission</Button>
          </div>
        } />
      {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <Card>
        <Table
          loading={false}
          columns={[
            { key: 'application_no', label: 'Application No.' },
            { key: 'student_name', label: 'Student' },
            { key: 'father_name', label: 'Guardian' },
            { key: 'phone', label: 'Phone' },
            { key: 'applied_class', label: 'Applied Class' },
            { key: 'admission_date', label: 'Date' },
            { key: 'status', label: 'Status', render: v => <Badge variant={v === 'confirmed' || v === 'converted' || v === 'approved' ? 'success' : v === 'rejected' ? 'danger' : 'warning'}>{v}</Badge> },
            {
              key: '_actions', label: 'Actions', render: (_, r) => (
                <div className="flex gap-2">
                  {r.status === 'pending' && <Button size="sm" variant="success" onClick={act(r.id, 'approve')}>Approve</Button>}
                  {r.status === 'pending' && <Button size="sm" variant="danger" onClick={act(r.id, 'reject')}>Reject</Button>}
                  {r.status === 'approved' && <Button size="sm" icon={ArrowRight} onClick={act(r.id, 'convert')}>Convert</Button>}
                  {r.status !== 'pending' && r.status !== 'approved' && <span className="text-xs text-slate-400">—</span>}
                </div>
              )
            },
          ]}
          rows={rows}
          emptyMessage="No admission applications found"
        />
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={save} onClick={event => event.stopPropagation()} className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-5">
              <div><h2 className="text-xl font-black">New Admission</h2><p className="mt-1 text-sm text-slate-500">Complete the student admission record.</p></div>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-2 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {[
                ['student_name', 'Student Name', 'text', true], ['father_name', 'Father / Guardian Name', 'text', true],
                ['phone', 'Phone Number', 'tel', true], ['previous_school', 'Previous School', 'text', false],
                ['previous_class', 'Previous Class', 'text', false], ['applied_class', 'Applied Class', 'text', true],
                ['applied_batch', 'Applied Batch', 'text', false], ['admission_date', 'Admission Date', 'date', true],
                ['initial_fee', 'Initial Fee', 'number', false], ['discount', 'Discount', 'number', false],
              ].map(([key, label, type, required]) => (
                <label key={key} className="block"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
                  <input required={required} type={type} min={type === 'number' ? 0 : undefined} value={form[key]} onChange={event => update(key, event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200" />
                </label>
              ))}
              <label className="block md:col-span-2"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Documents</span>
                <input placeholder="B-Form, previous result, photos, etc." value={form.documents} onChange={event => update('documents', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200" />
              </label>
              <label className="block md:col-span-2"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Remarks</span>
                <textarea rows="3" value={form.remarks} onChange={event => update('remarks', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200" />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t p-5">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 size={15} className="animate-spin" />} Save Admission</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
