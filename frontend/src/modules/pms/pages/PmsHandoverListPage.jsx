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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* KPI 1 */}
        <div
          onClick={() => handleKpiFilter('all')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] flex flex-col justify-between ${
            statusFilter === 'all'
              ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Registers</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Total registered residential and commercial handover portfolios.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Lifetime Handover Tracking</div>
        </div>

        {/* KPI 2 */}
        <div
          onClick={() => handleKpiFilter('possessionCompleted')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] flex flex-col justify-between ${
            statusFilter === 'possessionCompleted'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Possession Delivered</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Units where possession letter signed and keys handed over to buyer.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-blue-700 mt-1">{kpis.possessionCompleted}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Keys & Letters Dispatched</div>
        </div>

        {/* KPI 3 */}
        <div
          onClick={() => handleKpiFilter('zeroSnagVerified')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] flex flex-col justify-between ${
            statusFilter === 'zeroSnagVerified'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Zero-Snag Verified</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Units with 100% snag rectification and zero-snag certificate issued.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">{kpis.zeroSnagVerified}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Zero Open Punch-list Items</div>
        </div>

        {/* KPI 4 */}
        <div
          onClick={() => handleKpiFilter('hasPendingSnags')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] flex flex-col justify-between ${
            statusFilter === 'hasPendingSnags'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending Snags Backlog</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Total open snag backlog awaiting engineering touch-up clearance.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-amber-700 mt-1">{kpis.pendingSnagsTotal}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Open Touch-up Items</div>
        </div>

        {/* KPI 5 */}
        <div
          onClick={() => handleKpiFilter('inspectionsCleared')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] flex flex-col justify-between ${
            statusFilter === 'inspectionsCleared'
              ? 'bg-cyan-50/70 border-cyan-300 ring-2 ring-cyan-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5 text-cyan-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Final Inspections Cleared</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Units with structural, MEP, and architectural finishing sign-offs completed.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-cyan-700 mt-1">{kpis.inspectionsCleared}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Structural & MEP Certified</div>
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
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.inspectionsCleared ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Cleared
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                            <Clock className="w-3.5 h-3.5" />
                            Pending Sign-off
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.zeroSnagVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Zero-Snag Certified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                            <Clock className="w-3.5 h-3.5" />
                            {item.pendingSnagsCount} Open Snags
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.deepCleaning?.allAreasCleaned ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <Sparkles className="w-3.5 h-3.5" />
                            Deep Cleaned
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-500">
                            In Detailing
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.possessionCompleted ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                            <KeyRound className="w-3.5 h-3.5" />
                            Possession Done
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">
                            Pre-Possession
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-xs font-semibold text-slate-800">
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedRecordId(item._id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <span>Workspace</span>
                          <ArrowRight className="w-3.5 h-3.5" />
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
