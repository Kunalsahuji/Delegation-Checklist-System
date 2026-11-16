import React from 'react';

const TONES = {
  default: 'text-slate-900',
  warning: 'text-amber-600',
  danger: 'text-rose-600',
  success: 'text-emerald-600',
  sky: 'text-sky-600',
  orange: 'text-orange-600',
};

/**
 * Enterprise Work KPI Strip
 * Faithfully mirrors Tangdi ERP's WorkKpiStrip: a unified single bordered panel
 * with cell dividers that stays in 1 row across desktop and tablet (sm:grid-cols-5),
 * cleanly wrapping on mobile (grid-cols-2).
 */
export default function WorkKpiStrip({
  items = [],
  label = 'KPI Summary',
  loading = false,
  showHints = true,
  columns = 'grid-cols-2 sm:grid-cols-5',
}) {
  return (
    <section
      aria-label={label}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
    >
      <div className={`-mb-px -mr-px grid ${columns}`}>
        {items.map((item, idx) => {
          const isOddLast = idx === items.length - 1 && items.length % 2 === 1;
          return (
            <div
              key={item.key}
              className={`border-b sm:border-b-0 border-r border-slate-100 ${
                isOddLast ? 'col-span-2 sm:col-span-1' : ''
              }`}
            >
              <button
                type="button"
                onClick={item.onClick}
                className="flex h-full w-full flex-col items-start justify-start px-3.5 py-2.5 text-left outline-none transition-colors hover:bg-slate-50 focus-visible:bg-slate-50"
              >
                <span className="block w-full truncate text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {item.label}
                </span>
                {loading ? (
                  <span className="mt-1 block h-6 w-12 animate-pulse rounded bg-slate-200/70" />
                ) : (
                  <span className={`block text-xl sm:text-2xl font-bold leading-7 tabular-nums ${TONES[item.tone] || TONES.default}`}>
                    {item.value ?? 0}
                  </span>
                )}
                {showHints && item.hint && (
                  <span className="mt-0.5 block text-[11px] leading-4 text-slate-400 truncate w-full">
                    {item.hint}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
