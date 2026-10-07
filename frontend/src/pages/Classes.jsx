import { useEffect, useState } from 'react';
import CrudPage from '../components/CrudPage';
import { get } from '../lib/api';
import { Layers, Calendar, BookOpen } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Classes() {
  const [activeTab, setActiveTab] = useState('batches');
  const [classList, setClassList] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    get('/classes')
      .then(d => {
        const rows = Array.isArray(d) ? d : (d?.data || []);
        setClassList(rows);
      })
      .catch(() => {});
  }, [activeTab]);

  const classOptions = classList.map(c => c.name);

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      {/* Switcher Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('batches')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'batches'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar size={17} />
          {t('Batches & Sections')}
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'classes'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers size={17} />
          {t('Academic Classes & Levels')}
        </button>
      </div>

      {activeTab === 'batches' ? (
        <CrudPage
          key="batches-crud"
          resource="batches"
          title="Batches & Sections"
          subtitle="Morning, Evening, Weekend, and Entry Test batches linked to academic classes."
          columns={[
            { key: 'name', label: 'Batch Name' },
            { key: 'class_name', label: 'Class' },
            { key: 'shift', label: 'Shift' },
            { key: 'room', label: 'Room' },
            { key: 'capacity', label: 'Capacity' },
            { key: 'fee', label: 'Batch Fee', render: v => `Rs ${Number(v || 0).toLocaleString()}` },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'name', label: 'Batch Name', required: true },
            { name: 'class_id', label: 'Class', type: 'select', options: classList.map(c => c.name) },
            { name: 'shift', label: 'Shift', type: 'select', options: ['Morning', 'Evening', 'Weekend', 'Entry Test'] },
            { name: 'room', label: 'Room' },
            { name: 'capacity', label: 'Capacity (Max Students)', type: 'number' },
            { name: 'fee', label: 'Monthly / Batch Fee', type: 'number' },
            { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'completed'] },
          ]}
          formRender={(form, setForm) => (
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Batch Name *</span>
                <input
                  required
                  value={form.name || ''}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Matric Morning Batch A"
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Academic Class</span>
                <select
                  value={form.class_id || ''}
                  onChange={e => setForm({ ...form, class_id: Number(e.target.value) || '' })}
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select academic class...</option>
                  {classList.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.level || 'Class'})</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Shift</span>
                <select
                  value={form.shift || 'Morning'}
                  onChange={e => setForm({ ...form, shift: e.target.value })}
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {['Morning', 'Evening', 'Weekend', 'Entry Test'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Room</span>
                <input
                  value={form.room || ''}
                  onChange={e => setForm({ ...form, room: e.target.value })}
                  placeholder="e.g. Hall 1, Room 102"
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Capacity</span>
                <input
                  type="number"
                  value={form.capacity ?? 40}
                  onChange={e => setForm({ ...form, capacity: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Batch Fee (PKR)</span>
                <input
                  type="number"
                  value={form.fee ?? ''}
                  onChange={e => setForm({ ...form, fee: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Status</span>
                <select
                  value={form.status || 'active'}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
            </div>
          )}
        />
      ) : (
        <CrudPage
          key="classes-crud"
          resource="classes"
          title="Academic Classes & Levels"
          subtitle="Configure Grade 9, Grade 10, FSc, O-Levels, Entry Test levels."
          columns={[
            { key: 'name', label: 'Class Name' },
            { key: 'code', label: 'Code' },
            { key: 'level', label: 'Academic Level' },
            { key: 'description', label: 'Description' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'name', label: 'Class Name', required: true },
            { name: 'code', label: 'Code (e.g. G9, FSC-1)' },
            { name: 'level', label: 'Level', type: 'select', options: ['Primary', 'Middle', 'Secondary', 'Higher Secondary', 'O-Level', 'A-Level', 'Entry Test'] },
            { name: 'description', label: 'Description' },
            { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
          ]}
        />
      )}
    </div>
  );
}
