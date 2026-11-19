import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  RefreshCw,
  TrendingUp,
  Users,
  MapPin,
  Building,
  Calendar,
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Star,
  Flame,
  ThermometerSun,
  Snowflake,
  Handshake,
  Share2,
  ArrowRight,
  ShieldCheck,
  Award,
  Plus,
} from 'lucide-react';
import WorkKpiStrip from '../../../components/WorkKpiStrip';
import MetricInfoBadge from '../../../components/MetricInfoBadge';
import { crmDashboardApi } from '../../../api/crmDashboardApi';
import { useToast } from '../../../context/ToastContext';

export default function CrmDashboardPage() {
  const navigate = useNavigate();
  const { showError } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await crmDashboardApi.getDashboardData();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      showError(err.message || 'Failed to load executive CRM dashboard');
    } finally {
      setLoading(false);
    }
  };

  const kpis = data?.kpis || {};
  const leadSources = data?.leadSources || [];
  const temperatures = data?.temperatures || { hot: 0, warm: 0, cold: 0 };
  const operations = data?.operations || {};
  const teamPerformers = data?.teamPerformers || [];
  const recentEnquiries = data?.recentEnquiries || [];

  const kpiItems = [
    {
      key: 'total-enquiries',
      label: 'TOTAL ENQUIRIES',
      value: kpis.totalEnquiries || 0,
      tone: 'blue',
      hint: `${kpis.newEnquiries || 0} new · ${(kpis.totalEnquiries || 0) - (kpis.newEnquiries || 0)} in review`,
      icon: PhoneCall,
      onClick: () => navigate('/crm/enquiries'),
      info: {
        title: 'Inbound Enquiries',
        summary: 'Total prospective buyer enquiries registered across phone, walk-in, and digital ads.',
        calculation: 'Count of enquiries where deletedAt is null',
      },
    },
    {
      key: 'qualification-rate',
      label: 'QUALIFICATION RATE',
      value: `${kpis.qualificationRate || 0}%`,
      tone: 'emerald',
      hint: `${kpis.qualifiedEnquiries || 0} of ${kpis.totalEnquiries || 0} verified`,
      icon: TrendingUp,
      onClick: () => navigate('/crm/enquiries?status=qualified'),
      info: {
        title: 'Qualification Funnel Conversion',
        summary: 'Percentage of raw buyer inquiries verified as qualified opportunities.',
        calculation: '(qualifiedEnquiries / totalEnquiries) * 100',
      },
    },
    {
      key: 'site-visits',
      label: 'SITE VISITS CONDUCTED',
      value: kpis.totalVisits || 0,
      tone: 'purple',
      hint: `${kpis.verifiedVisits || 0} GPS verified tours`,
      icon: MapPin,
      onClick: () => navigate('/crm/visit'),
      info: {
        title: 'Customer Site Tours',
        summary: 'Physical on-site villa and plot inspections recorded with geo-fence verification.',
        calculation: 'Count of visit reports in system',
      },
    },
    {
      key: 'broker-yards',
      label: 'BROKER YARDS SOLD',
      value: `${(kpis.totalYards || 0).toLocaleString()} Sq.Yd`,
      tone: 'orange',
      hint: `Across ${kpis.totalBrokers || 0} active partners`,
      icon: Building,
      onClick: () => navigate('/crm/brokers'),
      info: {
        title: 'Cumulative Partner Yardage (Gaj)',
        summary: 'Aggregate plot land and built-up area sold through channel partner network.',
        calculation: 'Sum of totalYards across all active registered brokers',
      },
    },
    {
      key: 'deals-won',
      label: 'DEALS WON / CLOSURES',
      value: kpis.wonLeads || 0,
      tone: 'emerald',
      hint: `${kpis.winRate || 0}% win conversion rate`,
      icon: Award,
      onClick: () => navigate('/crm/leads?status=won'),
      info: {
        title: 'Closed Deals & Registry',
        summary: 'Total prospective buyer deals successfully closed with token booking, ATS agreement, or registry deed.',
        calculation: `Count of leads marked won (${kpis.wonLeads || 0}) with overall win conversion rate (${kpis.winRate || 0}%)`,
      },
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive CRM Dashboard</h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-md">
              Real-Time Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise overview across inquiries, sales stage pipeline, physical site visits, and team performance
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/crm/enquiries"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Enquiries</span>
          </Link>

          <Link
            to="/crm/leads"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Sales Pipeline</span>
          </Link>
        </div>
      </div>

      {/* Top 5 Metric Strip - 3-Liner Cards with Icons & Field Colors */}
      <WorkKpiStrip items={kpiItems} columns="grid-cols-2 sm:grid-cols-5" />

      {/* 2-Column Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
        {/* Left Column: Lead Sources & Temperatures */}
        <div className="space-y-4">
          {/* Lead Sources Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-bold text-slate-900">Acquisition Channels</h2>
                <MetricInfoBadge
                  title="Inbound Acquisition Channels"
                  summary="Source distribution of customer inquiries showing which marketing channels yield buyer interest."
                  calculation="Grouped count and percentage of non-deleted CRM inquiries per lead origin (Meta Ads, Phone, Walk-in, Website, Broker)."
                />
              </div>
              <span className="text-xs text-slate-400">Inbound Distribution</span>
            </div>

            <div className="space-y-2">
              {leadSources.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">No source data yet</div>
              ) : (
                leadSources.map((s) => {
                  const total = leadSources.reduce((acc, curr) => acc + curr.count, 0);
                  const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                  return (
                    <div key={s.source} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 capitalize">
                          {s.source === 'metaAds'
                            ? 'Meta Ad Campaigns'
                            : s.source === 'phone'
                            ? 'Direct Phone Call'
                            : s.source === 'walkIn'
                            ? 'Direct Walk-in'
                            : s.source}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          {s.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-purple-600 h-1.5 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Client Temperature Heatmap */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-1.5">
              <ThermometerSun className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900">Client Intent Heatmap</h2>
              <MetricInfoBadge
                title="Client Intent Heatmap"
                summary="Rule-based and behavioral temperature triage categorizing active leads by purchasing urgency and budget readiness."
                calculation="Hot = High urgency, verified budget, immediate visit; Warm = Actively evaluating property options; Cold = Long-term timeline or unverified budget."
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 text-left">
                <div className="flex items-center gap-1.5 text-rose-600 mb-1">
                  <Flame className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wide truncate">
                    Hot Intent
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-rose-700 tabular-nums">
                  {temperatures.hot}
                </div>
                <div className="text-[10px] text-rose-600/80 truncate mt-0.5">
                  Immediate visit ready
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-left">
                <div className="flex items-center gap-1.5 text-amber-600 mb-1">
                  <ThermometerSun className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide truncate">
                    Warm Intent
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-amber-700 tabular-nums">
                  {temperatures.warm}
                </div>
                <div className="text-[10px] text-amber-600/80 truncate mt-0.5">
                  Active evaluation
                </div>
              </div>

              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 text-left">
                <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                  <Snowflake className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide truncate">
                    Cold Intent
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-blue-700 tabular-nums">
                  {temperatures.cold}
                </div>
                <div className="text-[10px] text-blue-600/80 truncate mt-0.5">
                  Long-term prospect
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Operational Radar & Team Performers */}
        <div className="space-y-4">
          {/* Operational Follow-Up Radar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Follow-up & Operational Radar</h2>
                <MetricInfoBadge
                  title="Operational Follow-up Radar"
                  summary="Daily operational task monitoring tracking scheduled customer call-backs, overdue touchpoints, and VIP escalations."
                  calculation="Overdue Tasks = Pending reminders with reminderDate < today; Due Today = Scheduled for today; Starred VIP = High-touch special follow-up leads."
                />
              </div>
              <Link
                to="/crm/followups"
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Follow-ups
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Link
                to="/crm/followups?status=overdue"
                className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 text-left hover:bg-rose-100/70 transition-colors block"
              >
                <div className="flex items-center gap-1.5 text-rose-600 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wide truncate">
                    Overdue
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-rose-700 tabular-nums">
                  {operations.overdueReminders || 0}
                </div>
                <div className="text-[10px] text-rose-600/80 truncate mt-0.5">
                  Immediate action
                </div>
              </Link>

              <Link
                to="/crm/followups?status=dueToday"
                className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-left hover:bg-emerald-100/70 transition-colors block"
              >
                <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide truncate">
                    Due Today
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-emerald-700 tabular-nums">
                  {operations.todayReminders || 0}
                </div>
                <div className="text-[10px] text-emerald-600/80 truncate mt-0.5">
                  Before end of day
                </div>
              </Link>

              <Link
                to="/crm/special-followups"
                className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-left hover:bg-amber-100/70 transition-colors block"
              >
                <div className="flex items-center gap-1.5 text-amber-600 mb-1">
                  <Star className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide truncate">
                    Starred VIP
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-amber-700 tabular-nums">
                  {operations.specialFollowups || 0}
                </div>
                <div className="text-[10px] text-amber-600/80 truncate mt-0.5">
                  Priority client care
                </div>
              </Link>
            </div>
          </div>

          {/* Team Workload & Performers */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Sales Team Workload & Lead Distribution</h2>
                <MetricInfoBadge
                  title="Sales Team Workload & Distribution"
                  summary="Workload distribution and deal closing velocity across sales representatives, ensuring balanced pipeline management."
                  calculation="Total assigned leads and closed won deals per sales executive in the CRM system."
                />
              </div>
              <Link
                to="/crm/lead-assignments"
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Rebalance
              </Link>
            </div>

            <div className="space-y-2">
              {teamPerformers.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">No team data yet</div>
              ) : (
                teamPerformers.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{t.user}</div>
                      <div className="text-[10px] text-slate-400">{t.role}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800">
                        {t.totalAssigned} Leads Assigned
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">
                        {t.wonDeals} Deals Won
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Enquiries Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden w-full space-y-0">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Recent Inbound Enquiries</h2>
            <MetricInfoBadge
              title="Recent Inbound Enquiries"
              summary="Chronological real-time audit stream of the latest buyer inquiries captured across all digital and direct marketing channels."
              calculation="Latest 5 enquiry records showing client contact, channel source, intent temperature, and qualification status."
            />
          </div>
          <Link
            to="/crm/enquiries"
            className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
          >
            <span>View All ({kpis.totalEnquiries || 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Enquiry Code</th>
                <th className="py-2.5 px-4">Client Name</th>
                <th className="py-2.5 px-4">Phone</th>
                <th className="py-2.5 px-4">Source</th>
                <th className="py-2.5 px-4">Intent Temperature</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentEnquiries.map((enq) => (
                <tr key={enq._id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-blue-600">
                    {enq.enquiryNumber}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{enq.clientName}</td>
                  <td className="py-2.5 px-4">
                    <a href={`tel:${enq.clientPhone}`} className="hover:text-blue-600">
                      {enq.clientPhone}
                    </a>
                  </td>
                  <td className="py-2.5 px-4 capitalize">{enq.source}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.2 rounded-full text-[10px] font-semibold capitalize ${
                        enq.temperature === 'hot'
                          ? 'bg-rose-50 text-rose-700'
                          : enq.temperature === 'warm'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {enq.temperature}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 capitalize">{enq.status}</td>
                  <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                    {new Date(enq.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
