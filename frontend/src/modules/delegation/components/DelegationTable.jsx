import React from 'react';
import { 
  Paperclip, 
  Calendar, 
  AlertCircle, 
  Check, 
  RotateCcw, 
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatCivilDate } from '../../../utils/civilDate';

export default function DelegationTable({
  tasks = [],
  pagination = {},
  loading = false,
  onPageChange,
  onOpenTask,
  onComplete,
  onReopen,
  onReviseDate,
  onReportDelay,
}) {
  const { page = 1, limit = 20, total = 0, totalPages = 1 } = pagination;
  const startIndex = (page - 1) * limit;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col w-full">
      {/* Scrollable table container */}
      <div className="overflow-x-auto min-h-[380px] w-full">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-2.5 px-2 w-10 text-center">S. No.</th>
              <th className="py-2.5 px-2.5 min-w-[130px] max-w-[160px]">Doer Name</th>
              <th className="py-2.5 px-2.5 min-w-[200px]">Task</th>
              <th className="py-2.5 px-2 min-w-[90px] whitespace-nowrap">Planned Date</th>
              <th className="py-2.5 px-2 min-w-[90px] whitespace-nowrap">Current Due</th>
              <th className="py-2.5 px-2 min-w-[80px] whitespace-nowrap">Revision</th>
              <th className="py-2.5 px-2 min-w-[110px]">Project</th>
              <th className="py-2.5 px-2 min-w-[75px]">Priority</th>
              <th className="py-2.5 px-2 min-w-[100px]">Status</th>
              <th className="py-2.5 px-2 min-w-[150px] text-right">Action</th>
              <th className="py-2.5 px-1.5 w-10 text-center">Files</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && tasks.length === 0 ? (
              <tr>
                <td colSpan="11" className="py-12 text-center text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading delegation tasks...</span>
                  </div>
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan="11" className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Clock className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                    <p className="text-sm font-medium text-slate-600">No delegation tasks found</p>
                    <p className="text-xs text-slate-400">Try changing your filters or add a new delegation task.</p>
                  </div>
                </td>
              </tr>
            ) : (
              tasks.map((task, idx) => {
                const sNo = startIndex + idx + 1;
                const dueDateObj = new Date(task.dueDate);
                const isOverdue = task.status === 'pending' && dueDateObj < today;
                const isWeekShifted = task.revisions?.some((r) => r.kind === 'weekShift');

                return (
                  <tr
                    key={task._id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    {/* S. No */}
                    <td className="py-2.5 px-2 text-center text-slate-500 font-mono text-[11px]">
                      {sNo}
                    </td>

                    {/* Doer Name (clean text, no initials badge - matching Tangdi Image 1) */}
                    <td className="py-2.5 px-2.5">
                      <span className="font-medium text-slate-800 text-xs truncate block" title={task.assignedToName}>
                        {task.assignedToName || 'Unassigned'}
                      </span>
                    </td>

                    {/* Task Title + Code with hover underline effect */}
                    <td className="py-2.5 px-2.5">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => onOpenTask(task)}
                          className="text-left font-medium text-slate-900 hover:text-blue-600 hover:underline transition-colors line-clamp-1 cursor-pointer block text-xs"
                          title={task.title}
                        >
                          {task.title}
                          <span className="ml-1.5 font-mono text-[10px] text-slate-400 font-normal">
                            {task.code}
                          </span>
                        </button>
                      </div>
                    </td>

                    {/* Planned Date */}
                    <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap text-xs">
                      {formatCivilDate(task.originalDueDate)}
                    </td>

                    {/* Current Due */}
                    <td className="py-2.5 px-2 whitespace-nowrap text-xs">
                      <span className={`font-medium ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-700'}`}>
                        {formatCivilDate(task.dueDate)}
                      </span>
                    </td>

                    {/* Revision */}
                    <td className="py-2.5 px-2 whitespace-nowrap text-xs">
                      {task.revisionCount > 0 ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Revised {task.revisionCount}x
                          </span>
                          {task.revisions?.[task.revisions.length - 1]?.diffDays && (
                            <span className="text-[9px] text-amber-600 mt-0.5">
                              +{task.revisions[task.revisions.length - 1].diffDays} days
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Project */}
                    <td className="py-2.5 px-2">
                      <span className="inline-block max-w-[120px] truncate text-slate-600 bg-slate-100/70 px-1.5 py-0.5 rounded text-[11px]">
                        {task.project?.name || 'Company-wide'}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-2.5 px-2">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${
                        task.priority === 'high'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : task.priority === 'low'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {task.priority || 'medium'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-2">
                      <div className="flex flex-col gap-0.5 items-start">
                        {task.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Completed
                          </span>
                        )}
                        {task.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Pending
                          </span>
                        )}
                        {task.status === 'cancelled' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Cancelled
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Overdue
                          </span>
                        )}
                        {isWeekShifted && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-200">
                            Week shifted
                          </span>
                        )}
                        {task.followUp?.isDue && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            Follow-up due
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-2 text-right">
                      <div className="inline-flex items-center justify-end gap-1 flex-wrap">
                        {task.status === 'pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onComplete(task)}
                              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-[11px] transition-colors shadow-xs"
                            >
                              Complete
                            </button>
                            <button
                              type="button"
                              onClick={() => onReportDelay(task)}
                              className="px-1.5 py-0.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-[11px] transition-colors"
                            >
                              Report delay
                            </button>
                            <button
                              type="button"
                              onClick={() => onReviseDate(task)}
                              className="px-1.5 py-0.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-[11px] transition-colors"
                            >
                              Change date
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onReopen(task)}
                            className="px-2 py-0.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium transition-colors"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Files / Attachments */}
                    <td className="py-2.5 px-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => onOpenTask(task)}
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors inline-flex items-center justify-center rounded hover:bg-slate-100"
                        title="View attachments"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Responsive Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-slate-200 bg-white text-xs text-slate-500">
        <div className="text-center sm:text-left">
          Showing <span className="font-semibold text-slate-700">{total === 0 ? 0 : startIndex + 1}</span> to{' '}
          <span className="font-semibold text-slate-700">{Math.min(startIndex + limit, total)}</span> of{' '}
          <span className="font-semibold text-slate-700">{total}</span> items
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors text-slate-700 text-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <span className="px-2 font-medium text-slate-600 text-xs">
            Page {page} of {totalPages || 1}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors text-slate-700 text-xs"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
