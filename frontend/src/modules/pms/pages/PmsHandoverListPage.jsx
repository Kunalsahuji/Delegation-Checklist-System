import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Sparkles,
  ClipboardCheck,
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
  UserCheck,
  Star,
} from 'lucide-react';
import { pmsHandoverApi } from '../../../api/pmsHandoverApi';
import HandoverWorkspaceModal from '../components/HandoverWorkspaceModal';

const STATUS_CONFIG = {
  preHandoverInspection: { label: 'Pre-Handover Inspection', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  deSnaggingInProgress: { label: 'De-Snagging In Progress', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  cleaningVerification: { label: 'Cleaning Verification', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  readyForHandover: { label: 'Ready for Handover', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  possessionCompleted: { label: 'Possession Delivered', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  approvalPending: { label: 'Awaiting Sign-off', color: 'bg-yellow-50 text-yellow-800 border-yellow-300' },
  approved: { label: 'Certified & Approved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected / Action Required', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function PmsHandoverListPage() {
  const [kpis, setKpis] = useState({
    total: 0,
    possessionCompleted: 0,
    zeroSnagVerified: 0,
    pendingSnagsTotal: 0,
    inspectionsCleared: 0,
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
      const res = await pmsHandoverApi.getKPIs();
      if (res?.success) {
        setKpis(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch handover KPIs:', err);
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

      if (statusFilter === 'possessionCompleted') {
        params.possessionCompleted = true;
      } else if (statusFilter === 'zeroSnagVerified') {
        params.zeroSnagVerified = true;
      } else if (statusFilter === 'hasPendingSnags') {
        params.hasPendingSnags = true;
      } else if (statusFilter === 'inspectionsCleared') {
        params.inspectionsCleared = true;
      } else if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const res = await pmsHandoverApi.listRecords(params);
      if (res?.success) {
        const payload = res.data;
        setRecords(payload.records || []);
        setTotal(payload.pagination?.total || 0);
        setTotalPages(payload.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch handover records:', err);
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
              Handover & Possession Management
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            End-to-end unit completion, final inspection, zero-snag certification, deep cleaning, and customer possession clearance.
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
        {/* KPI 1: Total Handovers */}
        <div
          onClick={() => handleKpiFilter('all')}
          className={`p-4 bg-white rounded-xl border transition-all cursor-pointer group relative ${
            statusFilter === 'all'
              ? 'border-teal-500 ring-2 ring-teal-500 shadow-md'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Registers
            </span>
            <div className="flex items-center gap-1.5">
              <div
                title="Total registered residential and commercial handover portfolios"
                className="text-slate-400 hover:text-slate-600 cursor-help"
              >
                <Info className="w-3.5 h-3.5" />
              </div>
              <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                <KeyRound className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {kpis.total}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Lifetime Handover Tracking
          </p>
        </div>

        {/* KPI 2: Possession Delivered */}
        <div
          onClick={() => handleKpiFilter('possessionCompleted')}
          className={`p-4 bg-white rounded-xl border transition-all cursor-pointer group relative ${
            statusFilter === 'possessionCompleted'
              ? 'border-blue-500 ring-2 ring-blue-500 shadow-md'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Possession Delivered
            </span>
            <div className="flex items-center gap-1.5">
              <div
                title="Units where possession letter signed and keys handed over to buyer"
                className="text-slate-400 hover:text-slate-600 cursor-help"
              >
                <Info className="w-3.5 h-3.5" />
              </div>
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            {kpis.possessionCompleted}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Keys & Letters Dispatched
          </p>
        </div>

        {/* KPI 3: Zero-Snag Verified */}
        <div
          onClick={() => handleKpiFilter('zeroSnagVerified')}
          className={`p-4 bg-white rounded-xl border transition-all cursor-pointer group relative ${
            statusFilter === 'zeroSnagVerified'
              ? 'border-emerald-500 ring-2 ring-emerald-500 shadow-md'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Zero-Snag Verified
            </span>
            <div className="flex items-center gap-1.5">
              <div
                title="Units with 100% snag rectification and zero-snag certificate issued"
                className="text-slate-400 hover:text-slate-600 cursor-help"
              >
                <Info className="w-3.5 h-3.5" />
              </div>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {kpis.zeroSnagVerified}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Zero Open Punch-list Items
          </p>
        </div>

        {/* KPI 4: Pending Snag Backlog */}
        <div
          onClick={() => handleKpiFilter('hasPendingSnags')}
          className={`p-4 bg-white rounded-xl border transition-all cursor-pointer group relative ${
            statusFilter === 'hasPendingSnags'
              ? 'border-amber-500 ring-2 ring-amber-500 shadow-md'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Pending Snags Backlog
            </span>
            <div className="flex items-center gap-1.5">
              <div
                title="Total open snag backlog awaiting engineering touch-up clearance"
                className="text-slate-400 hover:text-slate-600 cursor-help"
              >
                <Info className="w-3.5 h-3.5" />
              </div>
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            {kpis.pendingSnagsTotal}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Open Touch-up Items
          </p>
        </div>

        {/* KPI 5: Final Inspections Cleared (Clickable 5th KPI Card) */}
        <div
          onClick={() => handleKpiFilter('inspectionsCleared')}
          className={`p-4 bg-white rounded-xl border transition-all cursor-pointer group relative ${
            statusFilter === 'inspectionsCleared'
              ? 'border-cyan-500 ring-2 ring-cyan-500 shadow-md'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-700 uppercase tracking-wider">
              Final Inspections Cleared
            </span>
            <div className="flex items-center gap-1.5">
              <div
                title="Units with structural, MEP, and architectural finishing sign-offs completed"
                className="text-slate-400 hover:text-slate-600 cursor-help"
              >
                <Info className="w-3.5 h-3.5" />
              </div>
              <div className="w-7 h-7 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600">
                <ClipboardCheck className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-700 mt-2">
            {kpis.inspectionsCleared}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Structural & MEP Certified
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
            placeholder="Search by code, project, customer, or unit..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="all">All Handovers</option>
            <option value="possessionCompleted">Possession Completed</option>
            <option value="zeroSnagVerified">Zero-Snag Verified</option>
            <option value="hasPendingSnags">With Pending Snags</option>
            <option value="inspectionsCleared">Inspections Cleared</option>
            <option value="preHandoverInspection">Pre-Handover Inspection</option>
            <option value="deSnaggingInProgress">De-Snagging In Progress</option>
            <option value="cleaningVerification">Cleaning Verification</option>
            <option value="readyForHandover">Ready for Handover</option>
            <option value="approvalPending">Awaiting Sign-off</option>
            <option value="approved">Approved & Certified</option>
          </select>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Handover Code</th>
                <th className="py-3 px-4">Project & Location</th>
                <th className="py-3 px-4">Customer & Unit</th>
                <th className="py-3 px-4">Final Inspection</th>
                <th className="py-3 px-4">Snag Status</th>
                <th className="py-3 px-4">Deep Cleaning</th>
                <th className="py-3 px-4">Possession & Keys</th>
                <th className="py-3 px-4">Governance Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs">Loading handover ledgers...</p>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <KeyRound className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-700">No handover registers found</p>
                      <p className="text-xs text-slate-400">
                        {search || statusFilter !== 'all'
                          ? 'Try resetting the search filters above.'
                          : 'Projects advancing through Stage 11 Finance will automatically populate here.'}
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
                        <div className="font-bold text-slate-900">{item.code}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.project?.name || 'Project'}</div>
                        <div className="text-[11px] text-slate-500">
                          {item.project?.code} • {item.project?.locality || item.project?.city || 'Site'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {item.customerHandover?.customerName || 'Allottee TBD'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.customerHandover?.unitNumber || 'Unit General'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.inspectionsCleared ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Cleared
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Pending Sign-off
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.zeroSnagVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" />
                            Zero-Snag Certified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Clock className="w-3 h-3" />
                            {item.pendingSnagsCount} Open Snags
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.deepCleaning?.allAreasCleaned ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Sparkles className="w-3 h-3 text-emerald-500" />
                            Deep Cleaned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            In Detailing
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.possessionCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            <KeyRound className="w-3 h-3" />
                            Possession Done
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Pre-Possession
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedRecordId(item._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors cursor-pointer"
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
            Showing page {page} of {totalPages} ({total} handover registers)
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
        <HandoverWorkspaceModal
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
