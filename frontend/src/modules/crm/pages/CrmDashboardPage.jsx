import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

const STAGE_DETAILS = {
  1: {
    title: 'Stage 1: Call For Visit Confirmation By S/C',
    summary:
      'Initial telephonic outreach by the Sales Coordinator to verify client requirements, confirm buyer intent, and propose an on-site property tour.',
    calculation: 'Count of active buyer leads currently situated at Pipeline Stage 1.',
  },
  2: {
    title: 'Stage 2: WhatsApp & Email Confirmation by S/C',
    summary:
      'Formal dispatch of project layout brochures, GPS navigation links, and scheduled date/time slot confirmations via WhatsApp and Email.',
    calculation: 'Count of active buyer leads currently situated at Pipeline Stage 2.',
  },
  3: {
    title: 'Stage 3: Remind Call By Telesales',
    summary:
      'Courtesy reminder call by the telesales desk 24 hours prior to the scheduled site visit to reconfirm arrival timings and guest transport arrangements.',
    calculation: 'Count of active buyer leads currently situated at Pipeline Stage 3.',
  },
  4: {
    title: 'Stage 4: Visit Confirmed & Ready',
    summary:
      'Appointment formally locked in the CRM calendar. Project sales rep, inspection vehicle, and entry gate pass assigned for client arrival.',
    calculation: 'Count of active buyer leads currently situated at Pipeline Stage 4.',
  },
  5: {
    title: 'Stage 5: Feedback Call by Sales Coordinator',
    summary:
      'Post-visit debrief conducted within 2–4 hours of site tour completion to document client reactions, preferred plot/villa numbers, and address initial concerns.',
    calculation: 'Count of active buyer leads currently situated at Pipeline Stage 5.',
  },
  6: {
    title: 'Stage 6: Follow-Up Call By Sales Person',
    summary:
      'Senior sales executive follow-up presenting tailored payment schedules, unit reservations, bank loan eligibility, and custom price proposals.',
    calculation: 'Count of active buyer leads currently situated at Pipeline Stage 6.',
  },
  7: {
    title: 'Stage 7: Call For Negotiation & Family Visit',
    summary:
      'Commercial negotiation milestone resolving square yard rate discounts, payment milestones, and facilitating secondary decision-maker/family visits.',
    calculation: 'Count of active buyer leads currently situated at Pipeline Stage 7.',
  },
  8: {
    title: 'Stage 8: Call For Final Deal & Closing',
    summary:
      'Closing conversation to finalize token advance booking deposit, execute Agreement to Sell (ATS), and initiate final registry and deed execution.',
    calculation: 'Count of buyer leads currently situated at Stage 8 or marked Won.',
  },
};

const getStageInfo = (stageName = '', order = 1) => {
  if (STAGE_DETAILS[order]) {
    return {
      ...STAGE_DETAILS[order],
      title: STAGE_DETAILS[order].title,
    };
  }
  return {
    title: `Stage ${order}: ${stageName}`,
    summary: `Prospective buyer opportunity currently advancing through ${stageName}.`,
    calculation: `Count of active pipeline leads situated in ${stageName}.`,
  };
};

export default function CrmDashboardPage() {
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
  const funnel = data?.funnel || [];
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
      status: 'neutral',
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
      status: (kpis.qualificationRate || 0) >= 30 ? 'positive' : 'neutral',
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
      status: 'positive',
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
      status: 'positive',
      info: {
        title: 'Cumulative Partner Yardage (Gaj)',
        summary: 'Aggregate plot land and built-up area sold through channel partner network.',
        calculation: 'Sum of totalYards across all active registered brokers',
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

      {/* KPI Strip */}
      <WorkKpiStrip items={kpiItems} />

      {/* 8-Stage Conversion Funnel Visual */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs w-full space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">8-Stage Sales Pipeline Funnel</h2>
            <MetricInfoBadge
              title="8-Stage Sales Pipeline Funnel"
              summary="Visual milestone progression tracking prospective property buyers across 8 structured sales stages from initial inquiry to final registry."
              calculation="Count of active leads currently situated in each pipeline milestone (Contact Initiated → Final Registry)."
            />
          </div>
          <Link
            to="/crm/leads"
            className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
          >
            <span>View All Leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {funnel.map((item, idx) => {
            const stageOrder = item.order || idx + 1;
            const stageInfo = getStageInfo(item.stage, stageOrder);

            return (
              <div
                key={item.stage || idx}
                className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center flex flex-col justify-between hover:bg-blue-50/50 hover:border-blue-200 transition-colors relative"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      STAGE {stageOrder}
                    </span>
                    <MetricInfoBadge
                      title={stageInfo.title}
                      summary={stageInfo.summary}
                      calculation={stageInfo.calculation}
                      className="shrink-0"
                    />
                  </div>
                  <div
                    className="text-[11px] font-semibold text-slate-800 line-clamp-2 mt-0.5 min-h-[32px] text-center"
                    title={item.stage}
                  >
                    {item.stage}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200/60">
                  <span className="text-base font-extrabold text-blue-700">{item.count}</span>
                  <span className="text-[10px] text-slate-400 block">Active</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center text-rose-600 mb-1">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="text-lg font-bold text-rose-900">{temperatures.hot}</div>
                <div className="text-[10px] font-semibold text-rose-700 uppercase tracking-wide">
                  Hot (High Intent)
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center text-amber-600 mb-1">
                  <ThermometerSun className="w-4 h-4" />
                </div>
                <div className="text-lg font-bold text-amber-900">{temperatures.warm}</div>
                <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
                  Warm (Evaluating)
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center text-blue-600 mb-1">
                  <Snowflake className="w-4 h-4" />
                </div>
                <div className="text-lg font-bold text-blue-900">{temperatures.cold}</div>
                <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">
                  Cold (Low Fit)
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
                to="/crm/followups"
                className="bg-red-50 border border-red-200 rounded-xl p-3 text-center hover:bg-red-100/70 transition-colors"
              >
                <div className="text-lg font-bold text-red-900">
                  {operations.overdueReminders || 0}
                </div>
                <div className="text-[10px] font-semibold text-red-700 uppercase tracking-wide mt-0.5">
                  Overdue Tasks
                </div>
              </Link>

              <Link
                to="/crm/followups"
                className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center hover:bg-emerald-100/70 transition-colors"
              >
                <div className="text-lg font-bold text-emerald-900">
                  {operations.todayReminders || 0}
                </div>
                <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mt-0.5">
                  Due Today
                </div>
              </Link>

              <Link
                to="/crm/special-followups"
                className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center hover:bg-amber-100/70 transition-colors"
              >
                <div className="text-lg font-bold text-amber-900">
                  {operations.specialFollowups || 0}
                </div>
                <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mt-0.5">
                  Starred VIP
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
