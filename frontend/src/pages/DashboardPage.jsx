import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  ListTodo,
  ArrowRight,
  TrendingUp,
  Building2,
  Users2,
  FolderGit2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { checklistApi } from '../modules/checklist/api/checklistApi';
import { delegationApi } from '../modules/delegation/api/delegationApi';
import { axiosClient } from '../api/axiosClient';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checklistStats, setChecklistStats] = useState(null);
  const [delegationStats, setDelegationStats] = useState(null);
  const [userCount, setUserCount] = useState(null);
  const [deptCount, setDeptCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCounts = async () => {
      try {
        setLoading(true);
        const [statsRes, dlgStatsRes, userRes, deptRes] = await Promise.all([
          checklistApi.getStats(),
          delegationApi.getStats(),
          axiosClient.get('/master/users'),
          axiosClient.get('/master/departments'),
        ]);
        if (!isMounted) return;
        if (statsRes) setChecklistStats(statsRes.data || statsRes);
        if (dlgStatsRes) setDelegationStats(dlgStatsRes.data || dlgStatsRes);
        const uList = userRes?.data || userRes || [];
        const dList = deptRes?.data || deptRes || [];
        if (Array.isArray(uList)) setUserCount(uList.length);
        if (Array.isArray(dList)) setDeptCount(dList.length);
      } catch (e) {
        // silent fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCounts();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-4 sm:space-y-5 w-full">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Operational Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'Administrator'}
          </h1>
          <p className="mt-1 text-slate-500 text-xs max-w-xl">
            Recurring operational checklist monitoring, assigned delegation task tracking, and weekly compliance.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 shrink-0">
          <Link to="/checklist/list" className="flex-1 sm:flex-initial">
            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors">
              <CheckSquare className="w-4 h-4" />
              <span>Checklists</span>
            </button>
          </Link>
          <Link to="/delegation/list" className="flex-1 sm:flex-initial">
            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors">
              <ListTodo className="w-4 h-4 text-emerald-400" />
              <span>Delegations</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Operational KPI Metric Cards (Real Business Metrics - No DB Technical Jargon) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Checklist Items"
          value={checklistStats?.pending ?? checklistStats?.totalWork}
          loading={loading}
          subtext="Active recurring tasks"
          icon={CheckSquare}
          variant="primary"
          onClick={() => navigate('/checklist/list')}
        />
        <StatCard
          title="Delegation Tasks"
          value={delegationStats?.totalWork}
          loading={loading}
          subtext="Assigned work & due dates"
          icon={ListTodo}
          variant="default"
          onClick={() => navigate('/delegation/list')}
        />
        <StatCard
          title="Departments"
          value={deptCount}
          loading={loading}
          subtext="Active divisions"
          icon={FolderGit2}
          variant="default"
          onClick={() => navigate('/master/departments')}
        />
        <StatCard
          title="Active Employees"
          value={userCount}
          loading={loading}
          subtext="Assigned doers & staff"
          icon={Users2}
          variant="success"
          onClick={() => navigate('/master/users')}
        />
      </div>

      {/* Module Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Checklist Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
              <CheckSquare className="w-4 h-4" />
            </div>
            <span className="badge badge-info">Recurring Operations</span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Checklist Workspace</h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Operational recurring tasks with daily, weekly, monthly frequencies, skip holidays, progress remarks, and one-click completion.
          </p>
          <div className="space-y-2 mb-6 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Items to Tick view with instant completion</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Checklist Setup drawer for task recurring definitions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Weekly Performance Report (% Work Not Done)</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/checklist/dashboard" className="flex-1">
              <Button variant="secondary" className="w-full text-xs">
                Dashboard
              </Button>
            </Link>
            <Link to="/checklist/list" className="flex-1">
              <Button variant="primary" className="w-full text-xs">
                <span>Open Checklists</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Delegation Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ListTodo className="w-4 h-4" />
            </div>
            <span className="badge badge-success">Assigned Tasks</span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Delegation Workspace</h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            One-off assigned tasks with strict immutable original due dates, mandatory reason logging on date revisions, and Red/Yellow/Green scoring.
          </p>
          <div className="space-y-2 mb-6 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Delegation List with overdue and week-shifted tags</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Date Revision Modal with mandatory reason tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Red / Yellow / Green weekly performance report</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/delegation/dashboard" className="flex-1">
              <Button variant="secondary" className="w-full text-xs">
                Dashboard
              </Button>
            </Link>
            <Link to="/delegation/list" className="flex-1">
              <Button variant="primary" className="w-full text-xs">
                <span>Open Delegations</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
