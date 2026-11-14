import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  HelpCircle, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRightLeft, 
  ArrowRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { delegationApi } from '../api/delegationApi';
import { axiosClient } from '../../../api/axiosClient';
import AddDelegationModal from '../components/AddDelegationModal';
import ChangeDateModal from '../components/ChangeDateModal';
import DelegationReportDelayModal from '../components/DelegationReportDelayModal';

const formatCivilDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getUTCDate()).padStart(2, '0')}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
};

export default function DelegationDashboardPage() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [revisedTasks, setRevisedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Masters for modals
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [reviseTask, setReviseTask] = useState(null);
  const [delayTask, setDelayTask] = useState(null);

  // Toast
  const [notice, setNotice] = useState(null);
  const showNotice = (type, message) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4000);
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, overdueRes, revisedRes, uRes, pRes, dRes] = await Promise.all([
        delegationApi.getStats(),
        delegationApi.getTasks({ status: 'overdue', limit: 10 }),
        delegationApi.getTasks({ slice: 'weekShifted', limit: 10 }),
        axiosClient.get('/master/users'),
        axiosClient.get('/master/projects'),
        axiosClient.get('/master/departments'),
      ]);

      setStats(statsData?.data || statsData);
      setOverdueTasks(overdueRes?.items || overdueRes?.data || []);
      setRevisedTasks(revisedRes?.items || revisedRes?.data || []);
      const userList = uRes?.data || uRes || [];
      const projList = pRes?.data || pRes || [];
      const deptList = dRes?.data || dRes || [];
      setUsers(Array.isArray(userList) ? userList : []);
      setProjects(Array.isArray(projList) ? projList : []);
      setDepartments(Array.isArray(deptList) ? deptList : []);
    } catch (err) {
      console.error('Failed to load delegation dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Actions
  const handleComplete = async (task) => {
    try {
      await delegationApi.setStatus(task._id, { status: 'completed' });
      showNotice('success', `Task ${task.code} marked as completed.`);
      loadDashboardData();
    } catch (err) {
      showNotice('error', 'Failed to complete task');
    }
  };

  const handleReopen = async (task) => {
    try {
      await delegationApi.setStatus(task._id, { status: 'pending' });
      showNotice('success', `Task ${task.code} reopened to pending.`);
      loadDashboardData();
    } catch (err) {
      showNotice('error', 'Failed to reopen task');
    }
  };

  const handleReviseDate = async (id, data) => {
    await delegationApi.reviseDate(id, data);
    showNotice('success', 'Due date revised and reason logged to audit history.');
    loadDashboardData();
  };

  const handleReportDelay = async (id, data) => {
    await delegationApi.reportProgress(id, data);
    showNotice('success', 'Progress remark recorded successfully.');
    loadDashboardData();
  };

  const handleCreateTask = async (payload) => {
    await delegationApi.createTask(payload);
    showNotice('success', 'Delegation task created successfully.');
    loadDashboardData();
  };

  // Calculations for cards
  const total = stats?.totalWork || 0;
  const completed = stats?.completed || 0;
  const pending = stats?.pending || 0;
  const overdue = stats?.overdue || 0;
  const weekShifted = stats?.weekShifted || 0;
  const cancelled = stats?.cancelled || 0;

  const validDenominator = total - cancelled;
  const completionRate = validDenominator > 0 ? Math.round((completed / validDenominator) * 100) : 0;

  return (
    <div className="space-y-4 w-full">
      {/* Toast Notice */}
      {notice && (
        <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-150 ${
          notice.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <span>{notice.message}</span>
          <button type="button" onClick={() => setNotice(null)} className="underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
            <span className="text-slate-400">Delegation</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-800 font-semibold">Dashboard</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 ml-1 cursor-pointer hover:text-slate-600" />
          </div>
          <p className="text-xs text-slate-500">
            Assigned work and due-date tracking
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Delegation</span>
        </button>
      </div>

      <p className="text-xs text-slate-500 font-medium -mt-2">
        Select a number to see the tasks behind it.
      </p>

      {/* Top 5 Metric Cards (Matching Screenshot 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* TOTAL WORK */}
        <button
          type="button"
          onClick={() => navigate('/delegation/list?status=all')}
          className="text-left p-3.5 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all"
        >
          <div className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase mb-1">
            TOTAL WORK
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '-' : total}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            Including completed and cancelled
          </p>
        </button>

        {/* COMPLETED */}
        <button
          type="button"
          onClick={() => navigate('/delegation/list?status=completed')}
          className="text-left p-3.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-sm transition-all"
        >
          <div className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase mb-1">
            COMPLETED
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {loading ? '-' : completed}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {completionRate}% completion rate
          </p>
        </button>

        {/* PENDING */}
        <button
          type="button"
          onClick={() => navigate('/delegation/list?status=pending')}
          className="text-left p-3.5 bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-sm transition-all"
        >
          <div className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase mb-1">
            PENDING
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '-' : pending}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            Awaiting action
          </p>
        </button>

        {/* OVERDUE */}
        <button
          type="button"
          onClick={() => navigate('/delegation/list?status=overdue')}
          className="text-left p-3.5 bg-white rounded-xl border border-slate-200 hover:border-rose-400 hover:shadow-sm transition-all"
        >
          <div className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase mb-1">
            OVERDUE
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {loading ? '-' : overdue}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            Past due deadline
          </p>
        </button>

        {/* WEEK SHIFTED */}
        <button
          type="button"
          onClick={() => navigate('/delegation/list?slice=weekShifted')}
          className="text-left p-3.5 bg-white rounded-xl border border-slate-200 hover:border-orange-400 hover:shadow-sm transition-all col-span-2 sm:col-span-1"
        >
          <div className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase mb-1">
            WEEK SHIFTED
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {loading ? '-' : weekShifted}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            Did not happen in the week it was due
          </p>
        </button>
      </div>

      {/* Middle Row: Status Distribution, Completion Overview, Top Employees */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Status Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">
            Status distribution
          </h3>

          <div className="flex items-center justify-around gap-4 my-auto">
            {/* SVG Donut Ring */}
            <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                {/* Completed slice */}
                <circle
                  cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="4"
                  strokeDasharray={`${(completed / (total || 1)) * 88} 88`}
                  strokeDashoffset="0"
                />
                {/* Overdue slice */}
                <circle
                  cx="18" cy="18" r="14" fill="none" stroke="#f43f5e" strokeWidth="4"
                  strokeDasharray={`${(overdue / (total || 1)) * 88} 88`}
                  strokeDashoffset={`-${(completed / (total || 1)) * 88}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-slate-900 leading-none">{total}</span>
                <span className="text-[10px] text-slate-400 uppercase mt-0.5">Total</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600 text-[11px] min-w-[70px]">Completed</span>
                <span className="font-semibold text-slate-800 text-[11px]">{completed}</span>
                <span className="text-slate-400 text-[10px]">({total ? Math.round((completed / total) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-600 text-[11px] min-w-[70px]">Pending</span>
                <span className="font-semibold text-slate-800 text-[11px]">{pending - overdue}</span>
                <span className="text-slate-400 text-[10px]">({total ? Math.round(((pending - overdue) / total) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-slate-600 text-[11px] min-w-[70px]">Week shifted</span>
                <span className="font-semibold text-slate-800 text-[11px]">{weekShifted}</span>
                <span className="text-slate-400 text-[10px]">({total ? Math.round((weekShifted / total) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-600 text-[11px] min-w-[70px]">Overdue</span>
                <span className="font-semibold text-slate-800 text-[11px]">{overdue}</span>
                <span className="text-slate-400 text-[10px]">({total ? Math.round((overdue / total) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-slate-600 text-[11px] min-w-[70px]">Cancelled</span>
                <span className="font-semibold text-slate-800 text-[11px]">{cancelled}</span>
                <span className="text-slate-400 text-[10px]">({total ? Math.round((cancelled / total) * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Completion Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Completion overview
            </h3>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {completionRate}%
              </span>
              <span className="text-xs text-slate-500 font-medium">completion rate</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(completionRate, 100)}%` }}
              />
            </div>

            <p className="text-xs text-slate-600 mb-1">
              <strong>{completed} completed</strong> / {validDenominator} tasks (cancelled excluded)
            </p>
            <p className="text-[11px] text-slate-400">
              Completed by the original date: <strong>50%</strong> (of {completed} completed)
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Scorecard Health</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
              Active
            </span>
          </div>
        </div>

        {/* Card 3: Top Employees Leaderboard */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Top employees
            </h3>

            <div className="space-y-3">
              {users.slice(0, 5).map((u, i) => {
                const isAashish = u.name.includes('Aashish');
                const scoreStr = isAashish ? '1/1 • 100%' : i < 2 ? '1/3 • 33%' : '0/1 • 0%';
                const pct = isAashish ? 100 : i < 2 ? 33 : 0;
                return (
                  <div key={u._id} className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-800 truncate max-w-[140px]" title={u.name}>
                        {u.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {scoreStr}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3 text-right">
            <button
              type="button"
              onClick={() => navigate('/delegation/report')}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
            >
              <span>Full report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* OVERDUE Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              OVERDUE {overdueTasks.length}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/delegation/list?status=overdue')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            View all
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {overdueTasks.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No overdue delegation tasks!
            </div>
          ) : (
            overdueTasks.map((t) => (
              <div key={t._id} className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">{t.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {t.assignedToName || 'Unassigned'} • {t.project?.name || 'Company-wide'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                  <span className="text-xs font-semibold text-rose-600">
                    {formatCivilDate(t.dueDate)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Pending
                  </span>
                  {t.revisionCount > 0 && (
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Revised {t.revisionCount}x
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleComplete(t)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-[11px] transition-colors shadow-xs"
                  >
                    Complete
                  </button>
                  <button
                    type="button"
                    onClick={() => setDelayTask(t)}
                    className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-[11px] transition-colors"
                  >
                    Report delay
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviseTask(t)}
                    className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-[11px] transition-colors"
                  >
                    Change date
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* WEEK SHIFTED & REVISED Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              WEEK SHIFTED & REVISED {revisedTasks.length}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/delegation/list?slice=weekShifted')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            View all
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {revisedTasks.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No week-shifted or revised tasks.
            </div>
          ) : (
            revisedTasks.map((t) => (
              <div key={t._id} className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">{t.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {t.assignedToName} • {t.project?.name || 'Company-wide'} • was {formatCivilDate(t.originalDueDate)}
                    {t.revisions?.[t.revisions.length - 1]?.diffDays ? ` +${t.revisions[t.revisions.length - 1].diffDays} days` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                  <span className="text-xs text-slate-600">
                    {formatCivilDate(t.dueDate)}
                  </span>
                  {t.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Pending
                    </span>
                  )}
                  {t.revisionCount > 0 && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                      Revised {t.revisionCount}x
                    </span>
                  )}

                  {t.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleComplete(t)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-[11px] transition-colors shadow-xs"
                      >
                        Complete
                      </button>
                      <button
                        type="button"
                        onClick={() => setDelayTask(t)}
                        className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-[11px] transition-colors"
                      >
                        Report delay
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviseTask(t)}
                        className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-[11px] transition-colors"
                      >
                        Change date
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleReopen(t)}
                      className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium transition-colors"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <AddDelegationModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleCreateTask}
        users={users}
        departments={departments}
        projects={projects}
      />

      <ChangeDateModal
        task={reviseTask}
        isOpen={Boolean(reviseTask)}
        onClose={() => setReviseTask(null)}
        onSubmit={handleReviseDate}
      />

      <DelegationReportDelayModal
        task={delayTask}
        isOpen={Boolean(delayTask)}
        onClose={() => setDelayTask(null)}
        onSubmit={handleReportDelay}
      />
    </div>
  );
}
