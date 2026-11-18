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
import MetricInfoBadge from '../components/MetricInfoBadge';
import { checklistApi } from '../modules/checklist/api/checklistApi';
import { delegationApi } from '../modules/delegation/api/delegationApi';
import { crmDashboardApi } from '../api/crmDashboardApi';
import { axiosClient } from '../api/axiosClient';
import { formatShortStageName } from '../modules/crm/components/StageBadge';

const CACHE_KEY = 'taskflow_unified_dashboard_cache';
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes fresh cache window

// Clean, Calm, Professional Pipeline Colors (Non-irritating slate & milestone emerald)
const STAGE_COLORS = [
  '#64748B', // S1: Visit Call (Slate)
  '#64748B', // S2: Details Sent (Slate)
  '#64748B', // S3: Reminder Call (Slate)
  '#10B981', // S4: Visit Confirmed (Emerald milestone)
  '#64748B', // S5: Feedback Call (Slate)
  '#3B82F6', // S6: Sales Follow-up (Subtle blue)
  '#6366F1', // S7: Negotiation (Subtle indigo)
  '#10B981', // S8: Final Deal (Emerald milestone)
];

// Helper to normalize inbound lead source names from DB
function formatSourceLabel(raw) {
  if (!raw) return 'Other Inbound';
  const clean = String(raw).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (
    clean.includes('meta') ||
    clean.includes('fb') ||
    clean.includes('face') ||
    clean.includes('insta')
  ) {
    return 'Meta Ad Campaigns';
  }
  if (clean.includes('phone') || clean.includes('call')) {
    return 'Direct Phone Call';
  }
  if (clean.includes('broker') || clean.includes('ref')) {
    return 'Broker / Reference';
  }
  if (clean.includes('web') || clean.includes('site')) {
    return 'Direct Website';
  }
  if (clean.includes('walk')) {
    return 'Direct Walk-In';
  }
  // Title-case fallback
  return String(raw)
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function getSourceColor(raw, idx) {
  if (!raw) return '#64748B';
  const clean = String(raw).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.includes('meta') || clean.includes('fb')) return '#8B5CF6';
  if (clean.includes('phone') || clean.includes('call')) return '#3B82F6';
  if (clean.includes('broker') || clean.includes('ref')) return '#10B981';
  if (clean.includes('web') || clean.includes('site')) return '#F59E0B';
  if (clean.includes('walk')) return '#EC4899';
  return STAGE_COLORS[idx % STAGE_COLORS.length];
}

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
      return funnel.map((item, idx) => {
        const order = item.order || idx + 1;
        const shortName = formatShortStageName(item.stage, order);
        return {
          id: `S${order}`,
          label: `S${order}`,
          name: shortName,
          count: Number(item.count || 0),
          color: STAGE_COLORS[(order - 1) % STAGE_COLORS.length],
        };
      });
    }
    // Fallback default 8 stages with short names
    const defaultLabels = [
      'Visit Call',
      'Details Sent',
      'Reminder Call',
      'Visit Confirmed',
      'Feedback Call',
      'Sales Follow-up',
      'Negotiation',
      'Final Deal',
    ];
    return defaultLabels.map((name, idx) => ({
      id: `S${idx + 1}`,
      label: `S${idx + 1}`,
      name,
      count: 0,
      color: STAGE_COLORS[idx % STAGE_COLORS.length],
    }));
  }, [crmData]);

  // Transform Inbound Lead Sources for PieChart with complete label normalization
  const pieData = useMemo(() => {
    const sources = crmData?.leadSources || [];
    if (sources.length > 0) {
      const mapped = sources.map((s, idx) => {
        const raw = s.source || 'other';
        const label = formatSourceLabel(raw);
        const color = getSourceColor(raw, idx);
        return {
          name: label,
          rawKey: raw,
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
    <div className="space-y-4 sm:space-y-5 w-full pb-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Enterprise Operations & Sales Command</span>
            <MetricInfoBadge
              title="Unified Command Center"
              summary="Central executive portal synthesizing recurring checklists, delegated deadlines, and real estate CRM pipeline in real-time."
              calculation="Aggregates live counts across Checklist, Delegation, CRM, and Master services."
            />
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'Administrator'}
          </h1>
          <p className="mt-1 text-slate-500 text-xs max-w-2xl leading-relaxed">
            Real-time executive oversight across operational checklists, delegation assignments, and end-to-end real estate sales pipeline.
          </p>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={() => fetchCounts(true)}
            disabled={isRefreshing}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer shrink-0"
            title="Refresh metrics from server"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />
          </button>
          <Link to="/checklist/list" className="flex-1 sm:flex-initial">
            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer">
              <CheckSquare className="w-3.5 h-3.5 shrink-0" />
              <span>Checklists</span>
            </button>
          </Link>
          <Link to="/delegation/list" className="flex-1 sm:flex-initial">
            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer">
              <ListTodo className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Delegations</span>
            </button>
          </Link>
          <Link to="/crm/dashboard" className="flex-1 sm:flex-initial">
            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>CRM Pipeline</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Top 6 Executive KPI Metric Cards - Responsive Breakpoints */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
        <StatCard
          title="Checklist Items"
          value={checklistStats?.pending ?? checklistStats?.totalWork}
          loading={loading}
          subtext="Active recurring"
          icon={CheckSquare}
          variant="primary"
          onClick={() => navigate('/checklist/list')}
          info={{
            title: 'Checklist Items',
            summary: 'Active recurring operational tasks scheduled across daily, weekly, and monthly frequencies.',
            calculation: 'Count of pending checklist occurrences currently awaiting tick or verification.',
          }}
        />
        <StatCard
          title="Delegation Tasks"
          value={delegationStats?.totalWork}
          loading={loading}
          subtext="Assigned tasks"
          icon={ListTodo}
          variant="default"
          onClick={() => navigate('/delegation/list')}
          info={{
            title: 'Delegation Tasks',
            summary: 'Assigned one-off tasks with immutable original deadlines and reason-logged revisions.',
            calculation: 'Count of all active and pending delegation tasks across departments.',
          }}
        />
        <StatCard
          title="Active CRM Leads"
          value={activeLeadsCount}
          loading={loading}
          subtext={`${crmData?.kpis?.totalEnquiries || 0} total enquiries`}
          icon={TrendingUp}
          variant="primary"
          onClick={() => navigate('/crm/leads')}
          info={{
            title: 'Active CRM Leads',
            summary: 'Prospective property buyer leads undergoing active qualification and sales progression.',
            calculation: 'Total count of buyer leads in active status across pipeline stages S1 through S8.',
          }}
        />
        <StatCard
          title="Site Visits"
          value={siteVisitsCount}
          loading={loading}
          subtext={`${crmData?.kpis?.verifiedVisits || 0} GPS verified`}
          icon={MapPin}
          variant="success"
          onClick={() => navigate('/crm/visit')}
          info={{
            title: 'Site Visits Conducted',
            summary: 'Field inspection tours conducted with clients at project sites, verified via GPS coordinates.',
            calculation: 'Count of completed site visits logged with geo-stamped latitude and longitude bounds.',
          }}
        />
        <StatCard
          title="Broker Yards"
          value={`${yardsCount.toLocaleString()}`}
          loading={loading}
          subtext={`${crmData?.kpis?.totalBrokers || 0} active partners`}
          icon={Award}
          variant="default"
          onClick={() => navigate('/crm/brokers')}
          info={{
            title: 'Broker Yards Sold',
            summary: 'Cumulative square yardage of land and plots booked through registered channel partners.',
            calculation: 'Total Gaj (Sq.Yd) credited towards channel partner performance milestones.',
          }}
        />
        <StatCard
          title="Active Staff"
          value={userCount}
          loading={loading}
          subtext={`${deptCount || 0} departments`}
          icon={Users2}
          variant="success"
          onClick={() => navigate('/master/users')}
          info={{
            title: 'Active Staff & Doers',
            summary: 'Registered employees and operational division members with active ERP credentials.',
            calculation: 'Total user records with status = active across all master departments.',
          }}
        />
      </div>

      {/* Interactive Visual Charts Section - Responsive Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5">
        {/* Left: 8-Stage Real Estate Sales Pipeline Funnel (Bar Chart) */}
        <div className="xl:col-span-7 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            {/* Responsive Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      8-Stage Sales Pipeline Funnel
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200 shrink-0">
                      Live Conversion
                    </span>
                    <MetricInfoBadge
                      title="8-Stage Sales Pipeline Funnel"
                      summary="Visual conversion pipeline tracking property buyers across 8 milestone stages from initial contact to Agreement to Sell (ATS)."
                      calculation="Live lead count grouped by stage order (S1 to S8) with status = active."
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 hidden xs:block sm:block truncate">
                    Lead distribution across confirmation, site visits, follow-up, and closing
                  </p>
                </div>
              </div>
              <Link
                to="/crm/leads"
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center gap-1 shrink-0 self-end sm:self-center hover:underline"
              >
                <span>All Leads</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Funnel Bar Chart */}
            <div className="w-full h-56 sm:h-64 mt-2">
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

          {/* Bottom Stage Legend Chips - Responsive Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 pt-3 mt-3 border-t border-slate-100 text-[10px] text-slate-600">
            {pipelineData.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-2 py-1 rounded bg-slate-50 border border-slate-100/80"
                title={`${item.label}: ${item.name} (${item.count} leads)`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-bold text-slate-700 text-[10px]">{item.label}</span>
                </div>
                <span className="text-slate-500 font-mono text-[9px]">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Inbound Lead Acquisition Channels (Pie / Donut Chart) */}
        <div className="xl:col-span-5 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            {/* Responsive Card Header */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center font-bold shrink-0">
                  <PieIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate">
                      Acquisition Channels
                    </h3>
                    <MetricInfoBadge
                      title="Lead Acquisition Channels"
                      summary="Inbound lead distribution by marketing acquisition channel and campaign origin."
                      calculation="Percentage and count breakdown of enquiries by source (Meta Ads, Direct Call, Broker, Website, Walk-In)."
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Inbound marketing mix & enquiry sources
                  </p>
                </div>
              </div>
              <Link
                to="/crm/enquiries"
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center gap-0.5 shrink-0 hover:underline"
              >
                <span>Enquiries</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Donut Chart & Breakdown Side-by-Side to prevent vertical overflow */}
            <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-3 sm:gap-4 my-2">
              {/* Donut Chart with Centered KPI */}
              <div className="sm:col-span-6 relative w-full h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <RechartsTooltip content={<SourceTooltip total={totalInbound} />} />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={66}
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
                  <div className="text-base sm:text-lg font-bold text-slate-900 leading-none">{totalInbound}</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">
                    Inbound
                  </div>
                </div>
              </div>

              {/* Breakdown List */}
              <div className="sm:col-span-6 space-y-1.5 text-xs">
                {pieData.map((source, idx) => {
                  const pct = totalInbound > 0 ? Math.round((source.value / totalInbound) * 100) : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5 min-w-0 pr-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: source.color }} />
                        <span className="truncate text-slate-700 font-medium">{source.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono shrink-0">
                        <span className="text-slate-900 font-semibold">{source.value}</span>
                        <span className="text-slate-400 text-[10px] w-8 text-right">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Operational Workspaces: 3 Dedicated Cards - 2 cols on tablet/1024px laptop, 3 cols on xl: (1280px+) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {/* Workspace 1: Checklist Operations */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center font-bold shadow-2xs">
                <CheckSquare className="w-4.5 h-4.5" />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="badge badge-info text-[10px] px-2 py-0.5">Recurring</span>
                <MetricInfoBadge
                  title="Checklist Workspace"
                  summary="Standard operational procedure engine with daily, weekly, and monthly recurrence, skip-holiday rules, remarks, and one-click completion."
                  calculation="Tracks active occurrences, pending ticks, and weekly % Work Not Done compliance."
                />
              </div>
            </div>
            <h2 className="text-base font-bold text-slate-900">Checklist Workspace</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed line-clamp-2">
              Standard operating procedures with daily, weekly, and monthly recurrence, skip-holiday rules, and one-click completion.
            </p>
            <div className="space-y-2 mb-4 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Items to Tick view with instant completion</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Checklist Setup drawer for recurring definitions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Weekly Performance Report (% Work Not Done)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <Link to="/checklist/dashboard" className="flex-1">
              <button
                type="button"
                className="w-full py-2 px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer text-center"
              >
                Dashboard
              </button>
            </Link>
            <Link to="/checklist/list" className="flex-1">
              <button
                type="button"
                className="w-full py-2 px-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
              >
                <span>Checklists</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </Link>
          </div>
        </div>

        {/* Workspace 2: Delegation Tasks */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
                <ListTodo className="w-4.5 h-4.5" />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="badge badge-success text-[10px] px-2 py-0.5">Assigned Tasks</span>
                <MetricInfoBadge
                  title="Delegation Workspace"
                  summary="One-off task delegation desk with audit-locked original deadlines, mandatory extension reason logging, and score compliance."
                  calculation="Evaluates weekly Red/Yellow/Green compliance (0 vs 1 vs 2+ revisions)."
                />
              </div>
            </div>
            <h2 className="text-base font-bold text-slate-900">Delegation Workspace</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed line-clamp-2">
              One-off task delegation with immutable original due dates, mandatory reason logging on date revisions, and compliance scoring.
            </p>
            <div className="space-y-2 mb-4 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Delegation List with overdue & week-shifted tags</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Date Revision Modal with mandatory reason tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Red / Yellow / Green weekly performance report</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <Link to="/delegation/dashboard" className="flex-1">
              <button
                type="button"
                className="w-full py-2 px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer text-center"
              >
                Dashboard
              </button>
            </Link>
            <Link to="/delegation/list" className="flex-1">
              <button
                type="button"
                className="w-full py-2 px-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
              >
                <span>Delegations</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </Link>
          </div>
        </div>

        {/* Workspace 3: Real Estate CRM & Sales */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between md:col-span-2 xl:col-span-1">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold shadow-2xs">
                <Building2 className="w-4.5 h-4.5" />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="badge badge-primary text-[10px] px-2 py-0.5">Real Estate CRM</span>
                <MetricInfoBadge
                  title="Real Estate CRM Workspace"
                  summary="Complete property sales platform with 8-stage conversion funnel, GPS-stamped site visit verification, follow-up radar, and broker pyramid."
                  calculation="Aggregates conversion velocity, field tour verification, and cumulative Gaj yardage."
                />
              </div>
            </div>
            <h2 className="text-base font-bold text-slate-900">Real Estate CRM</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed line-clamp-2">
              Complete property sales pipeline, GPS-stamped site visit verification, automatic follow-up reminders, and broker hierarchy tracking.
            </p>
            <div className="space-y-2 mb-4 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                <span className="truncate">8-Stage sales funnel with strict stage transitions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                <span className="truncate">Geo-stamped site visit verification with radius bounds</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                <span className="truncate">8-tier channel partner hierarchy & yardage milestones</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <Link to="/crm/dashboard" className="flex-1">
              <button
                type="button"
                className="w-full py-2 px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer text-center"
              >
                Dashboard
              </button>
            </Link>
            <Link to="/crm/leads" className="flex-1">
              <button
                type="button"
                className="w-full py-2 px-2.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
              >
                <span>Open Leads</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
