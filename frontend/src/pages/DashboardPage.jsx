import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  RefreshCw,
  BarChart3,
  PieChart as PieIcon,
  PhoneCall,
  MapPin,
  Award,
  Sparkles,
  Layers,
  ChevronRight,
  Flame,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { checklistApi } from '../modules/checklist/api/checklistApi';
import { delegationApi } from '../modules/delegation/api/delegationApi';
import { crmDashboardApi } from '../api/crmDashboardApi';
import { axiosClient } from '../api/axiosClient';

const CACHE_KEY = 'taskflow_unified_dashboard_cache';
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes fresh cache window

// Langdi 8 Pipeline Stage Colors
const STAGE_COLORS = [
  '#2563EB', // S1: Blue
  '#0891B2', // S2: Cyan
  '#7C3AED', // S3: Purple
  '#059669', // S4: Emerald
  '#16A34A', // S5: Green
  '#E11D48', // S6: Rose
  '#C026D3', // S7: Fuchsia
  '#D97706', // S8: Amber
];

const SOURCE_COLORS = {
  meta: '#8B5CF6',
  meta_ads: '#8B5CF6',
  direct_call: '#3B82F6',
  call: '#3B82F6',
  reference: '#10B981',
  broker: '#10B981',
  website: '#F59E0B',
  walk_in: '#EC4899',
  walkin: '#EC4899',
  other: '#64748B',
};

const SOURCE_LABELS = {
  meta: 'Meta Ad Campaigns',
  meta_ads: 'Meta Ad Campaigns',
  direct_call: 'Direct Phone Call',
  call: 'Direct Phone Call',
  reference: 'Broker / Reference',
  broker: 'Broker / Reference',
  website: 'Direct Website',
  walk_in: 'Direct Walk-In',
  walkin: 'Direct Walk-In',
  other: 'Other Channels',
};

// Read cache synchronously to prevent layout shifts & 0ms initial render
function getDashboardCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const isFresh = Date.now() - (parsed.timestamp || 0) < CACHE_TTL_MS;
    return { data: parsed.data, isFresh, timestamp: parsed.timestamp };
  } catch (e) {
    return null;
  }
}

function setDashboardCache(data) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch (e) {
    // ignore sessionStorage errors
  }
}

// Custom Tooltip for Pipeline Bar Chart
const PipelineTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3 rounded-lg shadow-xl text-xs space-y-1 border border-slate-700/80 z-50">
        <div className="font-semibold text-slate-200 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span>{item.label}: {item.name}</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1 text-slate-300">
          <span>Active In Pipeline:</span>
          <span className="font-bold text-white text-sm">{item.count} Leads</span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Source Donut Chart
