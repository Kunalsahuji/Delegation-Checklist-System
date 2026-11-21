import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  Clock,
  Search,
  Filter,
  RotateCw,
  Info,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import { pmsFinanceApi } from '../../../api/pmsFinanceApi';
import FinanceWorkspaceModal from '../components/FinanceWorkspaceModal';

function formatCurrency(val) {
  if (!val || isNaN(val)) return '₹0';
  const num = Number(val);
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  return `${sign}₹${abs.toLocaleString('en-IN')}`;
}

const STATUS_CONFIG = {
  activeAccounting: { label: 'Active Accounting', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  billingInProgress: { label: 'Billing In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  paymentReview: { label: 'Payment Review', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  approvalPending: { label: 'Awaiting Sign-off', color: 'bg-yellow-50 text-yellow-800 border-yellow-300' },
  approved: { label: 'Certified & Settled', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  settled: { label: 'Fully Settled', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export default function PmsFinanceListPage() {
  const [kpis, setKpis] = useState({
    total: 0,
    totalDisbursements: 0,
    pendingDisbursements: 0,
    totalRaCertified: 0,
    approved: 0,
    activeAccounting: 0,
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
      const res = await pmsFinanceApi.getKPIs();
      if (res?.success) {
        setKpis(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch finance KPIs:', err);
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

      if (statusFilter === 'hasOutflow') {
        params.hasOutflow = true;
      } else if (statusFilter === 'pendingClearance') {
        params.pendingClearance = true;
      } else if (statusFilter === 'hasRaBills') {
        params.hasRaBills = true;
      } else if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const res = await pmsFinanceApi.listRecords(params);
      if (res?.success) {
        const payload = res.data;
        setRecords(payload.records || []);
        setTotal(payload.pagination?.total || 0);
        setTotalPages(payload.pagination?.totalPages || payload.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch finance records:', err);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              Finance & Cost Management
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Finance & Contractor RA Billing Engine</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Budget vs actual realizations, vendor invoice registers, contractor Running Account (RA) billing, and P&L accounting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchKPIs();
              fetchRecords();
            }}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5 Interactive 3-Liner KPI Cards with (i) Tooltips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* KPI 1 */}
        <div
          onClick={() => handleKpiFilter('all')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] flex flex-col justify-between ${
            statusFilter === 'all'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tracked Projects</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Total projects under active finance and contractor billing accounting. Click to clear filters.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">All finance ledgers</div>
        </div>

        {/* KPI 2 */}
        <div
          onClick={() => handleKpiFilter('hasOutflow')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] flex flex-col justify-between ${
            statusFilter === 'hasOutflow'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Gross Paid Out</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Cumulative capital disbursements paid out to material vendors and civil contractors.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-blue-700 mt-1">
            {formatCurrency(kpis.totalDisbursements)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Settled payouts</div>
        </div>

        {/* KPI 3 */}
        <div
          onClick={() => handleKpiFilter('pendingClearance')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] flex flex-col justify-between ${
            statusFilter === 'pendingClearance'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending Clearances</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Verified vendor bills and contractor RA claims pending finance payment clearance.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-amber-700 mt-1">
            {formatCurrency(kpis.pendingDisbursements)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Pending payouts</div>
        </div>

        {/* KPI 4 */}
        <div
          onClick={() => handleKpiFilter('approved')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] flex flex-col justify-between ${
            statusFilter === 'approved'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Certified & Settled</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Financial ledgers verified and approved. Projects advanced to Stage 12 (Handover).
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">{kpis.approved}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Stage 12 advanced</div>
        </div>

        {/* KPI 5 (CLICKABLE & ACCESSIBLE!) */}
        <div
          onClick={() => handleKpiFilter('hasRaBills')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] flex flex-col justify-between ${
            statusFilter === 'hasRaBills'
              ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contractor RA Billings</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Cumulative certified value of contractor Running Account (RA) bills. Click to filter projects with active billings.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-purple-700 mt-1">
            {formatCurrency(kpis.totalRaCertified)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Certified work bills</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by project name or code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => handleKpiFilter(e.target.value)}
              className="border border-slate-200 rounded-lg text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value="all">All Ledgers</option>
              <option value="activeAccounting">Active Accounting</option>
              <option value="hasOutflow">Has Capital Outflow</option>
              <option value="pendingClearance">Pending Clearances</option>
              <option value="approved">Certified & Approved</option>
              <option value="hasRaBills">Has Contractor RA Bills</option>
            </select>
          </div>
        </div>
      </div>

      {/* Default Table View */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Project & Code</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Budget Revenue</th>
                <th className="py-3 px-4 text-right">Actual Collected</th>
                <th className="py-3 px-4 text-right">Disbursed (Paid)</th>
                <th className="py-3 px-4 text-right">Pending Payouts</th>
                <th className="py-3 px-4 text-right">RA Certified</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    <Clock className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    Loading finance & billing ledgers...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    No finance records match the selected filter.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.activeAccounting;
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{r.project?.name || 'Unnamed Project'}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {r.code} • Stage {r.project?.stageOrder || 11}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {r.project?.location || 'Jaipur'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700 font-medium">
                        {formatCurrency(r.budgetVsActual?.budgetedRevenue)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {formatCurrency(r.budgetVsActual?.actualRevenueCollected)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {formatCurrency(r.totalDisbursements)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-700">
                        {formatCurrency(r.pendingDisbursements)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-purple-700">
                        {formatCurrency(r.totalRaCertifiedAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs font-semibold whitespace-nowrap text-slate-700">
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedRecordId(r._id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors cursor-pointer"
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
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing page <strong className="text-slate-700">{page}</strong> of{' '}
            <strong className="text-slate-700">{totalPages}</strong> (
            <strong className="text-slate-700">{total}</strong> finance accounts)
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 border border-slate-200 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 border border-slate-200 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Modal */}
      {selectedRecordId && (
        <FinanceWorkspaceModal
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
