import React from 'react';

export function PriorityBadge({ priority = 'medium', className = '' }) {
  const norm = (priority || '').toLowerCase();
  const config = {
    high: {
      label: 'High',
      classes: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    medium: {
      label: 'Medium',
      classes: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    low: {
      label: 'Low',
      classes: 'bg-slate-50 text-slate-700 border-slate-200',
    },
  }[norm] || {
    label: priority || 'Medium',
    classes: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${config.classes} ${className}`}
    >
      {config.label}
    </span>
  );
}

export default PriorityBadge;
