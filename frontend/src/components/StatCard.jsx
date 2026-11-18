import React from 'react';
import MetricInfoBadge from './MetricInfoBadge';

export const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  onClick,
  active = false,
  loading = false,
  info,
}) => {
  const variantStyles = {
    default: 'text-slate-900 border-slate-200 bg-white hover:border-slate-300',
    primary: 'text-brand-900 border-brand-200 bg-brand-50/50 hover:border-brand-300',
    success: 'text-emerald-900 border-emerald-200 bg-emerald-50/50 hover:border-emerald-300',
    warning: 'text-amber-900 border-amber-200 bg-amber-50/50 hover:border-amber-300',
    danger: 'text-rose-900 border-rose-200 bg-rose-50/50 hover:border-rose-300',
    purple: 'text-purple-900 border-purple-200 bg-purple-50/50 hover:border-purple-300',
    orange: 'text-orange-900 border-orange-200 bg-orange-50/50 hover:border-orange-300',
    sky: 'text-sky-900 border-sky-200 bg-sky-50/50 hover:border-sky-300',
    indigo: 'text-indigo-900 border-indigo-200 bg-indigo-50/50 hover:border-indigo-300',
  };

  const valueColors = {
    default: 'text-blue-600',
    primary: 'text-blue-600',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-rose-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    sky: 'text-sky-600',
    indigo: 'text-indigo-600',
  };

  const activeStyles = active ? 'ring-2 ring-brand-500 border-brand-500' : '';

  const isLoading = loading || value === null || value === undefined;

  return (
    <div
      onClick={onClick}
      className={`relative p-3 sm:p-4 rounded-xl border bg-white shadow-subtle transition-all min-w-0 ${
        onClick ? 'cursor-pointer hover:shadow-card' : ''
      } ${variantStyles[variant] || variantStyles.default} ${activeStyles}`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span
            className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 truncate"
            title={title}
          >
            {title}
          </span>
          {info && (
            <MetricInfoBadge
              title={info.title || title}
              summary={info.summary}
              calculation={info.calculation}
            />
          )}
        </div>
        {Icon && (
          <Icon
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ml-0.5 ${
              valueColors[variant] || 'text-slate-400'
            }`}
          />
        )}
      </div>
      <div className="mt-1.5 sm:mt-2 flex items-baseline gap-2 min-h-[28px] sm:min-h-[32px]">
        {isLoading ? (
          <div className="h-6 sm:h-7 w-16 sm:w-20 bg-slate-200/80 animate-pulse rounded-md" />
        ) : (
          <span className={`text-lg sm:text-2xl font-bold tracking-tight truncate ${valueColors[variant] || 'text-slate-900'}`}>
            {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          </span>
        )}
      </div>
      {subtext && (
        <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500 line-clamp-1 truncate" title={subtext}>
          {subtext}
        </p>
      )}
    </div>
  );
};
