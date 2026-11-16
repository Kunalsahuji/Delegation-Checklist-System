import React from 'react';

/**
 * Enterprise Status Distribution Donut Card
 * Faithfully mirrors industry standard with proportional multi-segment SVG arcs,
 * tabular counts, percentage labels, and interactive status filtering.
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

  // Calculate proportional slices with proper accumulated offset
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
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between min-w-0 w-full">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider truncate">
          {title}
        </h3>
        {activeStatus && (
          <button
            onClick={() => onSelectStatus?.(null)}
            className="text-[11px] text-brand-600 hover:text-brand-700 font-medium shrink-0 ml-2"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="flex flex-col min-[380px]:flex-row items-center justify-center min-[380px]:justify-between gap-3 sm:gap-4 my-auto min-w-0 w-full">
        {/* SVG Proportional Donut */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center shrink-0">
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

            {/* Calculated Segment Arcs */}
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
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">
              {total.toLocaleString()}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium uppercase tracking-wider mt-1">
              Total
            </span>
          </div>
        </div>

        {/* Legend with Tabular Count & Percentage */}
        <div className="flex flex-col justify-center space-y-1 sm:space-y-1.5 text-xs flex-1 w-full min-w-0">
          {items.map((it) => {
            const isActive = activeStatus === it.key;
            return (
              <button
                key={it.key}
                type="button"
                onClick={() => onSelectStatus?.(isActive ? null : it.key)}
                className={`flex items-center justify-between gap-1.5 sm:gap-2 group text-left px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg transition-colors w-full min-w-0 ${
                  isActive
                    ? 'bg-brand-50 text-brand-900 font-semibold ring-1 ring-brand-200'
                    : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                  <span
                    className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: it.color }}
                  />
                  <span className="font-medium text-slate-700 group-hover:text-slate-900 truncate text-[11px] sm:text-xs">
                    {it.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-right shrink-0">
                  <span className="font-semibold text-slate-800 tabular-nums text-[11px] sm:text-xs">
                    {it.count.toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-[10px] sm:text-[11px] tabular-nums min-w-[26px] sm:min-w-[32px]">
                    {it.percentage}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
