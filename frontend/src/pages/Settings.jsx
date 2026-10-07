import { useEffect, useState } from 'react';
import { get, put, post } from '../lib/api';
import { Card, PageHeader, Button, Input, Textarea, Badge, showToast, Tabs } from '../components/ui';
import { Save, Loader2, Plus, Trash2, Settings as SettingsIcon, BookOpen, Shield, Bell } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [grouped, setGrouped] = useState({});
  const [gradeRules, setGradeRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('academy');
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    Promise.all([
      get('/settings'),
      get('/settings/grades/rules'),
      get('/settings/expense-categories'),
    ]).then(([s, g, ec]) => {
      setGrouped(s?.grouped || {});
      setSettings(Object.fromEntries((s?.settings || []).map(x => [x.key, x.value])));
      setGradeRules(g || []);
      setExpenseCategories(ec || []);
    }).finally(() => setLoading(false));
  }, []);

  const saveSetting = async (key, value) => {
    try {
      await put('/settings/' + key, { value });
      setSettings(prev => ({ ...prev, [key]: value }));
      showToast('Setting saved');
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to save', 'error');
    }
  };

  const saveAllSettings = async () => {
    setSaving(true);
    try {
      await put('/settings', { settings });
      showToast('All settings saved');
    } catch (e) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveGradeRule = async (rule) => {
    try {
      if (rule.id) {
        await put(`/settings/grades/rules/${rule.id}`, rule);
      } else {
        await post('/settings/grades/rules', rule);
      }
      showToast('Grade rule saved');
      const g = await get('/settings/grades/rules');
      setGradeRules(g || []);
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to save grade rule', 'error');
    }
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await post('/settings/expense-categories', { name: newCategory.trim() });
      showToast('Category added');
      setNewCategory('');
      const ec = await get('/settings/expense-categories');
      setExpenseCategories(ec || []);
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to add category', 'error');
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" size={24} /></div>;

  const tabs = [
    { key: 'academy', label: 'Academy Info' },
    { key: 'rules', label: 'System Rules' },
    { key: 'grades', label: 'Grade Rules' },
    { key: 'categories', label: 'Expense Categories' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        subtitle="Configure academy settings and system rules"
        action={
          <Button onClick={saveAllSettings} loading={saving} icon={Save}>
            Save All
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-200 mb-5 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
              activeTab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* Academy Info Tab */}
      {activeTab === 'academy' && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Academy Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              ['academy_name', 'Academy Name'],
              ['academy_address', 'Address'],
              ['academy_phone', 'Phone'],
              ['academy_email', 'Email'],
              ['academy_website', 'Website'],
              ['currency', 'Currency'],
              ['timezone', 'Timezone'],
              ['academic_year', 'Academic Year'],
              ['academic_session', 'Session'],
            ].map(([key, label]) => (
              <div key={key} className={key === 'academy_address' ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <input
                  value={settings[key] || ''}
                  onChange={e => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* System Rules Tab */}
      {activeTab === 'rules' && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">System Rules</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              ['attendance_lock_days', 'Attendance Lock (days)'],
              ['late_fee_per_day', 'Late Fee Per Day (PKR)'],
              ['max_file_size', 'Max File Size (bytes)'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <input
                  value={settings[key] || ''}
                  onChange={e => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Grade Rules Tab */}
      {activeTab === 'grades' && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-bold">Grade Rules</h3>
            <Button size="sm" onClick={() => {
              const newRule = { grade: '', min_percent: 0, max_percent: 100, gpa: 0, description: '' };
              setGradeRules(prev => [...prev, { ...newRule, _editing: true }]);
            }} icon={Plus}>Add Rule</Button>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left">Grade</th>
                  <th className="p-3 text-center">Min %</th>
                  <th className="p-3 text-center">Max %</th>
                  <th className="p-3 text-center">GPA</th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {gradeRules.map((rule, idx) => (
                  <tr key={rule.id || idx} className="border-t">
                    <td className="p-2">
                      <input value={rule.grade || ''} onChange={e => {
                        const updated = [...gradeRules];
                        updated[idx] = { ...updated[idx], grade: e.target.value };
                        setGradeRules(updated);
                      }} className="w-20 px-2 py-1.5 border rounded-lg text-sm" />
                    </td>
                    <td className="p-2">
                      <input type="number" value={rule.min_percent ?? ''} onChange={e => {
                        const updated = [...gradeRules];
                        updated[idx] = { ...updated[idx], min_percent: Number(e.target.value) };
                        setGradeRules(updated);
                      }} className="w-20 px-2 py-1.5 border rounded-lg text-sm text-center" />
                    </td>
                    <td className="p-2">
                      <input type="number" value={rule.max_percent ?? ''} onChange={e => {
                        const updated = [...gradeRules];
                        updated[idx] = { ...updated[idx], max_percent: Number(e.target.value) };
                        setGradeRules(updated);
                      }} className="w-20 px-2 py-1.5 border rounded-lg text-sm text-center" />
                    </td>
                    <td className="p-2">
                      <input type="number" step="0.1" value={rule.gpa ?? ''} onChange={e => {
                        const updated = [...gradeRules];
                        updated[idx] = { ...updated[idx], gpa: Number(e.target.value) };
                        setGradeRules(updated);
                      }} className="w-16 px-2 py-1.5 border rounded-lg text-sm text-center" />
                    </td>
                    <td className="p-2">
                      <input value={rule.description || ''} onChange={e => {
                        const updated = [...gradeRules];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        setGradeRules(updated);
                      }} className="w-full px-2 py-1.5 border rounded-lg text-sm" />
                    </td>
                    <td className="p-2 text-right">
                      <Button size="sm" onClick={() => saveGradeRule(rule)} icon={Save}>Save</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Expense Categories Tab */}
      {activeTab === 'categories' && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Expense Categories</h3>
          <div className="flex gap-2 mb-4">
            <input value={newCategory} onChange={e => setNewCategory(e.target.value)}
              placeholder="New category name"
              className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200"
              onKeyDown={e => e.key === 'Enter' && addCategory()}
            />
            <Button onClick={addCategory} icon={Plus}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {expenseCategories.map(c => (
              <Badge key={c.id} variant="default">{c.name}</Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
