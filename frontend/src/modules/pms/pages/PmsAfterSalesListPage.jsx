import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  ShieldAlert,
  CalendarCheck2,
  Headphones,
  MessageSquareHeart,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RotateCw,
  Info,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Building,
  Star,
  ThumbsUp,
} from 'lucide-react';
import { pmsAfterSalesApi } from '../../../api/pmsAfterSalesApi';
import AfterSalesWorkspaceModal from '../components/AfterSalesWorkspaceModal';

const STATUS_CONFIG = {
  warrantyActive: { label: 'Warranty Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  dlpInProgress: { label: 'DLP In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  routineMaintenance: { label: 'Routine Maintenance', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  auditPending: { label: 'Awaiting Audit Sign-off', color: 'bg-yellow-50 text-yellow-800 border-yellow-300' },
  approved: { label: 'DLP Certified & Matured', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  dlpMatured: { label: 'DLP Fully Matured', color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export default function PmsAfterSalesListPage() {
  const [kpis, setKpis] = useState({
    total: 0,
    activeClaimsTotal: 0,
    completedVisitsTotal: 0,
    resolvedTicketsTotal: 0,
    averageSatisfactionScore: 0,
    approved: 0,
  });

  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedRecordId, setSelectedRecordId] = useState(null);

  useEffect(() => {
    fetchKPIs();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [page, search, statusFilter]);

  const fetchKPIs = async () => {
    try {
      const res = await pmsAfterSalesApi.getKPIs();
      if (res?.success) {
        setKpis(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch after-sales KPIs:', err);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search,
      };

      if (statusFilter === 'hasActiveClaims') {
        params.hasActiveClaims = true;
      } else if (statusFilter === 'amcCompleted') {
        params.amcCompleted = true;
      } else if (statusFilter === 'supportResolved') {
        params.supportResolved = true;
      } else if (statusFilter === 'topRated') {
        params.topRated = true;
      } else if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const res = await pmsAfterSalesApi.listRecords(params);
      if (res?.success) {
        const payload = res.data;
        setRecords(payload.records || []);
        setTotal(payload.pagination?.total || 0);
        setTotalPages(payload.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch after-sales records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKpiFilter = (newFilter) => {
    setStatusFilter(newFilter);
    setPage(1);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              After Sales, Warranty & DLP Management
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-pink-50 text-pink-700 border border-pink-200">
              Stage 13 (Terminal Lifecycle)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Defect Liability Period (DLP) warranty tracking, annual maintenance contracts (AMC), resident support desk, and customer NPS metrics.
          </p>
        </div>

        <button
          onClick={() => {
            fetchKPIs();
            fetchRecords();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 5 Interactive 3-Liner KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* KPI 1: Total Registers */}
        <div
          onClick={() => handleKpiFilter('all')}
          className={`p-4 bg-white rounded-xl border transition-all cursor-pointer group relative ${
            statusFilter === 'all'
              ? 'border-pink-500 ring-2 ring-pink-500 shadow-md'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Portfolios
            </span>
            <div className="flex items-center gap-1.5">
              <div
                title="Total registered projects under active warranty, AMC, and DLP maintenance"
                className="text-slate-400 hover:text-slate-600 cursor-help"
              >
                <Info className="w-3.5 h-3.5" />
              </div>
              <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
                <HeartHandshake className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {kpis.total}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Lifetime Support Tracking
          </p>
        </div>

        {/* KPI 2: Active Claims */}
        <div
          onClick={() => handleKpiFilter('hasActiveClaims')}
          className={`p-4 bg-white rounded-xl border transition-all cursor-pointer group relative ${
            statusFilter === 'hasActiveClaims'
              ? 'border-amber-500 ring-2 ring-amber-500 shadow-md'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Active Warranty Claims
            </span>
            <div className="flex items-center gap-1.5">
              <div
                title="Open warranty claims currently undergoing technician investigation or rectification"
                className="text-slate-400 hover:text-slate-600 cursor-help"
              >
                <Info className="w-3.5 h-3.5" />
              </div>
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            {kpis.activeClaimsTotal}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Open Punch-list Defect Calls
          </p>
        </div>

        {/* KPI 3: AMC Visits Completed */}
        <div
          onClick={() => handleKpiFilter('amcCompleted')}
          className={`p-4 bg-white rounded-xl border transition-all cursor-pointer group relative ${
            statusFilter === 'amcCompleted'
              ? 'border-blue-500 ring-2 ring-blue-500 shadow-md'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              AMC Visits Executed
            </span>
            <div className="flex items-center gap-1.5">
              <div
                title="Preventive maintenance visits executed across HVAC, elevators, and water filtration"
                className="text-slate-400 hover:text-slate-600 cursor-help"
              >
                <Info className="w-3.5 h-3.5" />
              </div>
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            {kpis.completedVisitsTotal}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Preventive Servicing Executed
          </p>
        </div>

        {/* KPI 4: Support Tickets Resolved */}
        <div
          onClick={() => handleKpiFilter('supportResolved')}
          className={`p-4 bg-white rounded-xl border transition-all cursor-pointer group relative ${
            statusFilter === 'supportResolved'
              ? 'border-emerald-500 ring-2 ring-emerald-500 shadow-md'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Support Queries Resolved
            </span>
            <div className="flex items-center gap-1.5">
              <div
                title="Resident helpdesk support and billing queries successfully resolved"
                className="text-slate-400 hover:text-slate-600 cursor-help"
              >
                <Info className="w-3.5 h-3.5" />
              </div>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Headphones className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {kpis.resolvedTicketsTotal}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Resident Helpdesk Queries Closed
          </p>
        </div>

        {/* KPI 5: Customer Satisfaction (Clickable 5th KPI Card) */}
        <div
          onClick={() => handleKpiFilter('topRated')}
          className={`p-4 bg-white rounded-xl border transition-all cursor-pointer group relative ${
            statusFilter === 'topRated'
              ? 'border-purple-500 ring-2 ring-purple-500 shadow-md'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
              Customer Satisfaction
            </span>
            <div className="flex items-center gap-1.5">
              <div
                title="Projects achieving 4.0+ customer satisfaction rating on post-handover survey"
                className="text-slate-400 hover:text-slate-600 cursor-help"
              >
                <Info className="w-3.5 h-3.5" />
              </div>
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Star className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2">
            {kpis.averageSatisfactionScore > 0 ? `${kpis.averageSatisfactionScore} / 5.0` : '5.0 / 5.0'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Top Rated Satisfaction (≥ 4.0)
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by code, project, customer, or claim..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-pink-500 focus:outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="all">All After-Sales Ledgers</option>
            <option value="hasActiveClaims">With Active Claims</option>
            <option value="amcCompleted">AMC Completed</option>
            <option value="supportResolved">Support Resolved</option>
            <option value="topRated">Top Rated (≥ 4.0 Stars)</option>
            <option value="warrantyActive">Warranty Active</option>
            <option value="dlpInProgress">DLP In Progress</option>
            <option value="routineMaintenance">Routine Maintenance</option>
            <option value="auditPending">Awaiting Audit Sign-off</option>
            <option value="approved">DLP Certified & Matured</option>
          </select>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Service Code</th>
                <th className="py-3 px-4">Project & Locality</th>
                <th className="py-3 px-4">Warranty Claims</th>
                <th className="py-3 px-4">AMC Visits</th>
                <th className="py-3 px-4">Resident Support</th>
                <th className="py-3 px-4">Customer NPS</th>
                <th className="py-3 px-4">Governance Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs">Loading after-sales ledgers...</p>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <HeartHandshake className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-700">No after-sales ledgers found</p>
                      <p className="text-xs text-slate-400">
                        {search || statusFilter !== 'all'
                          ? 'Try resetting the search filters above.'
                          : 'Projects advancing through Stage 12 Handover will automatically populate here.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((item) => {
                  const cfg = STATUS_CONFIG[item.status] || {
                    label: item.status,
                    color: 'bg-slate-50 text-slate-700 border-slate-200',
                  };

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedRecordId(item._id)}
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                          {item.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.project?.name || 'Project'}</div>
                        <div className="text-[11px] text-slate-500">
                          {item.project?.code} • {item.project?.locality || item.project?.city || 'Site'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.activeClaimsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <ShieldAlert className="w-3 h-3" />
                            {item.activeClaimsCount} Open Claims
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            All Claims Resolved
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          <CalendarCheck2 className="w-3 h-3" />
                          {item.completedVisitsCount} Visits Executed
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Headphones className="w-3 h-3" />
                          {item.resolvedTicketsCount} Tickets Closed
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="font-bold text-slate-800">
                            {item.averageSatisfactionScore > 0 ? `${item.averageSatisfactionScore}` : '5.0'}
                          </span>
                          <span className="text-[10px] text-slate-400">/ 5.0</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedRecordId(item._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-pink-700 bg-pink-50 border border-pink-200 rounded-lg hover:bg-pink-100 transition-colors cursor-pointer"
                        >
                          <span>Workspace</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Contextual Pagination */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600 font-medium">
            Showing page {page} of {totalPages} ({total} records)
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Modal */}
      {selectedRecordId && (
        <AfterSalesWorkspaceModal
          recordId={selectedRecordId}
          onClose={() => setSelectedRecordId(null)}
          onRefresh={() => {
            fetchKPIs();
            fetchRecords();
          }}
        />
      )}
    </div>
  );
}
