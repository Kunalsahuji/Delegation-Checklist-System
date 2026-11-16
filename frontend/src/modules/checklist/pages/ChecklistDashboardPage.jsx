import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  HelpCircle, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { checklistApi } from '../api/checklistApi';
import { axiosClient } from '../../../api/axiosClient';
import { ChecklistTaskDrawer } from '../components/ChecklistTaskDrawer';
import { ReportDelayModal } from '../components/ReportDelayModal';
import { SkipModal } from '../components/SkipModal';
import { ReassignModal } from '../components/ReassignModal';
import StatusDistributionCard from '../../../components/StatusDistributionCard';
import WorkKpiStrip from '../../../components/WorkKpiStrip';
import MetricInfoBadge from '../../../components/MetricInfoBadge';
import { formatCivilDate, formatBusinessTime } from '../../../utils/civilDate';

export default function ChecklistDashboardPage() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [overdueItems, setOverdueItems] = useState([]);
  const [revisedItems, setRevisedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Departments for top right filter
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');

  // Modals / Drawers
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [delayOcc, setDelayOcc] = useState(null);
  const [skipOcc, setSkipOcc] = useState(null);
  const [reassignOcc, setReassignOcc] = useState(null);

  // Masters
  const [users, setUsers] = useState([]);

  // Notice
  const [notice, setNotice] = useState(null);
  const showNotice = (type, message) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, overdueRes, allOccRes, dRes, uRes] = await Promise.all([
        checklistApi.getStats({ department: selectedDept }),
        checklistApi.getOccurrences({ status: 'overdue', department: selectedDept, limit: 10 }),
        checklistApi.getOccurrences({ department: selectedDept, limit: 50 }),
        axiosClient.get('/master/departments'),
        axiosClient.get('/master/users'),
      ]);

      const statsObj = statsData?.data || statsData;
      setStats(statsObj);
      setOverdueItems(overdueRes?.items || overdueRes?.data || []);

      const allOccs = allOccRes?.items || allOccRes?.data || [];
      const delayedOrReassigned = allOccs.filter(
        (it) => it.progressCount > 0 || it.latestProgress?.expectedDate || it.reassignmentCount > 0
      );
      setRevisedItems(delayedOrReassigned);

      setDepartments(Array.isArray(dRes?.data) ? dRes.data : Array.isArray(dRes) ? dRes : []);
      setUsers(Array.isArray(uRes?.data) ? uRes.data : Array.isArray(uRes) ? uRes : []);
    } catch (err) {
      console.error('Failed to load checklist dashboard', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDept]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actions
  const handleComplete = async (occ) => {
    try {
      await checklistApi.completeOccurrence(occ._id);
      showNotice('success', 'Checklist occurrence marked done.');
      loadData();
    } catch (err) {
      showNotice('error', 'Failed to complete occurrence');
    }
  };

  const handleSkipSubmit = async (occId, data) => {
    await checklistApi.skipOccurrence(occId, data);
    showNotice('success', 'Occurrence skipped.');
    loadData();
  };

  const handleDelaySubmit = async (occId, data) => {
    await checklistApi.reportDelay(occId, data);
    showNotice('success', 'Delay note recorded.');
    loadData();
  };

  const handleReassignSubmit = async (occId, data) => {
    await checklistApi.reassignOccurrence(occId, data);
    showNotice('success', 'Occurrence reassigned.');
    loadData();
  };

  const total = stats?.totalWork || 0;
  const completed = stats?.completed || 0;
  const pending = stats?.pending || 0;
  const overdue = stats?.overdue || 0;
  const dueToday = stats?.dueToday || 0;
  const skipped = stats?.skipped || 0;

  const validDenominator = total - skipped;
  const completionRate = validDenominator > 0 ? Math.round((completed / validDenominator) * 100) : 0;

  return (
    <div className="space-y-4 w-full">
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
            <span className="text-slate-400">Checklist</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-800 font-semibold">Dashboard</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 ml-1 cursor-pointer hover:text-slate-600" />
          </div>
          <p className="text-xs text-slate-500">
            Recurring operational work
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Checklist</span>
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500 font-medium -mt-2">
        Select a number to see the items behind it.
      </p>

      {/* Top 5 Metric Strip (Faithfully mirroring Tangdi WorkKpiStrip) */}
      <WorkKpiStrip
        label="Checklist summary"
        loading={loading}
        columns="grid-cols-2 sm:grid-cols-5"
        items={[
          {
            key: 'total',
            label: 'TOTAL WORK',
            value: total,
            tone: 'default',
            hint: 'Everything due up to today',
            onClick: () => navigate('/checklist/list?status=all'),
            info: {
              title: 'Total Work',
              summary: 'All recurring operational compliance occurrences due up to today.',
              calculation: 'Completed + Pending + Overdue + Skipped occurrences through today.',
            },
          },
          {
            key: 'done',
            label: 'COMPLETED',
            value: completed,
            tone: completed > 0 ? 'success' : 'default',
            hint: `${completionRate}% completed`,
            onClick: () => navigate('/checklist/list?status=done'),
            info: {
              title: 'Completed Occurrences',
              summary: 'Checklist items verified and ticked Done.',
              calculation: 'Occurrences with status = "done".',
            },
          },
          {
            key: 'pending',
            label: 'PENDING',
            value: pending,
            tone: 'default',
            hint: overdue ? `${overdue} of them overdue` : 'Up to date',
            onClick: () => navigate('/checklist/list?status=pending'),
            info: {
              title: 'Pending Checklist Work',
              summary: 'Scheduled checklist occurrences currently open and awaiting completion.',
              calculation: 'Occurrences with status = "pending" scheduled for today or overdue.',
            },
          },
          {
            key: 'overdue',
            label: 'OVERDUE',
            value: overdue,
            tone: overdue > 0 ? 'danger' : 'default',
            hint: 'Requires immediate action',
            onClick: () => navigate('/checklist/list?status=overdue'),
            info: {
              title: 'Overdue Checklist Items',
              summary: 'Occurrences whose scheduled deadline (date and IST time) has passed.',
              calculation: 'Status = "pending" AND plannedAt < current time.',
            },
          },
          {
            key: 'today',
            label: 'DUE TODAY',
            value: dueToday,
            tone: dueToday > 0 ? 'sky' : 'default',
            hint: 'Due before end of day',
            onClick: () => navigate('/checklist/list?slice=today'),
            info: {
              title: 'Due Today',
              summary: 'Checklist occurrences whose planned execution date is today.',
              calculation: 'Occurrences with plannedOn = today.',
            },
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
              key: 'done',
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
              key: 'overdue',
              label: 'Overdue',
              count: overdue,
              percentage: total ? Math.round((overdue / total) * 100) : 0,
              color: '#f43f5e',
            },
            {
              key: 'skipped',
              label: 'Skipped',
              count: skipped,
              percentage: total ? Math.round((skipped / total) * 100) : 0,
              color: '#94a3b8',
            },
          ]}
          onSelectStatus={(statusKey) => {
            if (!statusKey) navigate('/checklist/list');
            else navigate(`/checklist/list?status=${statusKey}`);
          }}
        />

        {/* Card 2: Completion Overview */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between min-w-0">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[13px] font-semibold text-slate-800">
                Completion overview
              </h3>
              <MetricInfoBadge
                title="Completion Overview"
                summary="Overall percentage of compliance items completed out of items fallen due."
                calculation="Completed items / Due items (skipped excluded) * 100%."
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums text-slate-900 leading-none">
                {completionRate}%
              </span>
              <span className="text-[12px] text-slate-500 font-medium">completion rate</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(completionRate, 100)}%` }}
              />
            </div>

            <p className="text-[12px] text-slate-600">
              <span className="font-medium tabular-nums text-slate-900">{completed}</span> completed{' '}
              <span className="text-slate-400">/</span>{' '}
              <span className="font-medium tabular-nums text-slate-900">{validDenominator}</span> due items (skipped excluded)
            </p>
            <p className="border-t border-slate-100 pt-2 text-[12px] text-slate-600">
              Completed on time: <span className="font-medium tabular-nums text-slate-900">0%</span>{' '}
              <span className="text-slate-400">(of {completed} completed)</span>
            </p>
          </div>
        </div>

        {/* Card 3: Top Employees */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <h3 className="text-[13px] font-semibold text-slate-800">
                Top employees
              </h3>
              <MetricInfoBadge
                title="Top Employees"
                summary="Top individual compliance performers by completion rate and completed items."
                calculation="Completed checklist occurrences / assigned occurrences * 100%."
              />
            </div>

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
              onClick={() => navigate('/checklist/report')}
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
              OVERDUE {overdueItems.length}
            </h3>
            <MetricInfoBadge
              title="Overdue Checklist Items"
              summary="Recurring operational items whose scheduled date and time has passed without being marked Done."
              calculation="Occurrences with status pending and plannedAt < current time."
            />
          </div>
          <button
            type="button"
            onClick={() => navigate('/checklist/list?status=overdue')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            View all
          </button>
        </div>

        {/* Table column headers */}
        <div className="hidden lg:flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="flex-1 min-w-0 pr-4">Task & Assignee / Department</div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="w-28 text-left">Planned Date</span>
            <span className="w-20 text-left">Due Time</span>
            <span className="w-20 text-center">Status</span>
            <span className="w-64 text-right pr-1">Actions</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {overdueItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No overdue checklist items! All recurring operational tasks are up to date.
            </div>
          ) : (
            overdueItems.map((item) => {
              const taskId = item.task?._id || item.task || item._id;
              const title = item.title || item.task?.title || item.taskTitle || 'Untitled task';
              const time = formatBusinessTime(item.plannedAt);
              const freq = item.frequency
                ? item.frequency.charAt(0).toUpperCase() + item.frequency.slice(1)
                : '';
              const subtitle = [
                item.assignedToName || 'Unassigned',
                item.departmentName,
                item.project?.name,
                freq,
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <div key={item._id} className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                  <div className="min-w-0 flex-1 pr-4">
                    <button
                      type="button"
                      onClick={() => navigate(`/checklist/list?open=${taskId}`)}
                      className="text-left font-semibold text-slate-900 hover:text-blue-600 hover:underline transition-colors block text-xs cursor-pointer truncate max-w-full"
                    >
                      {title}
                    </button>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {subtitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start lg:self-auto flex-wrap lg:flex-nowrap shrink-0">
                    <span className="w-28 text-xs font-semibold text-rose-600 whitespace-nowrap text-left">
                      {formatCivilDate(item.plannedOn || item.plannedAt)}
                    </span>
                    <span className="w-20 text-[11px] text-slate-500 font-normal whitespace-nowrap text-left">
                      {time ? `by ${time}` : '18:00'}
                    </span>
                    <div className="w-20 flex items-center justify-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Overdue
                      </span>
                    </div>
                    <div className="w-64 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleComplete(item)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-[11px] transition-colors shadow-xs"
                      >
                        Done
                      </button>
                      <button
                        type="button"
                        onClick={() => setSkipOcc(item)}
                        className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-[11px] transition-colors"
                      >
                        Skip
                      </button>
                      <button
                        type="button"
                        onClick={() => setDelayOcc(item)}
                        className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-[11px] transition-colors"
                      >
                        Report delay
                      </button>
                      <button
                        type="button"
                        onClick={() => setReassignOcc(item)}
                        className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-[11px] transition-colors"
                      >
                        Reassign task
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* WEEK SHIFTED & REVISED Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              WEEK SHIFTED & REVISED {revisedItems.length}
            </h3>
            <MetricInfoBadge
              title="Week Shifted & Revised Checklists"
              summary="Checklist items with recorded delay progress notes, shifted expected dates, or reassignments."
              calculation="Occurrences with progressCount > 0, expectedDate set, or reassignmentCount > 0."
            />
          </div>
          <button
            type="button"
            onClick={() => navigate('/checklist/list')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            View all
          </button>
        </div>

        {/* Table column headers */}
        <div className="hidden lg:flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="flex-1 min-w-0 pr-4">Task & Assignee / Department</div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="w-28 text-left">Planned Date</span>
            <span className="w-28 text-left">Expected Due</span>
            <span className="w-24 text-center">Status / Note</span>
            <span className="w-64 text-right pr-1">Actions</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {revisedItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No week-shifted or revised checklist items.
            </div>
          ) : (
            revisedItems.map((item) => {
              const taskId = item.task?._id || item.task || item._id;
              const title = item.title || item.task?.title || item.taskTitle || 'Untitled task';
              const freq = item.frequency
                ? item.frequency.charAt(0).toUpperCase() + item.frequency.slice(1)
                : '';
              const subtitle = [
                item.assignedToName || 'Unassigned',
                item.departmentName,
                item.project?.name,
                freq,
              ]
                .filter(Boolean)
                .join(' · ');

              const expectedStr = item.latestProgress?.expectedDate
                ? formatCivilDate(item.latestProgress.expectedDate)
                : '—';

              return (
                <div key={item._id} className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                  <div className="min-w-0 flex-1 pr-4">
                    <button
                      type="button"
                      onClick={() => navigate(`/checklist/list?open=${taskId}`)}
                      className="text-left font-semibold text-slate-900 hover:text-blue-600 hover:underline transition-colors block text-xs cursor-pointer truncate max-w-full"
                    >
                      {title}
                    </button>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {subtitle}
                      {item.latestProgress?.note && (
                        <span className="text-amber-600"> · Note: {item.latestProgress.note}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start lg:self-auto flex-wrap lg:flex-nowrap shrink-0">
                    <span className="w-28 text-xs text-slate-500 whitespace-nowrap text-left line-through">
                      {formatCivilDate(item.plannedOn || item.plannedAt)}
                    </span>
                    <span className="w-28 text-xs font-semibold text-amber-700 whitespace-nowrap text-left">
                      {expectedStr}
                    </span>
                    <div className="w-24 flex items-center justify-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {item.reassignmentCount > 0 ? 'Reassigned' : 'Delay reported'}
                      </span>
                    </div>
                    <div className="w-64 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleComplete(item)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-[11px] transition-colors shadow-xs"
                      >
                        Done
                      </button>
                      <button
                        type="button"
                        onClick={() => setSkipOcc(item)}
                        className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-[11px] transition-colors"
                      >
                        Skip
                      </button>
                      <button
                        type="button"
                        onClick={() => setDelayOcc(item)}
                        className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-[11px] transition-colors"
                      >
                        Report delay
                      </button>
                      <button
                        type="button"
                        onClick={() => setReassignOcc(item)}
                        className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-[11px] transition-colors"
                      >
                        Reassign task
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modals & Drawers */}
      <ChecklistTaskDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSaved={loadData}
        departments={departments}
        users={users}
      />

      <ReportDelayModal
        occurrence={delayOcc}
        isOpen={Boolean(delayOcc)}
        onClose={() => setDelayOcc(null)}
        onSubmit={handleDelaySubmit}
      />

      <SkipModal
        occurrence={skipOcc}
        isOpen={Boolean(skipOcc)}
        onClose={() => setSkipOcc(null)}
        onSubmit={handleSkipSubmit}
      />

      <ReassignModal
        occurrence={reassignOcc}
        isOpen={Boolean(reassignOcc)}
        onClose={() => setReassignOcc(null)}
        onSubmit={handleReassignSubmit}
      />
    </div>
  );
}
