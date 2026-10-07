import { useEffect, useMemo, useState, useCallback } from 'react';
import { get, post, put, del } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { showToast } from './ui';
import {
  Plus, Search, Pencil, Trash2, RefreshCw, Download, X, Loader2,
  ChevronLeft, ChevronRight, Filter
} from 'lucide-react';

export default function CrudPage({
  title, resource, fields = [], columns, description = '', subtitle = '', canDelete = true, canEdit = true,
  customActions, formRender, enableSearch = true, enableExport = true,
  hideAdd = false,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const { can } = useAuth();
  const { t } = useLanguage();
  const perPage = 25;

  const load = useCallback(() => {
    setLoading(true);
    setErr('');
    get('/' + resource)
      .then(d => {
        // Handle both array and {data, total} formats
        if (Array.isArray(d)) setRows(d);
        else if (d?.data) setRows(d.data);
        else setRows([]);
      })
      .catch(e => setErr(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [resource]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const search = q.toLowerCase();
    return rows.filter(r => JSON.stringify(r).toLowerCase().includes(search));
  }, [rows, q]);

  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / perPage);

  useEffect(() => { setPage(1); }, [q]);

  useEffect(() => {
    if (!edit) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = event => { if (event.key === 'Escape' && !saving) setEdit(null); };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [edit, saving]);

  const open = (r = null) => {
    setErr('');
    setEdit(r || { _new: true });
    setForm(r ? { ...r } : {});
  };

  const save = async () => {
    setSaving(true);
    setErr('');
    try {
      if (edit?.id) {
        await put('/' + resource + '/' + edit.id, form);
        showToast(`${title} updated successfully`);
      } else {
        await post('/' + resource, form);
        showToast(`${title} created successfully`);
      }
      setEdit(null);
      load();
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm(t('Are you sure you want to delete this record?'))) return;
    try {
      await del('/' + resource + '/' + id);
      showToast(t('Record deleted'), 'success');
      load();
    } catch (e) {
      showToast(e.response?.data?.message || t('Delete failed'), 'error');
    }
  };

  const exportCsv = () => {
    const cols = columns || fields.map(f => [f, f]);
    const headers = cols.map(x => x[1]);
    const csvRows = filtered.map(r => cols.map(x => `"${String(r[x[0]] ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${resource}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast(t('CSV exported'), 'success');
  };

  const normalizedFields = fields.map(field => typeof field === 'string'
    ? { name: field, label: field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }
    : field);
  const cols = (columns || normalizedFields.map(field => ({ key: field.name, label: field.label })))
    .map(column => Array.isArray(column)
      ? { key: column[0], label: column[1] }
      : column);

  return (
    <section>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">{title}</h1>
          {(description || subtitle) && <p className="text-slate-500 mt-1">{description || subtitle}</p>}
        </div>
        <div className="flex gap-2">
          {!hideAdd && (
            <button onClick={() => open()} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl flex items-center gap-2 text-sm hover:bg-blue-700">
              <Plus size={17} /> {t('Add New')}
            </button>
          )}
          {enableExport && (
            <button onClick={exportCsv} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-sm hover:bg-slate-50">
              <Download size={16} /> {t('Export')}
            </button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {/* Search Bar */}
        {enableSearch && (
          <div className="p-4 border-b flex gap-3">
            <div className="flex-1 relative">
              <Search size={17} className="absolute left-3 top-3 text-slate-400" />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder={`${t('Search')} ${t(title).toLowerCase()}...`}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 text-sm"
              />
            </div>
            <button onClick={load} className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50" title={t('Refresh')}>
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        )}

        {/* Error */}
        {err && <div className="m-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{err}</div>}

        {/* Table */}
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {cols.map(({ key, label }) => (
                  <th key={key} className="text-left px-4 py-3 whitespace-nowrap font-semibold">{t(label)}</th>
                ))}
                <th className="px-4 py-3 text-right font-semibold">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={cols.length + 1} className="p-10 text-center text-slate-500">
                  <Loader2 size={24} className="animate-spin mx-auto" />
                  <p className="mt-2">{t('Loading')}</p>
                </td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={cols.length + 1} className="p-10 text-center text-slate-400">
                  {q ? t('No records match your search') : t('No records found')}
                </td></tr>
              ) : paged.map(r => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  {cols.map(({ key, render }) => (
                    <td key={key} className="px-4 py-3 whitespace-nowrap max-w-[200px] truncate">
                      {render ? render(r[key], r) : String(r[key] ?? '—')}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {customActions?.(r)}
                      {canEdit && <button onClick={() => open(r)} className="p-2 border border-slate-200 rounded-lg hover:bg-white" title={t('Edit')}>
                        <Pencil size={14} />
                      </button>}
                      {canDelete && (
                        <button onClick={() => remove(r.id)} className="p-2 border border-slate-200 rounded-lg text-red-600 hover:bg-red-50" title={t('Delete')}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t flex items-center justify-between text-xs text-slate-500">
          <span>{filtered.length} {t('record(s) total')}</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={16} /></button>
              <span className="px-3">{t('Page')} {page} {t('of')} {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {edit && (
        <div className="crud-modal fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-[2px] sm:p-6" onClick={() => !saving && setEdit(null)}>
          <div className="crud-modal-panel mx-auto my-[3vh] flex min-h-0 w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:my-[5vh]" role="dialog" aria-modal="true" aria-labelledby="crud-modal-title" onClick={e => e.stopPropagation()}>
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">{edit.id ? t('Edit record') : t('New record')}</p>
                <h2 id="crud-modal-title" className="mt-1 text-xl font-bold">{edit.id ? t('Edit') : t('Add')} {t(title)}</h2>
              </div>
              <button type="button" onClick={() => setEdit(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label={t('Close')}><X size={18} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {err && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{err}</div>}
              {formRender ? formRender(form, setForm) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {normalizedFields.map(field => (
                    <label key={field.name} className="block">
                      <span className="text-xs font-semibold text-slate-600 capitalize">{field.label || field.name.replaceAll('_', ' ')}</span>
                      {field.type === 'select' ? (
                        <select
                          value={form[field.name] ?? ''}
                          onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                          className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          <option value="">{t('Select...')}</option>
                          {(field.options || []).map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                      ) : field.type === 'file' ? (
                        <>
                          <input
                            type="file"
                            accept={field.accept || 'image/*'}
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => setForm({ ...form, [field.name]: reader.result });
                              reader.readAsDataURL(file);
                            }}
                            className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                          />
                          {form[field.name] && <img src={form[field.name]} alt="Preview" className="mt-2 h-20 w-20 rounded-xl object-cover border" />}
                        </>
                      ) : (
                        <input
                          type={field.type || 'text'}
                          required={field.required}
                          value={form[field.name] ?? ''}
                          onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                          className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
              <button type="button" onClick={() => setEdit(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50">{t('Cancel')}</button>
              <button onClick={save} disabled={saving}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Saving...' : t('Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
