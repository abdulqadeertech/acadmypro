import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X, AlertTriangle, CheckCircle, Info, Loader2, ChevronDown } from 'lucide-react';

// ===== CARD =====
export function Card({ children, className = '', ...props }) {
  return <div className={`modern-card rounded-xl border border-slate-200 bg-white shadow-sm ${className}`} {...props}>{children}</div>;
}

// ===== BUTTON =====
export function Button({ children, className = '', variant = 'primary', size = 'md', loading, disabled, icon: Icon, ...props }) {
  const base = 'modern-button rounded-lg font-semibold transition hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-300';
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

// ===== STAT CARD =====
export function StatCard({ title, value, icon: Icon, description, trend, trendValue, onClick, className = '' }) {
  const interactive = Boolean(onClick);
  return (
    <Card
      className={`stat-card p-5 ${interactive ? 'cursor-pointer transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-200' : ''} ${className}`}
      onClick={onClick}
      onKeyDown={event => {
        if (interactive && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
      role={interactive ? 'link' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight">{value}</p>
          {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
          {trend && (
            <p className={`mt-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </p>
          )}
        </div>
        {Icon && <div className="stat-icon rounded-xl bg-blue-50 p-3 text-blue-600"><Icon size={21} /></div>}
      </div>
    </Card>
  );
}

// ===== TABLE =====
export function Table({ columns, rows, onRowClick, loading, emptyMessage = 'No records found' }) {
  if (loading) return <div className="p-10 text-center text-slate-500"><Loader2 size={24} className="animate-spin mx-auto" /><p className="mt-2">Loading...</p></div>;
  return (
    <div className="overflow-x-auto rounded-xl">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="modern-table-head bg-slate-50 text-slate-500">
          <tr>{columns.map(c => <th key={c.key} className="px-4 py-3 font-semibold whitespace-nowrap">{c.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-slate-400">{emptyMessage}</td></tr>
          ) : rows.map((r, i) => (
            <tr key={r.id ?? i} className={onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''} onClick={() => onRowClick?.(r)}>
              {columns.map(c => <td key={c.key} className="px-4 py-3 whitespace-nowrap">{c.render ? c.render(r[c.key], r) : (r[c.key] ?? '—')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===== PAGE HEADER =====
export function PageHeader({ title, subtitle, action, actions, breadcrumbs }) {
  return (
    <div className="page-header mb-6">
      {breadcrumbs && (
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span>/</span>}
              {b.href ? <Link to={b.href} className="hover:text-blue-600">{b.label}</Link> : <span>{b.label}</span>}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {action}
        </div>
      </div>
    </div>
  );
}

// ===== MODAL =====
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl', full: 'max-w-[90vw]' };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-xl w-full ${sizes[size]} max-h-[90vh] flex flex-col shadow-2xl`} onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5 overflow-auto flex-1">{children}</div>
        {footer && <div className="p-5 border-t flex justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

// ===== CONFIRM DIALOG =====
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', variant = 'danger', loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="text-sm text-slate-600 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
}

// ===== TOAST =====
let toastId = 0;
let toastListeners = [];

export function showToast(message, type = 'success', duration = 3000) {
  const id = ++toastId;
  toastListeners.forEach(fn => fn({ id, message, type }));
  setTimeout(() => {
    toastListeners.forEach(fn => fn({ id, remove: true }));
  }, duration);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (toast) => {
      if (toast.remove) {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      } else {
        setToasts(prev => [...prev, toast]);
      }
    };
    toastListeners.push(handler);
    return () => { toastListeners = toastListeners.filter(fn => fn !== handler); };
  }, []);

  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(t => {
        const colors = {
          success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          error: 'bg-red-50 border-red-200 text-red-800',
          info: 'bg-blue-50 border-blue-200 text-blue-800',
          warning: 'bg-amber-50 border-amber-200 text-amber-800',
        };
        const icons = { success: CheckCircle, error: AlertTriangle, info: Info, warning: AlertTriangle };
        const Icon = icons[t.type] || Info;
        return (
          <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${colors[t.type]}`}>
            <Icon size={18} />
            <span className="text-sm font-medium">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

// ===== SEARCH INPUT =====
export function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-sm"
      />
    </div>
  );
}

// ===== SELECT =====
export function Select({ value, onChange, options = [], placeholder = 'Select...', className = '' }) {
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)} className={`px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 ${className}`}>
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  );
}

// ===== FORM FIELD =====
export function FormField({ label, required, error, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ===== INPUT =====
export function Input({ label, required, error, className = '', ...props }) {
  return (
    <FormField label={label} required={required} error={error} className={className}>
      <input className={`w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 ${error ? 'border-red-300' : ''}`} {...props} />
    </FormField>
  );
}

// ===== TEXTAREA =====
export function Textarea({ label, required, error, className = '', ...props }) {
  return (
    <FormField label={label} required={required} error={error} className={className}>
      <textarea className={`w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 min-h-[80px] resize-y ${error ? 'border-red-300' : ''}`} {...props} />
    </FormField>
  );
}

// ===== BADGE =====
export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700',
    danger: 'bg-red-50 text-red-700',
    warning: 'bg-amber-50 text-amber-700',
    info: 'bg-blue-50 text-blue-700',
    purple: 'bg-indigo-50 text-indigo-700',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>{children}</span>;
}

// ===== TABS =====
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="border-b border-slate-200">
      <div className="flex gap-0 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
              active === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-xs">{tab.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== EMPTY STATE =====
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-12">
      {Icon && <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 grid place-items-center text-slate-400 mb-4"><Icon size={28} /></div>}
      <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ===== SKELETON =====
export function Skeleton({ className = '', count = 1 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />
  ));
}

// ===== PAGINATION =====
export function Pagination({ page, total, limit, onChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between p-4 border-t">
      <span className="text-sm text-slate-500">
        Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1}>Prev</Button>
        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
          const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
          if (p > totalPages) return null;
          return (
            <button key={p} onClick={() => onChange(p)}
              className={`w-8 h-8 rounded-lg text-sm ${p === page ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}
            >{p}</button>
          );
        })}
        <Button variant="ghost" size="sm" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>Next</Button>
      </div>
    </div>
  );
}
