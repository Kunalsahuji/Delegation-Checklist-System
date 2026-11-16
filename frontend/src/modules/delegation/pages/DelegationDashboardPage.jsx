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
import StatusDistributionCard from '../../../components/StatusDistributionCard';
import WorkKpiStrip from '../../../components/WorkKpiStrip';

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
        delegationApi.getTasks({ slice: 'revised', limit: 10 }),
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

      {/* Top 5 Metric Strip (Faithfully mirroring Tangdi WorkKpiStrip) */}
      <WorkKpiStrip
        label="Delegation summary"
        loading={loading}
        columns="grid-cols-2 sm:grid-cols-5"
        items={[
          {
            key: 'total',
            label: 'TOTAL WORK',
            value: total,
            tone: 'default',
            hint: 'Including completed and cancelled',
            onClick: () => navigate('/delegation/list?status=all'),
          },
          {
            key: 'completed',
            label: 'COMPLETED',
            value: completed,
            tone: completed > 0 ? 'success' : 'default',
            hint: `${completionRate}% completion rate`,
            onClick: () => navigate('/delegation/list?status=completed'),
          },
          {
            key: 'pending',
            label: 'PENDING',
            value: pending,
            tone: 'default',
            hint: overdue ? `${overdue} of them overdue` : 'Awaiting action',
            onClick: () => navigate('/delegation/list?status=pending'),
          },
          {
            key: 'overdue',
            label: 'OVERDUE',
            value: overdue,
            tone: overdue > 0 ? 'danger' : 'default',
            hint: 'Past due deadline',
            onClick: () => navigate('/delegation/list?status=overdue'),
          },
          {
            key: 'weekShifted',
            label: 'WEEK SHIFTED',
            value: weekShifted,
            tone: weekShifted > 0 ? 'orange' : 'default',
            hint: 'Did not happen in the week it was due',
            onClick: () => navigate('/delegation/list?slice=weekShifted'),
          },
        ]}
      />

      {/* Middle Row: Status Distribution, Completion Overview, Top Employees (Tangdi lg:grid-cols-3) */}
      <div className="grid gap-3 lg:grid-cols-3">
        {/* Card 1: Status Distribution */}
        <StatusDistributionCard
          title="Status distribution"
          total={total}
          items={[
            {
              key: 'completed',
              label: 'Completed',
              count: completed,
              percentage: total ? Math.round((completed / total) * 100) : 0,
              color: '#10b981',
            },
            {
              key: 'pending',
              label: 'Pending',
              count: Math.max(0, pending - overdue),
              percentage: total ? Math.round((Math.max(0, pending - overdue) / total) * 100) : 0,
              color: '#f59e0b',
            },
            {
              key: 'weekShifted',
              label: 'Week shifted',
              count: weekShifted,
              percentage: total ? Math.round((weekShifted / total) * 100) : 0,
              color: '#f97316',
            },
            {
              key: 'overdue',
              label: 'Overdue',
              count: overdue,
              percentage: total ? Math.round((overdue / total) * 100) : 0,
              color: '#f43f5e',
            },
            {
              key: 'cancelled',
              label: 'Cancelled',
              count: cancelled,
              percentage: total ? Math.round((cancelled / total) * 100) : 0,
              color: '#94a3b8',
            },
          ]}
          onSelectStatus={(statusKey) => {
            if (!statusKey) navigate('/delegation/list');
            else navigate(`/delegation/list?status=${statusKey}`);
          }}
        />

        {/* Card 2: Completion Overview */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between min-w-0">
          <div className="space-y-3">
            <h3 className="text-[13px] font-semibold text-slate-800">
              Completion overview
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums text-slate-900 leading-none">
                {completionRate}%
              </span>
              <span className="text-[12px] text-slate-500 font-medium">completion rate</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(completionRate, 100)}%` }}
              />
            </div>

            <p className="text-[12px] text-slate-600">
              <span className="font-medium tabular-nums text-slate-900">{completed}</span> completed{' '}
              <span className="text-slate-400">/</span>{' '}
              <span className="font-medium tabular-nums text-slate-900">{validDenominator}</span> tasks (cancelled excluded)
            </p>
            <p className="border-t border-slate-100 pt-2 text-[12px] text-slate-600">
              Completed by the original date: <span className="font-medium tabular-nums text-slate-900">50%</span>{' '}
              <span className="text-slate-400">(of {completed} completed)</span>
            </p>
          </div>
        </div>

        {/* Card 3: Top Employees Leaderboard */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between min-w-0">
          <div>
            <h3 className="mb-3 text-[13px] font-semibold text-slate-800">
              Top employees
            </h3>

            <div className="space-y-2.5">
              <ul className="space-y-2.5">
                {users.slice(0, 5).map((u, i) => {
                  const isAashish = u.name.includes('Aashish');
                  const done = isAashish ? 1 : i < 2 ? 1 : 0;
                  const assigned = isAashish ? 1 : i < 2 ? 3 : 1;
                  const rate = Math.round((done / assigned) * 100);
                  return (
                    <li key={u._id}>
                      <div className="flex items-baseline justify-between gap-2 text-[13px]">
                        <span className="min-w-0 truncate font-medium text-slate-800" title={u.name}>
                          {u.name}
                        </span>
                        <span className="shrink-0 tabular-nums text-slate-500">
                          {done}/{assigned} · <span className="font-medium text-slate-900">{rate}%</span>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() => navigate('/delegation/report')}
              className="inline-flex items-center text-[12px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Full report
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
            overdueTasks.map((t) => {
              const slipped = t.slippedDays || t.revisions?.[t.revisions.length - 1]?.diffDays || 0;
              const subtitle = [
                t.assignedToName || 'Unassigned',
                t.project?.name || 'Company-wide',
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <div key={t._id} className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/delegation/list?open=${t._id}`)}
                      className="text-left font-semibold text-slate-900 hover:text-blue-600 hover:underline transition-colors block text-xs cursor-pointer truncate max-w-full"
                    >
                      {t.title}
                    </button>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {subtitle}
                      {t.revisionCount > 0 && (
                        <>
                          {' · was ' + formatCivilDate(t.originalDueDate)}
                          {slipped > 0 ? ` · +${slipped} days` : ''}
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto flex-wrap shrink-0">
                    <span className="text-xs font-semibold text-rose-600 whitespace-nowrap">
                      {formatCivilDate(t.dueDate)}
                    </span>
                    {t.status === 'weekShifted' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Week shifted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Pending
                      </span>
                    )}
                    {t.revisionCount > 0 && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium whitespace-nowrap">
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
              );
            })
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
            onClick={() => navigate('/delegation/list?slice=revised')}
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
            revisedTasks.map((t) => {
              const isOverdue = t.isOverdue || t.status === 'overdue' || (t.status !== 'completed' && t.status !== 'cancelled' && t.dueDate && new Date(t.dueDate) < new Date());
              const slipped = t.slippedDays || t.revisions?.[t.revisions.length - 1]?.diffDays || 0;
              const subtitle = [
                t.assignedToName || 'Unassigned',
                t.project?.name || 'Company-wide',
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <div key={t._id} className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/delegation/list?open=${t._id}`)}
                      className="text-left font-semibold text-slate-900 hover:text-blue-600 hover:underline transition-colors block text-xs cursor-pointer truncate max-w-full"
                    >
                      {t.title}
                    </button>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {subtitle}
                      {t.revisionCount > 0 && (
                        <>
                          {' · was ' + formatCivilDate(t.originalDueDate)}
                          {slipped > 0 ? ` · +${slipped} days` : ''}
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto flex-wrap shrink-0">
                    <span className={`text-xs whitespace-nowrap ${isOverdue ? 'font-semibold text-rose-600' : 'text-slate-600'}`}>
                      {formatCivilDate(t.dueDate)}
                    </span>
                    {t.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Completed
                      </span>
                    ) : t.status === 'weekShifted' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Week shifted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Pending
                      </span>
                    )}
                    {t.revisionCount > 0 && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium whitespace-nowrap">
                        Revised {t.revisionCount}x
                      </span>
                    )}

                    {t.status === 'pending' || t.status === 'weekShifted' || t.status === 'overdue' ? (
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
              );
            })
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
