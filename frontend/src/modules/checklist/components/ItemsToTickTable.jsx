import {
  Check,
  RotateCcw,
  SkipForward,
  Clock,
  UserPlus,
  Paperclip,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { Spinner } from '../../../components/Spinner';

export const ItemsToTickTable = ({
  items = [],
  loading = false,
  pagination,
  onPageChange,
  onMarkDone,
  onSkip,
  onReportDelay,
  onReassign,
  onUndo,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-subtle">
        <Spinner size="lg" className="text-brand-600" />
        <p className="text-xs text-slate-500 mt-3 font-medium">Loading checklist items...</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-subtle">
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
    if (!plannedAt) return '—';
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 w-12 text-center">S. No.</th>
              <th className="py-3 px-4 min-w-[160px]">Person</th>
              <th className="py-3 px-4 min-w-[220px]">Checklist</th>
              <th className="py-3 px-4 min-w-[130px]">Due Date</th>
              <th className="py-3 px-4">Frequency</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Project</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center min-w-[140px]">Actions</th>
              <th className="py-3 px-4 text-center w-12">Files</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => {
              const { dateStr, timeStr } = formatDue(item.plannedAt);
              const isOverdue = item.isOverdue;
              const isDone = item.status === 'done';
              const isSkipped = item.status === 'skipped';
              const sNo = ((pagination?.page || 1) - 1) * (pagination?.limit || 20) + idx + 1;

              return (
                <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                  {/* S.No. */}
                  <td className="py-3.5 px-4 text-center text-slate-500 font-medium">
                    {sNo}
                  </td>

                  {/* Person */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {item.assignedToName ? item.assignedToName.slice(0, 2).toUpperCase() : 'DS'}
                      </div>
                      <span className="font-semibold text-slate-900 truncate">
                        {item.assignedToName || 'Unassigned'}
                      </span>
                    </div>
                  </td>

                  {/* Checklist Title + Progress Note */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-900">{item.title}</div>
                    {item.latestProgress?.note && (
                      <div className="mt-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block line-clamp-1">
                        Progress: {item.latestProgress.note}
                      </div>
                    )}
                    {item.remarks && isSkipped && (
                      <div className="mt-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded inline-block line-clamp-1">
                        Skip reason: {item.remarks}
                      </div>
                    )}
                  </td>

                  {/* Due Date & Time */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                      {dateStr}
                    </div>
                    <div className="text-[11px] text-slate-400">by {timeStr}</div>
                  </td>

                  {/* Frequency */}
                  <td className="py-3.5 px-4">
                    <span className="capitalize text-slate-700 font-medium">
                      {item.frequency || 'Daily'}
                    </span>
                  </td>

                  {/* Department */}
                  <td className="py-3.5 px-4 text-slate-600">
                    {item.departmentName || '—'}
                  </td>

                  {/* Project */}
                  <td className="py-3.5 px-4 text-slate-600">
                    {item.project?.name || 'Company-wide'}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {isDone ? (
                      <span className="badge badge-success font-semibold">Done</span>
                    ) : isSkipped ? (
                      <span className="badge badge-muted font-semibold">Skipped</span>
                    ) : isOverdue ? (
                      <span className="badge badge-danger font-semibold">Overdue</span>
                    ) : (
                      <span className="badge badge-warning font-semibold">Pending</span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 justify-center">
                      {!isDone && !isSkipped ? (
                        <>
                          {/* Done Button */}
                          <button
                            onClick={() => onMarkDone(item._id)}
                            title="Mark as Done"
                            className="p-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

                          {/* Skip Button */}
                          <button
                            onClick={() => onSkip(item)}
                            title="Skip Item"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <SkipForward className="w-3.5 h-3.5" />
                          </button>

                          {/* Report Delay Button */}
                          <button
                            onClick={() => onReportDelay(item)}
                            title="Report Delay / Progress"
                            className="p-1.5 rounded-lg border border-slate-200 text-amber-600 hover:bg-amber-50 hover:border-amber-200 transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>

                          {/* Reassign Button */}
                          <button
                            onClick={() => onReassign(item)}
                            title="Reassign Occurrence"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        /* Undo Button */
                        <button
                          onClick={() => onUndo(item._id)}
                          title="Undo / Reopen"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Files Indicator */}
                  <td className="py-3.5 px-4 text-center text-slate-400">
                    <button className="hover:text-slate-600 transition-colors p-1" title="View attachments">
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
        <div className="py-3 px-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
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

          <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium shadow-xs text-center"
            >
              Previous
            </button>
            <span className="text-slate-600 font-medium px-2 whitespace-nowrap">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium shadow-xs text-center"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
