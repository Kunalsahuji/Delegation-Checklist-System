import { Edit2, Trash2, Power, Calendar } from 'lucide-react';
import { Spinner } from '../../../components/Spinner';

export const ChecklistSetupTable = ({
  tasks = [],
  loading = false,
  onEdit,
  onToggleActive,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-subtle">
        <Spinner size="lg" className="text-brand-600" />
        <p className="text-xs text-slate-500 mt-3 font-medium">Loading recurring checklist rules...</p>
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-subtle">
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 w-28">Code</th>
              <th className="py-3 px-4 min-w-[220px]">Checklist Task</th>
              <th className="py-3 px-4">Assignee</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Frequency</th>
              <th className="py-3 px-4">Due Time</th>
              <th className="py-3 px-4 text-center">Active</th>
              <th className="py-3 px-4 text-center min-w-[120px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <tr key={task._id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-4 font-mono font-semibold text-brand-700">
                  {task.code || '—'}
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900">{task.title}</div>
                  <div className="text-[11px] text-slate-400">
                    Anchor: {new Date(task.anchorDate).toLocaleDateString('en-GB')}
                    {task.skipSundays && ' · Skip Sundays'}
                    {task.skipHolidays && ' · Skip Holidays'}
                  </div>
                </td>
                <td className="py-3.5 px-4 font-medium text-slate-800">
                  {task.assignedToName || 'Unassigned'}
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  {task.departmentName || 'Company-wide'}
                </td>
                <td className="py-3.5 px-4 capitalize font-medium text-slate-700">
                  {task.frequency}
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-700">
                  {task.dueTime || '18:00'}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`badge ${
                      task.active ? 'badge-success' : 'badge-muted'
                    } font-semibold`}
                  >
                    {task.active ? 'Active' : 'Paused'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="inline-flex items-center gap-1.5 justify-center">
                    <button
                      onClick={() => onEdit(task)}
                      title="Edit Rule"
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onToggleActive(task._id)}
                      title={task.active ? 'Pause Rule' : 'Resume Rule'}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        task.active
                          ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(task._id)}
                      title="Delete Rule"
                      className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
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
