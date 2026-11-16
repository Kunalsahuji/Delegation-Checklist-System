import React from 'react';

/**
 * Enterprise Status Distribution Card
 * Faithfully mirrors Tangdi ERP's WorkDonut with proportional multi-segment SVG arcs,
 * centered metric label, responsive flex-wrapping, and interactive status filtering.
 */
export default function StatusDistributionCard({
  title = 'Status distribution',
  total = 0,
  items = [],
  onSelectStatus,
  activeStatus,
}) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius; // ~87.9646

  let accumulatedLength = 0;
  const validTotal = total > 0 ? total : 1;

  const slices = items
    .filter((it) => it.count > 0)
    .map((it) => {
      const proportion = it.count / validTotal;
      const strokeLength = proportion * circumference;
      const offset = accumulatedLength;
      accumulatedLength += strokeLength;

      return {
        ...it,
        strokeLength,
        offset,
      };
    });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between min-w-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-slate-800">
          {title}
        </h3>
        {activeStatus && (
          <button
            type="button"
            onClick={() => onSelectStatus?.(null)}
            className="text-[11px] text-blue-600 hover:text-blue-700 font-medium shrink-0"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 my-auto w-full">
        {/* SVG Proportional Donut */}
        <div className="relative shrink-0 flex items-center justify-center mx-auto" style={{ width: 140, height: 140 }}>
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            {/* Background Base Ring */}
            <circle
              cx="18"
              cy="18"
              r={radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="4.2"
            />

            {/* Segment Arcs */}
            {total > 0 &&
              slices.map((slice) => (
                <circle
                  key={slice.key}
                  cx="18"
                  cy="18"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="4.2"
                  strokeDasharray={`${slice.strokeLength} ${circumference}`}
                  strokeDashoffset={-slice.offset}
                  className="transition-all duration-300 cursor-pointer hover:opacity-80"
                  onClick={() => onSelectStatus?.(slice.key)}
                >
                  <title>{`${slice.label}: ${slice.count} (${slice.percentage}%)`}</title>
                </circle>
              ))}
          </svg>

          {/* Center Metric */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold tabular-nums text-slate-900 leading-none">
              {total.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">
              Total
            </span>
          </div>
        </div>

        {/* Legend with Tangdi-matching Tabular Count & Percentage */}
        <ul className="min-w-[10rem] flex-1 space-y-1.5 w-full" aria-label={title}>
          {items.map((it) => {
            const isActive = activeStatus === it.key;
            return (
              <li key={it.key}>
                <button
                  type="button"
                  onClick={() => onSelectStatus?.(isActive ? null : it.key)}
                  className={`w-full flex items-center gap-2 text-[13px] rounded px-1.5 py-0.5 transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-900 font-semibold ring-1 ring-blue-200'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: it.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-left text-slate-600">
                    {it.label}
                  </span>
                  <span className="font-medium tabular-nums text-slate-900 text-right shrink-0">
                    {it.count.toLocaleString()}
                  </span>
                  <span className="w-10 text-right text-[11px] tabular-nums text-slate-400 shrink-0">
                    {total > 0 ? `${it.percentage}%` : '—'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
