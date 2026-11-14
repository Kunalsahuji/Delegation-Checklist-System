import React from 'react';
import {
  Check,
  RotateCcw,
  SkipForward,
  Clock,
  UserPlus,
  Paperclip,
  Calendar,
} from 'lucide-react';
import { Spinner } from '../../../components/Spinner';

export const ItemsToTickTable = ({
  items = [],
  loading = false,
  pagination,
  onPageChange,
  onOpenChecklist,
  onMarkDone,
  onSkip,
  onReportDelay,
  onReassign,
  onUndo,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-xs">
        <Spinner size="lg" className="text-brand-600 mx-auto" />
        <p className="text-xs text-slate-500 mt-3 font-medium">Loading checklist items...</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">No Checklist Items Found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No items match your active filters or scheduled dates. Adjust your filters or click "+ Add Checklist" above.
        </p>
      </div>
    );
  }

  const formatDue = (plannedAt) => {
    if (!plannedAt) return { dateStr: '—', timeStr: '' };
    const d = new Date(plannedAt);
    const dateStr = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return { dateStr, timeStr };
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
      <div className="overflow-x-auto min-h-[380px] w-full">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-2.5 px-2 w-10 text-center">S. No.</th>
              <th className="py-2.5 px-2.5 min-w-[130px] max-w-[160px]">Person</th>
              <th className="py-2.5 px-2.5 min-w-[190px]">Checklist</th>
              <th className="py-2.5 px-2 min-w-[95px] whitespace-nowrap">Due Date</th>
              <th className="py-2.5 px-2 min-w-[80px]">Frequency</th>
              <th className="py-2.5 px-2 min-w-[100px]">Department</th>
              <th className="py-2.5 px-2 min-w-[100px]">Project</th>
              <th className="py-2.5 px-2 text-center min-w-[85px]">Status</th>
              <th className="py-2.5 px-2 text-center min-w-[140px]">Actions</th>
              <th className="py-2.5 px-1.5 w-10 text-center">Files</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => {
              const { dateStr, timeStr } = formatDue(item.plannedAt);
              const isOverdue = item.isOverdue;
              const isDone = item.status === 'done';
              const isSkipped = item.status === 'skipped';
              const sNo = ((pagination?.page || 1) - 1) * (pagination?.limit || 20) + idx + 1;
              const taskId = item.task?._id || item.task;

              return (
                <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                  {/* S.No. */}
                  <td className="py-2.5 px-2 text-center text-slate-500 font-mono text-[11px]">
                    {sNo}
                  </td>

                  {/* Person (Plain text matching Tangdi Image 1 & 4) */}
                  <td className="py-2.5 px-2.5">
                    <span className="font-medium text-slate-800 text-xs truncate block" title={item.assignedToName}>
                      {item.assignedToName || 'Unassigned'}
                    </span>
                  </td>

                  {/* Checklist Title + Progress Note with hover underline effect */}
                  <td className="py-2.5 px-2.5">
                    <button
                      type="button"
                      onClick={() => onOpenChecklist?.(taskId)}
                      className="text-left font-medium text-slate-900 hover:text-blue-600 hover:underline transition-colors block text-xs cursor-pointer"
                      title={item.title}
                    >
                      {item.title}
                    </button>
                    {item.latestProgress?.note && (
                      <div className="mt-0.5 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 inline-block line-clamp-1">
                        Progress: {item.latestProgress.note}
                      </div>
                    )}
                    {item.remarks && isSkipped && (
                      <div className="mt-0.5 text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded inline-block line-clamp-1">
                        Skip: {item.remarks}
                      </div>
                    )}
                  </td>

                  {/* Due Date & Time */}
                  <td className="py-2.5 px-2 whitespace-nowrap text-xs">
                    <div className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                      {dateStr}
                    </div>
                    {timeStr && <div className="text-[10px] text-slate-400">by {timeStr}</div>}
                  </td>

                  {/* Frequency */}
                  <td className="py-2.5 px-2">
                    <span className="capitalize text-slate-700 text-xs">
                      {item.frequency || 'Daily'}
                    </span>
                  </td>

                  {/* Department */}
                  <td className="py-2.5 px-2 text-slate-600 text-xs truncate max-w-[120px]">
                    {item.departmentName || '—'}
                  </td>

                  {/* Project */}
                  <td className="py-2.5 px-2 text-slate-600 text-xs truncate max-w-[120px]">
                    {item.project?.name || 'Company-wide'}
                  </td>

                  {/* Status Badge */}
                  <td className="py-2.5 px-2 text-center whitespace-nowrap">
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Done
                      </span>
                    ) : isSkipped ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Skipped
                      </span>
                    ) : isOverdue ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Overdue
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Pending
                      </span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-2.5 px-2 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 justify-center">
                      {!isDone && !isSkipped ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onMarkDone(item._id)}
                            title="Mark as Done"
                            className="p-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onSkip(item)}
                            title="Skip Item"
                            className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <SkipForward className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onReportDelay(item)}
                            title="Report Delay / Progress"
                            className="p-1 rounded-md border border-slate-200 text-amber-600 hover:bg-amber-50 hover:border-amber-200 transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onReassign(item)}
                            title="Reassign Occurrence"
                            className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onUndo(item._id)}
                          title="Undo / Reopen"
                          className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors text-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Files Indicator */}
                  <td className="py-2.5 px-1.5 text-center text-slate-400">
                    <button
                      type="button"
                      onClick={() => onOpenChecklist?.(taskId)}
                      className="hover:text-blue-600 transition-colors p-1"
                      title="View attachments"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="py-2.5 px-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="text-center sm:text-left">
            Showing{' '}
            <span className="font-semibold text-slate-700">
              {Math.min(
                (pagination.page - 1) * pagination.limit + 1,
                pagination.total
              )}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-700">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-semibold text-slate-700">{pagination.total}</span> items
          </div>

          <div className="flex items-center justify-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs shadow-xs"
            >
              Previous
            </button>
            <span className="text-slate-600 font-medium px-2 whitespace-nowrap text-xs">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs shadow-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
