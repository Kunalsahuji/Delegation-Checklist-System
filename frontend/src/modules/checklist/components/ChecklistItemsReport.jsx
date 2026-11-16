import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle,
  FileCheck
} from 'lucide-react';
import { checklistApi } from '../api/checklistApi';
import { Spinner } from '../../../components/Spinner';

const formatCivilDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getUTCDate()).padStart(2, '0')}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
};

export default function ChecklistItemsReport({ departments = [], users = [] }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [assignee, setAssignee] = useState('');
  const [frequency, setFrequency] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  // Stats
  const [stats, setStats] = useState({
    totalWork: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    skipped: 0,
  });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        checklistApi.listOccurrences({
          page,
          limit,
          q: search,
          department,
          assignee,
          frequency,
          status,
          sortBy,
        }),
        checklistApi.getStats({
          department,
          assignee,
        }),
      ]);

      const occList = res?.items || res?.data?.items || [];
      const pagination = res?.pagination || res?.data?.pagination || {};
      setItems(occList);
      setTotal(pagination.total || occList.length);

      const statsData = statsRes?.data || statsRes || {};
      setStats({
        totalWork: statsData.totalWork || statsData.total || 0,
        completed: statsData.completed || 0,
        pending: statsData.activePending || statsData.pending || 0,
        overdue: statsData.overdue || 0,
        skipped: statsData.skipped || 0,
      });
    } catch (err) {
      console.error('Failed to load checklist items register', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, department, assignee, frequency, status, sortBy]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // CSV Export
  const handleExportCSV = () => {
    if (!items.length) return;
    const headers = [
      'S.No',
      'Task Title',
      'Person Name',
      'Department',
      'Frequency',
      'Due Date',
      'Due Time',
      'Status',
      'Completed At',
      'Progress Remarks / Reasons',
    ];

    const rows = items.map((it, idx) => [
      idx + 1,
      `"${(it.title || '').replace(/"/g, '""')}"`,
      `"${it.assignedToName || it.assignedTo?.name || ''}"`,
      `"${it.departmentName || it.department?.name || 'Company-wide'}"`,
      it.frequency || 'daily',
      formatCivilDate(it.plannedOn),
      it.plannedAt ? new Date(it.plannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
      it.derivedStatus || it.status,
      it.completedAt ? new Date(it.completedAt).toLocaleString() : '',
      `"${(it.remarks || []).map((r) => r.remark || r.reason).filter(Boolean).join('; ')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `checklist_items_register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSearch('');
    setDepartment('');
    setAssignee('');
    setFrequency('');
    setStatus('');
    setSortBy('latest');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Checklist Items
          </span>
          <span className="text-xl font-bold text-slate-800 tabular-nums">
            {stats.totalWork.toLocaleString()}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block mb-1">
            Completed
          </span>
          <span className="text-xl font-bold text-emerald-700 tabular-nums">
            {stats.completed.toLocaleString()}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider block mb-1">
            Pending
          </span>
          <span className="text-xl font-bold text-amber-600 tabular-nums">
            {stats.pending.toLocaleString()}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider block mb-1">
            Overdue
          </span>
          <span className="text-xl font-bold text-rose-600 tabular-nums">
            {stats.overdue.toLocaleString()}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Skipped
          </span>
          <span className="text-xl font-bold text-slate-700 tabular-nums">
            {stats.skipped.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search checklist title, person, or department..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="text-[11px] font-medium text-slate-500 block mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500 block mb-1">Person</label>
            <select
              value={assignee}
              onChange={(e) => { setAssignee(e.target.value); setPage(1); }}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">Any person</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500 block mb-1">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => { setFrequency(e.target.value); setPage(1); }}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">All frequencies</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500 block mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">Any status</option>
              <option value="done">Completed</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500 block mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="latest">Latest created first</option>
              <option value="planned_desc">Furthest date first</option>
              <option value="planned_asc">Earliest date first</option>
              <option value="oldest">Oldest created first</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Spinner size="lg" className="text-blue-600" />
            <p className="text-xs">Loading checklist occurrences...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <FileCheck className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No checklist items found</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 w-12 text-center">S.No</th>
                  <th className="py-3 px-3">Person</th>
                  <th className="py-3 px-4 min-w-[200px]">Checklist Task</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3">Frequency</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 min-w-[180px]">Remarks / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => {
                  const state = it.derivedStatus || it.status;
                  const stateBadge = {
                    done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    pending: 'bg-amber-50 text-amber-700 border-amber-200',
                    overdue: 'bg-rose-50 text-rose-700 border-rose-200',
                    skipped: 'bg-slate-100 text-slate-700 border-slate-200',
                  }[state] || 'bg-slate-50 text-slate-600 border-slate-200';

                  return (
                    <tr key={it._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className="font-semibold text-slate-800 text-xs block whitespace-nowrap"
                          title={it.assignedToName || it.assignedTo?.name || 'Unassigned'}
                        >
                          {it.assignedToName || it.assignedTo?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3 px-4 min-w-[200px]">
                        <p
                          className="font-medium text-slate-900 line-clamp-1 hover:text-blue-600 cursor-default transition-colors"
                          title={it.title}
                        >
                          {it.title}
                        </p>
                        {it.task?.code && (
                          <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                            {it.task.code}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        <div>{formatCivilDate(it.plannedOn)}</div>
                        <span className="text-[10px] text-slate-400">
                          {it.plannedAt ? new Date(it.plannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '18:00'}
                        </span>
                      </td>
                      <td className="py-3 px-3 capitalize text-slate-600 font-medium">
                        {it.frequency || 'daily'}
                      </td>
                      <td className="py-3 px-3 min-w-[130px]">
                        <span
                          className="inline-block max-w-[170px] truncate text-slate-700 bg-slate-100/80 hover:bg-blue-50 hover:text-blue-700 hover:ring-1 hover:ring-blue-300 px-2 py-0.5 rounded text-[11px] font-medium cursor-default transition-all duration-150"
                          title={it.departmentName || it.department?.name || 'Company-wide'}
                        >
                          {it.departmentName || it.department?.name || 'Company-wide'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${stateBadge}`}>
                          {state}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {it.remarks && it.remarks.length > 0 ? (
                          <p className="italic truncate max-w-[220px]">
                            "{it.remarks[it.remarks.length - 1]?.remark || it.remarks[it.remarks.length - 1]?.reason || '-'}"
                          </p>
                        ) : state === 'done' && it.completedAt ? (
                          <span className="text-emerald-600">
                            Completed {new Date(it.completedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="py-3 px-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{items.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{total}</span> total checklist items
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="px-2 font-medium">Page {page} of {Math.ceil(total / limit) || 1}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * limit >= total || loading}
              className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
