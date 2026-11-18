import React from 'react';
import MetricInfoBadge from './MetricInfoBadge';

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
  columns,
}) {
  const getGridCols = () => {
    if (columns) return columns;
    const count = items.length;
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-1 sm:grid-cols-3';
    if (count === 4) return 'grid-cols-2 sm:grid-cols-4';
    if (count === 6) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
    return 'grid-cols-2 sm:grid-cols-5';
  };

  const resolvedCols = getGridCols();

  return (
    <section
      aria-label={label}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
    >
      <div className={`-mb-px -mr-px grid ${resolvedCols}`}>
        {items.map((item, idx) => {
          const isOddLast = idx === items.length - 1 && items.length % 2 === 1;
          const infoData = item.info || (item.infoSummary ? {
            title: item.infoTitle || item.label,
            summary: item.infoSummary,
            calculation: item.infoCalculation,
          } : null);

          return (
            <div
              key={item.key || item.id || idx}
              className={`border-b sm:border-b-0 border-r border-slate-100 ${
                isOddLast ? 'col-span-2 sm:col-span-1' : ''
              }`}
            >
              <div
                role={item.onClick ? "button" : "region"}
                tabIndex={item.onClick ? 0 : undefined}
                onClick={item.onClick}
                onKeyDown={(e) => {
                  if (item.onClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    item.onClick();
                  }
                }}
                className={`flex h-full w-full flex-col items-start justify-start px-3.5 py-2.5 text-left outline-none transition-all select-none ${
                  item.onClick
                    ? 'cursor-pointer hover:bg-slate-50 focus-visible:bg-slate-50'
                    : 'cursor-default'
                } ${
                  item.active
                    ? 'bg-blue-50/80 ring-2 ring-inset ring-blue-500/30'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between w-full gap-1 mb-0.5">
                  <span className="block truncate text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    {item.label}
                  </span>
                  {infoData && (
                    <MetricInfoBadge
                      title={infoData.title || item.label}
                      summary={infoData.summary}
                      calculation={infoData.calculation}
                    />
                  )}
                </div>
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
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
