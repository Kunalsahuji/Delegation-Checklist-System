import React, { useState, useEffect } from 'react';
import {
  Activity,
  TrendingDown,
  TrendingUp,
  Clock,
  Calendar,
  IndianRupee,
  Search,
  Filter,
  RotateCw,
  Info,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Target,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { pmsControlApi } from '../../../api/pmsControlApi';
import ProjectControlWorkspaceModal from '../components/ProjectControlWorkspaceModal';

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
  monitoring: { label: 'Active Monitoring', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  varianceIdentified: { label: 'Variance Identified', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  mitigationInProgress: { label: 'Mitigation Active', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  approvalPending: { label: 'Awaiting Sign-off', color: 'bg-yellow-50 text-yellow-800 border-yellow-300' },
  approved: { label: 'Certified & Approved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export default function PmsProjectControlListPage() {
  const [kpis, setKpis] = useState({
    total: 0,
    withinBudget: 0,
    costOverrun: 0,
    scheduleDelayed: 0,
    totalCostVariance: 0,
    approved: 0,
    avgCpi: 1.0,
    avgSpi: 1.0,
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
      const res = await pmsControlApi.getKPIs();
      if (res?.success) {
        setKpis(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch project control KPIs:', err);
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

      if (statusFilter === 'withinBudget') {
        params.withinBudget = true;
      } else if (statusFilter === 'costOverrun') {
        params.costOverrun = true;
      } else if (statusFilter === 'scheduleDelayed') {
        params.scheduleDelayed = true;
      } else if (statusFilter === 'hasVariance') {
        params.hasVariance = true;
      } else if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const res = await pmsControlApi.listRecords(params);
      if (res?.success) {
        const payload = res.data;
        setRecords(payload.records || []);
        setTotal(payload.pagination?.total || 0);
        setTotalPages(payload.pagination?.totalPages || payload.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch project control records:', err);
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
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              Project Control & Variance
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Project Control & Variance Engine</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Material variance, labour efficiency, schedule slippage, CPI/SPI performance indices, and cost governance.
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
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            statusFilter === 'all'
              ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tracked Projects</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Total projects under active variance & financial governance tracking. Click to clear filters.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">All monitored sites</div>
        </div>

        {/* KPI 2 */}
        <div
          onClick={() => handleKpiFilter('withinBudget')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            statusFilter === 'withinBudget'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Within Budget</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Projects executing within or under locked baseline budget limits (CPI &gt;= 0.95).
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">{kpis.withinBudget}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Healthy burn rate</div>
        </div>

        {/* KPI 3 */}
        <div
          onClick={() => handleKpiFilter('costOverrun')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            statusFilter === 'costOverrun'
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cost Overrun</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Projects exceeding baseline material, labour, or equipment expenditure baselines.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-rose-700 mt-1">{kpis.costOverrun}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Budget overrun alert</div>
        </div>

        {/* KPI 4 */}
        <div
          onClick={() => handleKpiFilter('scheduleDelayed')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            statusFilter === 'scheduleDelayed'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Schedule Delayed</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Projects with critical milestone slippages requiring recovery acceleration.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-amber-700 mt-1">{kpis.scheduleDelayed}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Timeline slippage</div>
        </div>

        {/* KPI 5 (CLICKABLE & ACCESSIBLE!) */}
        <div
          onClick={() => handleKpiFilter(statusFilter === 'hasVariance' ? 'all' : 'hasVariance')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            statusFilter === 'hasVariance'
              ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Cost Variance</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Cumulative net financial variance against locked baselines across all active sites. Click to filter projects with active variance reports.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-purple-700 mt-1">
            {formatCurrency(kpis.totalCostVariance)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Net baseline variance</div>
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
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => handleKpiFilter(e.target.value)}
              className="border border-slate-200 rounded-lg text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              <option value="all">All Projects</option>
              <option value="withinBudget">Within Budget</option>
              <option value="costOverrun">Cost Overrun</option>
              <option value="scheduleDelayed">Schedule Delayed</option>
              <option value="hasVariance">Has Active Variance</option>
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
                <th className="py-3 px-4 text-center">CPI Index</th>
                <th className="py-3 px-4 text-center">SPI Index</th>
                <th className="py-3 px-4 text-right">Baseline Budget</th>
                <th className="py-3 px-4 text-right">Actual Cost To Date</th>
                <th className="py-3 px-4 text-right">Net Variance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    <Clock className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                    Loading project control & variance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    No project control records match the selected filter.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.monitoring;
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{r.project?.name || 'Unnamed Project'}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {r.code} • Stage {r.project?.stageOrder || 10}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {r.project?.location || 'Jaipur'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            (r.cpi || 1) >= 1
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {r.cpi || 1.0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-indigo-700">
                        {r.spi || 1.0}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700 font-medium">
                        {formatCurrency(r.costVariance?.baselineBudgetTotal)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(r.costVariance?.actualCostToDate)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold ${
                          (r.overallCostVariance || 0) <= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {formatCurrency(r.overallCostVariance)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedRecordId(r._id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors cursor-pointer"
                        >
                          Workspace
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
            <strong className="text-slate-700">{total}</strong> project variance ledgers)
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
        <ProjectControlWorkspaceModal
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
