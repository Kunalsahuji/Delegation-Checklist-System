import { Search, RotateCcw } from 'lucide-react';

export const ChecklistFilters = ({
  filters,
  onChange,
  onReset,
  departments = [],
  users = [],
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-subtle flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
      {/* Search Input - Full width on mobile, flexible on tablet/desktop */}
      <div className="relative flex-1 min-w-[180px]">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={filters.q || ''}
          onChange={(e) => onChange('q', e.target.value)}
          placeholder="Search tasks or people..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
        />
      </div>

      {/* Filter Selects Grid on mobile, inline on desktop */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5">
        {/* Department Dropdown */}
        <select
          value={filters.department || ''}
          onChange={(e) => onChange('department', e.target.value)}
          className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All departments</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.name}
            </option>
          ))}
        </select>

        {/* Frequency Dropdown */}
        <select
          value={filters.frequency || ''}
          onChange={(e) => onChange('frequency', e.target.value)}
          className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">Any frequency</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="lastWeekdayOfMonth">Last Weekday</option>
        </select>

        {/* Status Dropdown */}
        <select
          value={filters.status || 'all'}
          onChange={(e) => onChange('status', e.target.value)}
          className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="all">Any status</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
          <option value="done">Done</option>
          <option value="skipped">Skipped</option>
        </select>

        {/* Assignee / Person Dropdown */}
        <select
          value={filters.assignee || ''}
          onChange={(e) => onChange('assignee', e.target.value)}
          className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">Any person</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name}
            </option>
          ))}
        </select>

        {/* Reset Button */}
        <button
          onClick={onReset}
          title="Reset filters"
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors justify-self-center sm:justify-self-auto"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
