export const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  onClick,
  active = false,
}) => {
  const variantStyles = {
    default: 'text-slate-900 border-slate-200 bg-white hover:border-slate-300',
    primary: 'text-brand-900 border-brand-200 bg-brand-50/50 hover:border-brand-300',
    success: 'text-emerald-900 border-emerald-200 bg-emerald-50/50 hover:border-emerald-300',
    warning: 'text-amber-900 border-amber-200 bg-amber-50/50 hover:border-amber-300',
    danger: 'text-rose-900 border-rose-200 bg-rose-50/50 hover:border-rose-300',
  };

  const activeStyles = active ? 'ring-2 ring-brand-500 border-brand-500' : '';

  return (
    <div
      onClick={onClick}
      className={`relative p-4 rounded-xl border bg-white shadow-subtle transition-all ${
        onClick ? 'cursor-pointer hover:shadow-card' : ''
      } ${variantStyles[variant]} ${activeStyles}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">
          {value !== undefined && value !== null ? value : '—'}
        </span>
      </div>
      {subtext && <p className="mt-1 text-xs text-slate-500 line-clamp-1">{subtext}</p>}
    </div>
  );
};
