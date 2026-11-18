import React from 'react';

/**
 * Stage color configurations mapped by stage order (1-8) and normalized names.
 * Uses soft pastel backgrounds, crisp contrast borders, and vibrant dot indicators.
 */
const STAGE_THEMES = {
  1: {
    bg: 'bg-blue-50/90',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-600',
    orderBg: 'bg-blue-200/80 text-blue-900',
  },
  2: {
    bg: 'bg-cyan-50/90',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    dot: 'bg-cyan-600',
    orderBg: 'bg-cyan-200/80 text-cyan-900',
  },
  3: {
    bg: 'bg-purple-50/90',
    text: 'text-purple-800',
    border: 'border-purple-200',
    dot: 'bg-purple-600',
    orderBg: 'bg-purple-200/80 text-purple-900',
  },
  4: {
    bg: 'bg-emerald-50/90',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-600',
    orderBg: 'bg-emerald-200/80 text-emerald-900',
  },
  5: {
    bg: 'bg-green-50/90',
    text: 'text-green-800',
    border: 'border-green-200',
    dot: 'bg-green-600',
    orderBg: 'bg-green-200/80 text-green-900',
  },
  6: {
    bg: 'bg-rose-50/90',
    text: 'text-rose-800',
    border: 'border-rose-200',
    dot: 'bg-rose-600',
    orderBg: 'bg-rose-200/80 text-rose-900',
  },
  7: {
    bg: 'bg-fuchsia-50/90',
    text: 'text-fuchsia-800',
    border: 'border-fuchsia-200',
    dot: 'bg-fuchsia-600',
    orderBg: 'bg-fuchsia-200/80 text-fuchsia-900',
  },
  8: {
    bg: 'bg-amber-50/90',
    text: 'text-amber-900',
    border: 'border-amber-200',
    dot: 'bg-amber-600',
    orderBg: 'bg-amber-200/80 text-amber-950',
  },
  default: {
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-200',
    dot: 'bg-slate-500',
    orderBg: 'bg-slate-200 text-slate-800',
  },
};

/**
 * Resolves stage order from stage object, stage name, or explicit order prop.
 */
function resolveStageOrder(stage, order) {
  if (order && Number(order) >= 1 && Number(order) <= 8) return Number(order);
  if (typeof stage === 'object' && stage?.order) return Number(stage.order);

  const name = (typeof stage === 'string' ? stage : stage?.name || '').toLowerCase();
  if (name.includes('visit confirmation by s/c') || name.includes('call for visit')) return 1;
  if (name.includes('whatsapp') || name.includes('email confirmation')) return 2;
  if (name.includes('remind call') || name.includes('telesales')) return 3;
  if (name.includes('visit confirmed')) return 4;
  if (name.includes('feedback call') || name.includes('co-ordinator')) return 5;
  if (name.includes('follow-up call by sales') || name.includes('sales person')) return 6;
  if (name.includes('negotiation') || name.includes('family visit')) return 7;
  if (name.includes('final deal') || name.includes('deal won')) return 8;

  return null;
}

/**
 * Enterprise Responsive Stage Badge
 * Renders a color-coded, mobile-adaptive pipeline stage badge.
 * Uses rounded-lg instead of rounded-full to avoid vertical ballooning when multi-line text wraps on small screens.
 */
export default function StageBadge({
  stage = '',
  order = null,
  color = null,
  showDot = true,
  showOrder = false,
  className = '',
}) {
  const stageName =
    (typeof stage === 'string' ? stage : stage?.name) || 'Stage 1';
  const resolvedOrder = resolveStageOrder(stage, order);
  const theme = STAGE_THEMES[resolvedOrder] || STAGE_THEMES.default;

  return (
    <span
      title={`Stage ${resolvedOrder ? `${resolvedOrder}: ` : ''}${stageName}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold leading-normal whitespace-nowrap transition-all shrink-0 ${theme.bg} ${theme.text} ${theme.border} ${className}`}
    >
      {showOrder && resolvedOrder && (
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight shrink-0 ${theme.orderBg}`}
        >
          S{resolvedOrder}
        </span>
      )}

      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.dot}`}
          style={color ? { backgroundColor: color } : undefined}
        />
      )}

      <span className="font-semibold">
        {stageName}
      </span>
    </span>
  );
}
