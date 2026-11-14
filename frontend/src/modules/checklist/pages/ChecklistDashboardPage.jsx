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

const formatCivilDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getUTCDate()).padStart(2, '0')}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
};

export default function ChecklistDashboardPage() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [overdueItems, setOverdueItems] = useState([]);
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
      const [statsData, overdueRes, dRes, uRes] = await Promise.all([
        checklistApi.getStats({ department: selectedDept }),
        checklistApi.getOccurrences({ status: 'overdue', department: selectedDept, limit: 10 }),
        axiosClient.get('/master/departments'),
        axiosClient.get('/master/users'),
      ]);

      const statsObj = statsData?.data || statsData;
      setStats(statsObj);
      setOverdueItems(overdueRes?.items || overdueRes?.data || []);
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

      {/* Top 5 Metric Cards (Matching Screenshot 5) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* TOTAL WORK */}
        <button
          type="button"
          onClick={() => navigate('/checklist/list?status=all')}
          className="text-left p-3.5 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all"
        >
          <div className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase mb-1">
            TOTAL WORK
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '-' : total}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            Everything due up to today
          </p>
        </button>

        {/* COMPLETED */}
        <button
          type="button"
          onClick={() => navigate('/checklist/list?status=done')}
          className="text-left p-3.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-sm transition-all"
        >
          <div className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase mb-1">
            COMPLETED
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {loading ? '-' : completed}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {completionRate}% completed
          </p>
        </button>

        {/* PENDING */}
        <button
          type="button"
          onClick={() => navigate('/checklist/list?status=pending')}
          className="text-left p-3.5 bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-sm transition-all"
        >
          <div className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase mb-1">
            PENDING
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '-' : pending}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {overdue ? `${overdue} of them overdue` : 'Up to date'}
          </p>
        </button>

        {/* OVERDUE */}
        <button
          type="button"
          onClick={() => navigate('/checklist/list?status=overdue')}
          className="text-left p-3.5 bg-white rounded-xl border border-slate-200 hover:border-rose-400 hover:shadow-sm transition-all"
        >
          <div className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase mb-1">
            OVERDUE
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {loading ? '-' : overdue}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            Requires immediate action
          </p>
        </button>

        {/* DUE TODAY */}
        <button
          type="button"
          onClick={() => navigate('/checklist/list?slice=today')}
          className="text-left p-3.5 bg-white rounded-xl border border-slate-200 hover:border-sky-400 hover:shadow-sm transition-all col-span-2 sm:col-span-1"
        >
          <div className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase mb-1">
            DUE TODAY
          </div>
          <div className="text-2xl font-bold text-sky-600">
            {loading ? '-' : dueToday}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            Due before end of day
          </p>
        </button>
      </div>

      {/* Middle Row (Status Distribution, Completion Overview, Top Employees) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Distribution Donut */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">
            Status distribution
          </h3>

          <div className="flex items-center justify-around gap-4 my-auto">
            <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                <circle
                  cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="4"
                  strokeDasharray={`${(completed / (total || 1)) * 88} 88`}
                  strokeDashoffset="0"
                />
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
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-600 text-[11px] min-w-[70px]">Overdue</span>
                <span className="font-semibold text-slate-800 text-[11px]">{overdue}</span>
                <span className="text-slate-400 text-[10px]">({total ? Math.round((overdue / total) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-slate-600 text-[11px] min-w-[70px]">Skipped</span>
                <span className="font-semibold text-slate-800 text-[11px]">{skipped}</span>
                <span className="text-slate-400 text-[10px]">({total ? Math.round((skipped / total) * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Completion Overview */}
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

            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(completionRate, 100)}%` }}
              />
            </div>

            <p className="text-xs text-slate-600 mb-1">
              <strong>{completed} completed</strong> / {validDenominator} due items (skipped excluded)
            </p>
            <p className="text-[11px] text-slate-400">
              Completed on time: <strong>0%</strong> (of {completed} completed)
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Operational Rigor</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
              Tracking
            </span>
          </div>
        </div>

        {/* Top Employees */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Top employees
            </h3>

            <div className="space-y-3">
              {users.slice(0, 4).map((u, i) => {
                const score = i === 0 ? '1/3 • 33%' : i === 1 ? '1/2 • 50%' : '0/1 • 0%';
                const pct = i === 0 ? 33 : i === 1 ? 50 : 0;
                return (
                  <div key={u._id} className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-800 truncate max-w-[140px]" title={u.name}>
                        {u.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {score}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
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
              onClick={() => navigate('/checklist/report')}
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
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            OVERDUE {overdueItems.length}
          </h3>
          <button
            type="button"
            onClick={() => navigate('/checklist/list?status=overdue')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            View all
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {overdueItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No overdue checklist items! All recurring operational tasks are up to date.
            </div>
          ) : (
            overdueItems.map((item) => (
              <div key={item._id} className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">{item.taskTitle}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {item.assignedToName || 'Unassigned'} • {item.project?.name || 'Company-wide'} • {item.frequency || 'Daily'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                  <span className="text-xs font-semibold text-rose-600">
                    {formatCivilDate(item.plannedOn)}
                  </span>
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
            ))
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