const SourceTooltip = ({ active, payload, total }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
    return (
      <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3 rounded-lg shadow-xl text-xs space-y-1 border border-slate-700/80 z-50">
        <div className="font-semibold text-slate-200 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span>{item.name}</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1 text-slate-300">
          <span>Total Inbound:</span>
          <span className="font-bold text-white text-sm">
            {item.value} ({percent}%)
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const cached = useRef(getDashboardCache()).current;

  // Initialize with cached data if available (0ms instant render!)
  const [checklistStats, setChecklistStats] = useState(cached?.data?.checklistStats || null);
  const [delegationStats, setDelegationStats] = useState(cached?.data?.delegationStats || null);
  const [crmData, setCrmData] = useState(cached?.data?.crmData || null);
  const [userCount, setUserCount] = useState(cached?.data?.userCount ?? null);
  const [deptCount, setDeptCount] = useState(cached?.data?.deptCount ?? null);
  const [loading, setLoading] = useState(!cached?.data);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCounts = useCallback(async (force = false) => {
    try {
      if (force) {
        setIsRefreshing(true);
      } else if (!cached?.data) {
        setLoading(true);
      }

      const [statsRes, dlgStatsRes, userRes, deptRes, crmRes] = await Promise.all([
        checklistApi.getStats().catch(() => null),
        delegationApi.getStats().catch(() => null),
        axiosClient.get('/master/users').catch(() => null),
        axiosClient.get('/master/departments').catch(() => null),
        crmDashboardApi.getDashboardData().catch(() => null),
      ]);

      const cStats = statsRes?.data || statsRes || null;
      const dStats = dlgStatsRes?.data || dlgStatsRes || null;
      const uList = userRes?.data || userRes || [];
      const dList = deptRes?.data || deptRes || [];
      const crm = crmRes?.data || crmRes || null;
      const uCount = Array.isArray(uList) ? uList.length : null;
      const dpCount = Array.isArray(dList) ? dList.length : null;

      setChecklistStats(cStats);
      setDelegationStats(dStats);
      setCrmData(crm);
      setUserCount(uCount);
      setDeptCount(dpCount);

      // Save to cache for subsequent 0ms instant loads
      setDashboardCache({
        checklistStats: cStats,
        delegationStats: dStats,
        crmData: crm,
        userCount: uCount,
        deptCount: dpCount,
      });
    } catch (e) {
      // silent fallback
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [cached]);

  useEffect(() => {
    if (cached?.isFresh) {
      // Data rendered immediately from cache, silent revalidate
      fetchCounts(false);
    } else {
      fetchCounts(false);
    }
  }, [fetchCounts, cached]);

  // Transform 8-stage pipeline data for BarChart
  const pipelineData = useMemo(() => {
    const funnel = crmData?.funnel || [];
    if (funnel.length > 0) {
      return funnel.map((item, idx) => ({
        id: `S${item.order || idx + 1}`,
        label: `S${item.order || idx + 1}`,
        name: item.stage || `Stage ${item.order || idx + 1}`,
        count: Number(item.count || 0),
        color: STAGE_COLORS[idx % STAGE_COLORS.length],
      }));
    }
    // Fallback default 8 stages
    const defaultLabels = [
      'Call For Visit Confirmation By S/C',
      'Whatsapp & Email Confirmation By S/C',
      'Remind Call By Telesales',
      'Visit Confirmed',
      'Feedback Call by Sales Co-ordinator',
      'Follow-Up Call By Sales Person',
      'Call For Negotiation and Family Visit',
      'Call For Final Deal',
    ];
    return defaultLabels.map((name, idx) => ({
      id: `S${idx + 1}`,
      label: `S${idx + 1}`,
      name,
      count: 0,
      color: STAGE_COLORS[idx % STAGE_COLORS.length],
    }));
  }, [crmData]);

  // Transform Inbound Lead Sources for PieChart
  const pieData = useMemo(() => {
    const sources = crmData?.leadSources || [];
    if (sources.length > 0) {
      const mapped = sources.map((s, idx) => {
        const key = (s.source || 'other').toLowerCase();
        const color = SOURCE_COLORS[key] || STAGE_COLORS[idx % STAGE_COLORS.length];
        const label = SOURCE_LABELS[key] || (s.source ? s.source.replace(/_/g, ' ') : 'Other');
        return {
          name: label,
          rawKey: key,
          value: Number(s.count || 0),
          color,
        };
      }).filter((item) => item.value > 0);

      if (mapped.length > 0) return mapped;
    }

    // Default sample representation if no leads created yet
    return [
      { name: 'Meta Ad Campaigns', rawKey: 'meta', value: 4, color: '#8B5CF6' },
      { name: 'Direct Phone Call', rawKey: 'call', value: 3, color: '#3B82F6' },
      { name: 'Broker / Reference', rawKey: 'broker', value: 2, color: '#10B981' },
      { name: 'Direct Website', rawKey: 'website', value: 1, color: '#F59E0B' },
      { name: 'Direct Walk-In', rawKey: 'walk_in', value: 1, color: '#EC4899' },
    ];
  }, [crmData]);

  const totalInbound = useMemo(() => {
    return pieData.reduce((acc, curr) => acc + curr.value, 0);
  }, [pieData]);

  const activeLeadsCount =
    crmData?.kpis?.activeLeads ?? crmData?.kpis?.totalLeads ?? 0;
  const siteVisitsCount = crmData?.kpis?.totalVisits ?? 0;
  const yardsCount = crmData?.kpis?.totalYards ?? 0;

  return (
    <div className="space-y-4 sm:space-y-5 w-full">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Unified Enterprise Operations & Sales Command</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'Administrator'}
          </h1>
          <p className="mt-1 text-slate-500 text-xs max-w-2xl">
            Real-time executive oversight across operational checklists, delegation assignments, and end-to-end real estate sales pipeline.
          </p>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => fetchCounts(true)}
            disabled={isRefreshing}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh metrics from server"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />
          </button>
          <Link to="/checklist/list" className="flex-1 sm:flex-initial">
            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Checklists</span>
            </button>
          </Link>
          <Link to="/delegation/list" className="flex-1 sm:flex-initial">
            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer">
              <ListTodo className="w-3.5 h-3.5 text-emerald-400" />
              <span>Delegations</span>
            </button>
          </Link>
          <Link to="/crm/dashboard" className="flex-1 sm:flex-initial">
            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>CRM Pipeline</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Top 6 Executive KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Checklist Items"
          value={checklistStats?.pending ?? checklistStats?.totalWork}
          loading={loading}
          subtext="Active recurring"
          icon={CheckSquare}
          variant="primary"
          onClick={() => navigate('/checklist/list')}
        />
        <StatCard
          title="Delegation Tasks"
          value={delegationStats?.totalWork}
          loading={loading}
          subtext="Assigned tasks"
          icon={ListTodo}
          variant="default"
          onClick={() => navigate('/delegation/list')}
        />
        <StatCard
          title="Active CRM Leads"
          value={activeLeadsCount}
          loading={loading}
          subtext={`${crmData?.kpis?.totalEnquiries || 0} total enquiries`}
          icon={TrendingUp}
          variant="primary"
          onClick={() => navigate('/crm/leads')}
        />
        <StatCard
          title="Site Visits"
          value={siteVisitsCount}
          loading={loading}
          subtext={`${crmData?.kpis?.verifiedVisits || 0} GPS verified`}
          icon={MapPin}
          variant="success"
          onClick={() => navigate('/crm/visit')}
        />
        <StatCard
          title="Broker Yards"
          value={`${yardsCount.toLocaleString()}`}
          loading={loading}
          subtext={`${crmData?.kpis?.totalBrokers || 0} active partners`}
          icon={Award}
          variant="default"
          onClick={() => navigate('/crm/brokers')}
        />
        <StatCard
          title="Active Staff"
          value={userCount}
          loading={loading}
          subtext={`${deptCount || 0} departments`}
          icon={Users2}
          variant="success"
          onClick={() => navigate('/master/users')}
        />
      </div>

      {/* Interactive Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left: 8-Stage Real Estate Sales Pipeline Funnel (Bar Chart) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>8-Stage Sales Pipeline Funnel</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                      Live Conversion
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Lead distribution across confirmation, site visits, follow-up, and closing
                  </p>
                </div>
              </div>
              <Link
                to="/crm/leads"
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center gap-1 hover:underline"
              >
                <span>All Leads</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Funnel Bar Chart */}
            <div className="w-full h-56 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={pipelineData}
                  margin={{ top: 12, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="label"
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                  />
                  <RechartsTooltip content={<PipelineTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
                    {pipelineData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Stage Legend Chips */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-3 mt-3 border-t border-slate-100 text-[10px] text-slate-600">
            {pipelineData.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 p-1 rounded bg-slate-50 border border-slate-100/80 truncate"
                title={`${item.label}: ${item.name} (${item.count} leads)`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-bold text-slate-700">{item.label}</span>
                <span className="text-slate-500 ml-auto font-mono text-[9px]">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Inbound Lead Acquisition Channels (Pie / Donut Chart) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                  <PieIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Lead Acquisition Channels</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-semibold border border-violet-200">
                      Inbound Mix
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Source breakdown of buyer enquiries & marketing campaign ROI
                  </p>
                </div>
              </div>
              <Link
                to="/crm/enquiries"
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center gap-1 hover:underline"
              >
                <span>Enquiries</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Donut Chart with Centered KPI */}
            <div className="relative w-full h-52 flex items-center justify-center mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <RechartsTooltip content={<SourceTooltip total={totalInbound} />} />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Inner Center Label */}
              <div className="absolute pointer-events-none text-center">
                <div className="text-lg font-bold text-slate-900 leading-none">{totalInbound}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">
                  Inbound
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {pieData.map((source, idx) => {
              const pct = totalInbound > 0 ? Math.round((source.value / totalInbound) * 100) : 0;
              return (
                <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: source.color }} />
                    <span className="truncate text-slate-700 font-medium">{source.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono shrink-0">
                    <span className="text-slate-900 font-semibold">{source.value}</span>
                    <span className="text-slate-400 text-[10px] w-8 text-right">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Core Operational Workspaces: 3 Dedicated Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Workspace 1: Checklist Operations */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center font-bold shadow-2xs">
                <CheckSquare className="w-5 h-5" />
              </div>
              <span className="badge badge-info">Recurring Operations</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">Checklist Workspace</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Standard operating procedures with daily, weekly, and monthly recurrence, skip-holiday rules, remarks, and one-click completion.
            </p>
            <div className="space-y-2 mb-6 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Items to Tick view with instant completion</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Checklist Setup drawer for recurring definitions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Weekly Performance Report (% Work Not Done)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
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

        {/* Workspace 2: Delegation Tasks */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
                <ListTodo className="w-5 h-5" />
              </div>
              <span className="badge badge-success">Assigned Tasks</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">Delegation Workspace</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              One-off task delegation with immutable original due dates, mandatory reason logging on date revisions, and weekly score compliance.
            </p>
            <div className="space-y-2 mb-6 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Delegation List with overdue & week-shifted tags</span>
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
          </div>
          <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
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

        {/* Workspace 3: Real Estate CRM & Sales */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold shadow-2xs">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="badge badge-primary">End-to-End Sales</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">Real Estate CRM</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Complete property sales pipeline, GPS-stamped site visit verification, automatic follow-up reminders, and broker hierarchy tracking.
            </p>
            <div className="space-y-2 mb-6 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                <span>8-Stage sales funnel with strict stage transitions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                <span>Geo-stamped site visit verification with radius bounds</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                <span>8-tier channel partner hierarchy & yardage milestones</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
            <Link to="/crm/dashboard" className="flex-1">
              <Button variant="secondary" className="w-full text-xs">
                Dashboard
              </Button>
            </Link>
            <Link to="/crm/leads" className="flex-1">
              <Button variant="primary" className="w-full text-xs bg-violet-600 hover:bg-violet-700">
                <span>Open Leads</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
