import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  MessageSquare
} from 'lucide-react';

const formatCivilDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getUTCDate()).padStart(2, '0')}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function DelegationDetailDrawer({
  task,
  isOpen,
  onClose,
  onReviseDate,
  onReportDelay,
  onComplete,
  onReopen,
}) {
  React.useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !task) return null;

  const [activeTab, setActiveTab] = useState('revisions');

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full sm:max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {task.code}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                task.status === 'completed'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {task.status}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-500 uppercase font-medium">
                {task.priority || 'medium'} priority
              </span>
            </div>
            <h2 className="text-base font-semibold text-slate-900 leading-snug">
              {task.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Metadata Card */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Assignee (Doer)</span>
              <strong className="text-slate-800 font-medium">{task.assignedToName || 'Unassigned'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Assigned By</span>
              <strong className="text-slate-800 font-medium">{task.assignedByName || 'System'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Project</span>
              <strong className="text-slate-800 font-medium">{task.project?.name || 'Company-wide'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Department</span>
              <strong className="text-slate-800 font-medium">{task.departmentName || '-'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Original Planned Date</span>
              <strong className="text-slate-900 font-semibold">{formatCivilDate(task.originalDueDate)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Current Due Date</span>
              <strong className="text-blue-600 font-semibold">{formatCivilDate(task.dueDate)}</strong>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Description / Scope
              </h4>
              <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Tabs: Revisions vs Progress Remarks */}
          <div>
            <div className="flex border-b border-slate-200 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('revisions')}
                className={`flex items-center gap-1.5 pb-2 text-xs font-semibold border-b-2 mr-4 transition-colors ${
                  activeTab === 'revisions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Revision Audit Trail ({task.revisionCount || task.revisions?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('progress')}
                className={`flex items-center gap-1.5 pb-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'progress'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Progress Remarks ({task.progressRemarks?.length || 0})</span>
              </button>
            </div>

            {/* Tab: Revisions Audit Trail */}
            {activeTab === 'revisions' && (
              <div>
                {!task.revisions || task.revisions.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <History className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-medium text-slate-600">No revisions yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      The task is on its original planned timeline ({formatCivilDate(task.originalDueDate)}).
                    </p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-amber-200">
                    {task.revisions.map((rev, i) => (
                      <div key={i} className="relative text-xs">
                        <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-100" />
                        <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/70">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-amber-900">
                              Revision #{i + 1} ({rev.kind === 'weekShift' ? 'Week Shift' : 'Date Revised'})
                            </span>
                            <span className="text-[10px] text-amber-700 font-mono">
                              {formatCivilDate(rev.revisedAt)} {formatTime(rev.revisedAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mb-2">
                            <span>From: <strong>{formatCivilDate(rev.previousDate)}</strong></span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span>To: <strong className="text-amber-800">{formatCivilDate(rev.newDate)}</strong></span>
                          </div>

                          <div className="bg-white p-2.5 rounded-lg border border-amber-200/50">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                              Mandatory Reason:
                            </span>
                            <p className="text-slate-800 font-medium italic">
                              "{rev.reason}"
                            </p>
                          </div>

                          {rev.revisedByName && (
                            <p className="text-[10px] text-slate-500 mt-2">
                              Revised by: <strong className="text-slate-700">{rev.revisedByName}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Progress Remarks */}
            {activeTab === 'progress' && (
              <div>
                {!task.progressRemarks || task.progressRemarks.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <MessageSquare className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-medium text-slate-600">No progress remarks logged</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Use "Report delay" or "Progress" to log milestone updates.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {task.progressRemarks.map((pr, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span className="font-medium text-slate-700">{pr.authorName || 'Author'}</span>
                          <span>{formatCivilDate(pr.createdAt)}</span>
                        </div>
                        <p className="text-slate-800 font-medium">{pr.note}</p>
                        {pr.expectedDate && (
                          <div className="mt-2 text-[11px] text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block">
                            Expected: {formatCivilDate(pr.expectedDate)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Quick Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          {task.status === 'pending' ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onReviseDate(task)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Change Date
                </button>
                <button
                  type="button"
                  onClick={() => onReportDelay(task)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Report Delay
                </button>
              </div>
              <button
                type="button"
                onClick={() => onComplete(task)}
                className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Completed</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onReopen(task)}
              className="w-full px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Reopen Task to Pending
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
