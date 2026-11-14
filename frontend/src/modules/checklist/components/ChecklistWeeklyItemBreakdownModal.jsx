import React from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, AlertTriangle, CheckCircle2, User, MessageSquare } from 'lucide-react';

const formatCivilDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getUTCDate()).padStart(2, '0')}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
};

export default function ChecklistWeeklyItemBreakdownModal({
  isOpen,
  onClose,
  title = 'Checklist Audit Breakdown',
  filterType = 'all', // 'notDone', 'all', 'person'
  personName = '',
  items = [],
}) {
  if (!isOpen) return null;

  const filteredItems = items.filter((it) => {
    if (filterType === 'notDone') return it.isNotDone;
    if (personName) return it.personName === personName;
    return true;
  });

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {personName ? `Checklist Items for ${personName}` : filterType === 'notDone' ? 'Incomplete / Slipped Checklist Items' : title}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                ({filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Detailed audit list of operational occurrences scheduled for this weekly period.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Occurrence List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No checklist items found for this selection in this week.
            </div>
          ) : (
            filteredItems.map((it) => {
              const state = it.status;
              const isSlipped = it.isNotDone;
              const badgeClass =
                state === 'done'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : state === 'skipped'
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200';

              return (
                <div key={it._id} className={`p-3.5 rounded-xl border ${isSlipped ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200 bg-white'} space-y-2`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${badgeClass}`}>
                          {state}
                        </span>
                        <span className="text-xs capitalize font-medium text-slate-500">
                          {it.frequency} routine
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900">{it.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {it.personName}
                        </span>
                        <span>•</span>
                        <span>{it.departmentName}</span>
                      </div>
                    </div>

                    <div className="text-right sm:text-right shrink-0 text-xs text-slate-600">
                      <div>
                        Scheduled:{' '}
                        <strong className="text-slate-800 font-mono">{formatCivilDate(it.plannedOn)}</strong>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Due by {it.plannedAt ? new Date(it.plannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '18:00'}
                      </span>
                    </div>
                  </div>

                  {/* Remarks */}
                  {it.remarks && it.remarks.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-md">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-700">Remark / Reason:</span>{' '}
                        <span className="italic">"{it.remarks[it.remarks.length - 1]?.remark || it.remarks[it.remarks.length - 1]?.reason}"</span>
                      </div>
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
