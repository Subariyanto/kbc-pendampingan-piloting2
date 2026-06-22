import { Loader2, Inbox } from 'lucide-react';

export function Loading({ label = 'Memuat...' }) {
  return (
    <div className="flex items-center justify-center py-10 text-slate-500 gap-2">
      <Loader2 className="animate-spin" size={18} /> {label}
    </div>
  );
}

export function Empty({ label = 'Belum ada data', icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <Icon size={36} />
      <div className="mt-2 text-sm">{label}</div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-end gap-3">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="sm:ml-auto flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, color = 'primary', hint }) {
  const colorMap = {
    primary: 'bg-primary-100 text-primary-700',
    gold: 'bg-amber-100 text-amber-700',
    teal: 'bg-teal-100 text-teal-700',
    success: 'bg-emerald-100 text-emerald-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-sky-100 text-sky-700',
  };
  return (
    <div className="stat-card">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
        {Icon && <Icon size={22} />}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-2xl font-bold text-slate-800 leading-tight">{value}</div>
        {hint && <div className="text-xs text-slate-400 mt-0.5">{hint}</div>}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  if (!open) return null;
  const sizeMap = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className={`bg-white rounded-xl shadow-xl w-full ${sizeMap[size]} max-h-[90vh] flex flex-col`}>
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="font-semibold text-slate-800">{title}</div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 text-slate-500"
          >✕</button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function Badge({ color = 'muted', children }) {
  const map = {
    success: 'badge-success',
    warn: 'badge-warn',
    danger: 'badge-danger',
    info: 'badge-info',
    muted: 'badge-muted',
  };
  return <span className={map[color] || 'badge-muted'}>{children}</span>;
}

export function ErrorBox({ message }) {
  if (!message) return null;
  return <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">{message}</div>;
}

export function SuccessBox({ message }) {
  if (!message) return null;
  return <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 text-sm">{message}</div>;
}
