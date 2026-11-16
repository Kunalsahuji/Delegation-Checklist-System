import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRightLeft,
  XCircle,
  FileText
} from 'lucide-react';
import { delegationApi } from '../api/delegationApi';
import { StatusBadge } from '../../../components/StatusBadge';
import { PriorityBadge } from '../../../components/PriorityBadge';
import { Spinner } from '../../../components/Spinner';

const formatCivilDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getUTCDate()).padStart(2, '0')}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
};

export default function DelegationRegisterReport({ departments = [], users = [], projects = [] }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [assignee, setAssignee] = useState('');
  const [project, setProject] = useState('');
  const [status, setStatus] = useState('');
  const [revisionFilter, setRevisionFilter] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  // Stats tally
  const [stats, setStats] = useState({
    totalWork: 0,
    completed: 0,
    pending: 0,
    weekShifted: 0,
    overdue: 0,
    cancelled: 0,
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const fetchFn = delegationApi.list || delegationApi.getTasks;
      const [res, statsRes] = await Promise.all([
        fetchFn({
          page,
          limit,
          q: search,
          department,
          assignee,
          project,
          status,
          sortBy,
        }),
        delegationApi.getStats({
          department,
          assignee,
          project,
        }),
      ]);

      const items = res?.items || res?.data?.items || [];
      const pagination = res?.pagination || res?.data?.pagination || {};
      setTasks(items);
      setTotal(pagination.total || items.length);

      const statsData = statsRes?.data || statsRes || {};
      setStats({
        totalWork: statsData.totalWork || 0,
        completed: statsData.completed || 0,
        pending: statsData.pending || 0,
        weekShifted: statsData.weekShifted || 0,
        overdue: statsData.overdue || 0,
        cancelled: statsData.cancelled || 0,
      });
    } catch (err) {
      console.error('Failed to load delegation register', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, department, assignee, project, status, sortBy]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Client-side revision filter if selected
  const filteredTasks = useMemo(() => {
    if (!revisionFilter) return tasks;
    return tasks.filter((t) => {
      const count = t.revisionCount || 0;
      if (revisionFilter === '0') return count === 0;
      if (revisionFilter === '1') return count === 1;
      if (revisionFilter === '2+') return count >= 2;
      return true;
    });
  }, [tasks, revisionFilter]);

  // CSV Export
  const handleExportCSV = () => {
    if (!filteredTasks.length) return;
    const headers = [
      'S.No',
      'Task ID',
      'Old Sheet ID',
      'Doer Name',
      'Task Title',
      'Project',
      'First Date',
      'Revision 1',
      'Revision 2',
      'Latest Due Date',
      'Total Revisions',
      'Status',
      'Priority',
      'Department',
      'Date History',
    ];

    const rows = filteredTasks.map((t, idx) => [
      idx + 1,
      `"${t.code || ''}"`,
      `"${t.legacyCode || ''}"`,
      `"${t.assignedTo?.name || ''}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${t.project?.name || 'Company-wide'}"`,
      formatCivilDate(t.originalDueDate),
      formatCivilDate(t.revisions?.[0]?.toDate),
      formatCivilDate(t.revisions?.[1]?.toDate),
      formatCivilDate(t.dueDate),
      t.revisionCount || 0,
      t.status || '',
      t.priority || 'medium',
      `"${t.department?.name || 'Company-wide'}"`,
      `"${(t.revisions || [])
        .map(
          (m) =>
            `${formatCivilDate(m.fromDate)} -> ${formatCivilDate(m.toDate)} (${m.reason || 'No reason'})`
        )
        .join('; ')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `delegations_register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSearch('');
    setDepartment('');
    setAssignee('');
    setProject('');
    setStatus('');
    setRevisionFilter('');
    setSortBy('latest');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Work
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
          <span className="text-[11px] font-semibold text-orange-500 uppercase tracking-wider block mb-1">
            Week Shifted
          </span>
          <span className="text-xl font-bold text-orange-600 tabular-nums">
            {stats.weekShifted.toLocaleString()}
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
            Cancelled
          </span>
          <span className="text-xl font-bold text-slate-700 tabular-nums">
            {stats.cancelled.toLocaleString()}
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
              placeholder="Search by task title, code, or doer..."
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

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="text-[11px] font-medium text-slate-500 block mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500 block mb-1">Doer / Assignee</label>
            <select
              value={assignee}
              onChange={(e) => {
                setAssignee(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">Any person</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500 block mb-1">Project</label>
            <select
              value={project}
              onChange={(e) => {
                setProject(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500 block mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">Any status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="weekShifted">Week Shifted</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500 block mb-1">Revisions</label>
            <select
              value={revisionFilter}
              onChange={(e) => setRevisionFilter(e.target.value)}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">All revision counts</option>
              <option value="0">0 revisions (Original date)</option>
              <option value="1">1 revision</option>
              <option value="2+">2+ revisions</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500 block mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="latest">Latest created first</option>
              <option value="dueDate_desc">Latest due date first</option>
              <option value="dueDate_asc">Oldest due date first</option>
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
            <p className="text-xs">Loading delegation register...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <FileText className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No delegation records found</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-3 px-3 w-12 text-center whitespace-nowrap">S.No</th>
                  <th className="py-3 px-3 whitespace-nowrap min-w-[120px]">Doer</th>
                  <th className="py-3 px-4 min-w-[220px] whitespace-nowrap">Task</th>
                  <th className="py-3 px-3 whitespace-nowrap min-w-[130px]">Project</th>
                  <th className="py-3 px-3 whitespace-nowrap min-w-[105px]">First Date</th>
                  <th className="py-3 px-3 whitespace-nowrap min-w-[105px]">Revision 1</th>
                  <th className="py-3 px-3 whitespace-nowrap min-w-[105px]">Revision 2</th>
                  <th className="py-3 px-3 whitespace-nowrap min-w-[105px]">Latest Due</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Revisions</th>
                  <th className="py-3 px-3 whitespace-nowrap">Priority</th>
                  <th className="py-3 px-3 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 min-w-[240px] whitespace-nowrap">Date History & Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((t, idx) => {
                  const revCount = t.revisionCount || 0;
                  const revColor =
                    revCount === 0
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : revCount === 1
                      ? 'text-amber-700 bg-amber-50 border-amber-200'
                      : 'text-rose-700 bg-rose-50 border-rose-200';

                  return (
                    <tr key={t._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className="font-semibold text-slate-800 text-xs block whitespace-nowrap"
                          title={t.assignedTo?.name || 'Unassigned'}
                        >
                          {t.assignedTo?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 min-w-[200px]">
                        <p
                          className="font-medium text-slate-900 line-clamp-1 hover:text-blue-600 cursor-default transition-colors"
                          title={t.title}
                        >
                          {t.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="font-mono text-slate-500">{t.code}</span>
                          {t.legacyCode && <span>Old: {t.legacyCode}</span>}
                          {t.department?.name && <span title={t.department.name}>• {t.department.name}</span>}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 min-w-[130px]">
                        <span
                          className="inline-block max-w-[170px] truncate text-slate-700 bg-slate-100/80 hover:bg-blue-50 hover:text-blue-700 hover:ring-1 hover:ring-blue-300 px-2 py-0.5 rounded text-[11px] font-medium cursor-default transition-all duration-150"
                          title={t.project?.name || 'Company-wide'}
                        >
                          {t.project?.name || 'Company-wide'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {formatCivilDate(t.originalDueDate)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {t.revisions?.[0]?.toDate ? (
                          formatCivilDate(t.revisions[0].toDate)
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {t.revisions?.[1]?.toDate ? (
                          formatCivilDate(t.revisions[1].toDate)
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                        <span className={t.isOverdue ? 'text-rose-600 font-bold' : 'font-medium text-slate-900'}>
                          {formatCivilDate(t.dueDate)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${revColor}`}>
                          {revCount}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <PriorityBadge priority={t.priority || 'medium'} />
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={t.isOverdue ? 'overdue' : t.status} />
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                        {t.revisions && t.revisions.length > 0 ? (
                          <div className="space-y-0.5">
                            {t.revisions.slice(-2).map((rev, rIdx) => (
                              <p key={rIdx} className="truncate max-w-[240px]" title={`${formatCivilDate(rev.toDate)}: ${rev.reason || 'Reason not stated'}`}>
                                <span className="font-medium text-slate-700">{formatCivilDate(rev.toDate)}:</span>{' '}
                                <span className="text-slate-500 italic">{rev.reason || 'Reason not stated'}</span>
                              </p>
                            ))}
                            {t.revisions.length > 2 && (
                              <span className="text-[10px] text-blue-600 font-medium">
                                +{t.revisions.length - 2} earlier moves
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No revisions (on time)</span>
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
            Showing <span className="font-semibold text-slate-800">{filteredTasks.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{total}</span> total delegations
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
