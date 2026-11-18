import React from 'react';

/**
 * Standard Short Stage Names for Real Estate Sales Pipeline
 * Replaces long, wordy descriptions with concise, executive-level 1-2 word titles.
 */
export const SHORT_STAGE_NAMES = {
  1: 'Visit Call',
  2: 'Details Sent',
  3: 'Reminder Call',
  4: 'Visit Confirmed',
  5: 'Feedback Call',
  6: 'Sales Follow-up',
  7: 'Negotiation',
  8: 'Final Deal',
};

/**
 * Normalizes any legacy or wordy stage string/object into a concise 1-2 word stage title.
 */
export function formatShortStageName(stage, order = null) {
  const resolvedOrder = resolveStageOrder(stage, order);
  if (resolvedOrder && SHORT_STAGE_NAMES[resolvedOrder]) {
    return SHORT_STAGE_NAMES[resolvedOrder];
  }

  const rawName = (typeof stage === 'string' ? stage : stage?.name || '').trim();
  if (!rawName) return 'Stage 1';

  const lower = rawName.toLowerCase();
  if (lower.includes('visit confirmation by s/c') || lower.includes('call for visit')) return 'Visit Call';
  if (lower.includes('whatsapp') || lower.includes('email confirmation')) return 'Details Sent';
  if (lower.includes('remind call') || lower.includes('telesales')) return 'Reminder Call';
  if (lower.includes('visit confirmed')) return 'Visit Confirmed';
  if (lower.includes('feedback call') || lower.includes('co-ordinator')) return 'Feedback Call';
  if (lower.includes('follow-up call by sales') || lower.includes('sales person')) return 'Sales Follow-up';
  if (lower.includes('negotiation') || lower.includes('family visit')) return 'Negotiation';
  if (lower.includes('final deal') || lower.includes('deal won') || lower.includes('call for final')) return 'Final Deal';

  return rawName;
}

/**
 * Clean, Calm, Professional Enterprise Stage Palette
 * Replaces irritating rainbow/neon colors with subtle, executive neutral slate and soft milestone accents.
 */
export const STAGE_THEMES = {
  1: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    orderBg: 'bg-slate-200/80 text-slate-700',
  },
  2: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    orderBg: 'bg-slate-200/80 text-slate-700',
  },
  3: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    orderBg: 'bg-slate-200/80 text-slate-700',
  },
  4: {
    // Visit Confirmed - Key Positive Field Milestone
    bg: 'bg-emerald-50/80',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    orderBg: 'bg-emerald-200/80 text-emerald-800',
  },
  5: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    orderBg: 'bg-slate-200/80 text-slate-700',
  },
  6: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-blue-400',
    orderBg: 'bg-slate-200/80 text-slate-700',
  },
  7: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-indigo-400',
    orderBg: 'bg-slate-200/80 text-slate-700',
  },
  8: {
    // Final Deal - Deal Closed Milestone
    bg: 'bg-emerald-50/80',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    orderBg: 'bg-emerald-200/80 text-emerald-800',
  },
  default: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    orderBg: 'bg-slate-200/80 text-slate-700',
  },
};

/**
 * Resolves stage order from stage object, stage name, or explicit order prop.
 */
export function resolveStageOrder(stage, order) {
  if (order && Number(order) >= 1 && Number(order) <= 8) return Number(order);
  if (typeof stage === 'object' && stage?.order) return Number(stage.order);

  const name = (typeof stage === 'string' ? stage : stage?.name || '').toLowerCase();
  if (name.includes('visit confirmation by s/c') || name.includes('call for visit') || name.includes('visit call')) return 1;
  if (name.includes('whatsapp') || name.includes('email confirmation') || name.includes('details sent')) return 2;
  if (name.includes('remind call') || name.includes('telesales') || name.includes('reminder call')) return 3;
  if (name.includes('visit confirmed')) return 4;
  if (name.includes('feedback call') || name.includes('co-ordinator')) return 5;
  if (name.includes('follow-up call by sales') || name.includes('sales person') || name.includes('sales follow-up')) return 6;
  if (name.includes('negotiation') || name.includes('family visit')) return 7;
  if (name.includes('final deal') || name.includes('deal won') || name.includes('call for final')) return 8;

  return null;
}

/**
 * Enterprise Responsive Stage Badge
 * Renders a clean, calm, professional pipeline stage badge with concise short titles.
 */
export default function StageBadge({
  stage = '',
  order = null,
  color = null,
  showDot = true,
  showOrder = false,
  className = '',
}) {
  const resolvedOrder = resolveStageOrder(stage, order);
  const displayName = formatShortStageName(stage, resolvedOrder);
  const theme = STAGE_THEMES[resolvedOrder] || STAGE_THEMES.default;
  const originalTooltip = typeof stage === 'string' ? stage : stage?.name || displayName;

  return (
    <span
      title={`Stage ${resolvedOrder ? `${resolvedOrder}: ` : ''}${originalTooltip}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium leading-normal whitespace-nowrap transition-colors shrink-0 ${theme.bg} ${theme.text} ${theme.border} ${className}`}
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
        />
      )}

      <span className="font-semibold text-slate-800">
        {displayName}
      </span>
    </span>
  );
}
