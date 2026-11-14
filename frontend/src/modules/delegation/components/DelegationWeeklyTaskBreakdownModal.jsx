import React from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, AlertTriangle, CheckCircle2, History, User } from 'lucide-react';
import { StatusBadge } from '../../../components/StatusBadge';
import { PriorityBadge } from '../../../components/PriorityBadge';

const formatCivilDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getUTCDate()).padStart(2, '0')}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
};

export default function DelegationWeeklyTaskBreakdownModal({
  isOpen,
  onClose,
  title = 'Task Audit Breakdown',
  category = 'all', // 'green', 'yellow', 'red', or 'doer'
  doerName = '',
  tasks = [],
}) {
  if (!isOpen) return null;

  const filteredTasks = tasks.filter((t) => {
    if (category === 'green') return (t.revisionCount || 0) === 0;
    if (category === 'yellow') return (t.revisionCount || 0) === 1;
    if (category === 'red') return (t.revisionCount || 0) >= 2;
    if (doerName) return t.doerName === doerName;
    return true;
  });

  const categoryMeta = {
    green: {
      label: 'Green Score Tasks (0 Revisions)',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      rule: 'High Reliability: Delivered strictly on or before original deadline with 0 extensions.',
    },
    yellow: {
      label: 'Yellow Score Tasks (1 Revision)',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      rule: 'Managed Extension: Shifted deadline exactly once with documented justification.',
    },
    red: {
      label: 'Red Score Tasks (2+ Revisions / Chronic Delay)',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      rule: 'Project Risk: Rescheduled 2 or more times or currently overdue past revised schedule.',
    },
    all: {
      label: doerName ? `Tasks for ${doerName}` : 'All Weekly Tasks',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      rule: 'Audit list of all tasks tracked in this performance period.',
    },
  }[category] || {
    label: title,
    badge: 'bg-slate-50 text-slate-700 border-slate-200',
    rule: 'Filtered operational tasks for current view.',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryMeta.badge}`}>
                {categoryMeta.label}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                ({filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {categoryMeta.rule}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3 divide-y divide-slate-100">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No tasks found for this specific score category in this week.
            </div>
          ) : (
            filteredTasks.map((t) => {
              const revs = t.revisionCount || 0;
              const rygClass =
                revs === 0
                  ? 'border-l-4 border-emerald-500 bg-emerald-50/30'
                  : revs === 1
                  ? 'border-l-4 border-amber-500 bg-amber-50/30'
                  : 'border-l-4 border-rose-500 bg-rose-50/30';

              return (
                <div key={t._id} className={`pt-3 first:pt-0 p-3 rounded-lg border border-slate-200 ${rygClass} transition-all`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{t.code}</span>
                        <PriorityBadge priority={t.priority || 'medium'} />
                        <StatusBadge status={t.status} />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800">{t.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <strong className="text-slate-700">{t.doerName}</strong>
                        </span>
                        <span>•</span>
                        <span>{t.departmentName || 'Company-wide'}</span>
                        <span>•</span>
                        <span>Project: {t.projectName || 'Company-wide'}</span>
                      </div>
                    </div>

                    <div className="text-right sm:text-right shrink-0 space-y-1">
                      <div className="text-xs">
                        <span className="text-slate-400">Committed:</span>{' '}
                        <strong className="text-slate-700 font-mono">{formatCivilDate(t.originalDueDate)}</strong>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-400">Current Due:</span>{' '}
                        <strong className="text-slate-900 font-mono font-bold">{formatCivilDate(t.dueDate)}</strong>
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        revs === 0 ? 'bg-emerald-100 text-emerald-800' : revs === 1 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {revs === 0 ? '0 Moves (Green)' : revs === 1 ? '1 Move (Yellow)' : `${revs} Moves (Red)`}
                      </span>
                    </div>
                  </div>

                  {/* Revision Audit History */}
                  {t.revisions && t.revisions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 space-y-1.5 bg-white/70 p-2.5 rounded-md">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <History className="w-3.5 h-3.5 text-slate-500" />
                        <span>Revision History & Reason Log:</span>
                      </div>
                      {t.revisions.map((rev, rIdx) => (
                        <div key={rIdx} className="text-xs text-slate-600 pl-4 border-l-2 border-slate-200">
                          <span className="font-mono text-slate-700 font-medium">
                            {formatCivilDate(rev.fromDate)} → {formatCivilDate(rev.toDate)}:
                          </span>{' '}
                          <span className="text-slate-800 font-medium italic">"{rev.reason || 'Reason not stated'}"</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
