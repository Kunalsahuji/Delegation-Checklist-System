import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

export default function DelegationFilters({
  filters,
  onChange,
  onReset,
  users = [],
  departments = [],
  projects = [],
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 shadow-sm">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.q || ''}
            onChange={(e) => onChange('q', e.target.value)}
            placeholder="Search tasks, people or codes..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Filters Group */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {/* Department */}
          <select
            value={filters.department || ''}
            onChange={(e) => onChange('department', e.target.value)}
            className="text-xs sm:text-sm px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={filters.status || 'all'}
            onChange={(e) => onChange('status', e.target.value)}
            className="text-xs sm:text-sm px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
          >
            <option value="all">Any status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
            <option value="weekShifted">Week shifted</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Assignee */}
          <select
            value={filters.assignee || ''}
            onChange={(e) => onChange('assignee', e.target.value)}
            className="text-xs sm:text-sm px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
          >
            <option value="">Any person</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Project */}
          <select
            value={filters.project || ''}
            onChange={(e) => onChange('project', e.target.value)}
            className="text-xs sm:text-sm px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={filters.priority || ''}
            onChange={(e) => onChange('priority', e.target.value)}
            className="text-xs sm:text-sm px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
          >
            <option value="">Any priority</option>
            <option value="high">High priority</option>
            <option value="medium">Medium priority</option>
            <option value="low">Low priority</option>
          </select>
        </div>

        {/* Reset */}
        <button
          type="button"
          onClick={onReset}
          title="Reset all filters"
          className="self-center md:self-auto p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
