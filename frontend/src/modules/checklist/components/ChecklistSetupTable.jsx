import React from 'react';
import { Edit2, Trash2, Power, Calendar } from 'lucide-react';
import { Spinner } from '../../../components/Spinner';

export const ChecklistSetupTable = ({
  tasks = [],
  loading = false,
  onOpenChecklist,
  onEdit,
  onToggleActive,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-xs">
        <Spinner size="lg" className="text-brand-600 mx-auto" />
        <p className="text-xs text-slate-500 mt-3 font-medium">Loading recurring checklist rules...</p>
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">No Checklist Definitions Configured</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Create your first recurring operational checklist rule using the "+ Add Checklist" button.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
      <div className="overflow-x-auto min-h-[380px] w-full">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-2.5 px-2.5 w-24">Code</th>
              <th className="py-2.5 px-2.5 min-w-[200px]">Checklist Task</th>
              <th className="py-2.5 px-2.5 min-w-[130px]">Assignee</th>
              <th className="py-2.5 px-2.5 min-w-[110px]">Department</th>
              <th className="py-2.5 px-2 w-24">Frequency</th>
              <th className="py-2.5 px-2 w-20">Due Time</th>
              <th className="py-2.5 px-2 text-center w-20">Active</th>
              <th className="py-2.5 px-2 text-center min-w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <tr key={task._id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-2.5 font-mono font-semibold text-brand-700 text-xs">
                  {task.code || '—'}
                </td>
                <td className="py-2.5 px-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenChecklist?.(task._id)}
                    className="text-left font-semibold text-slate-900 hover:text-blue-600 hover:underline transition-colors block text-xs cursor-pointer"
                    title={task.title}
                  >
                    {task.title}
                  </button>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Anchor: {new Date(task.anchorDate).toLocaleDateString('en-GB')}
                    {task.skipSundays && ' · Skip Sundays'}
                    {task.skipHolidays && ' · Skip Holidays'}
                  </div>
                </td>
                <td className="py-2.5 px-2.5 font-medium text-slate-800 text-xs">
                  {task.assignedToName || 'Unassigned'}
                </td>
                <td className="py-2.5 px-2.5 text-slate-600 text-xs">
                  {task.departmentName || 'Company-wide'}
                </td>
                <td className="py-2.5 px-2 capitalize font-medium text-slate-700 text-xs">
                  {task.frequency}
                </td>
                <td className="py-2.5 px-2 font-mono text-slate-700 text-xs">
                  {task.dueTime || '18:00'}
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                      task.active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${task.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {task.active ? 'Active' : 'Paused'}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <div className="inline-flex items-center gap-1 justify-center">
                    <button
                      type="button"
                      onClick={() => onEdit(task)}
                      title="Edit Rule"
                      className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleActive(task._id)}
                      title={task.active ? 'Pause Rule' : 'Resume Rule'}
                      className={`p-1 rounded-md border transition-colors ${
                        task.active
                          ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(task._id)}
                      title="Delete Rule"
                      className="p-1 rounded-md border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
