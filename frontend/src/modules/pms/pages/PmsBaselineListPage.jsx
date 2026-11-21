import React, { useState, useEffect } from 'react';
import {
  Package,
  Users,
  Calendar,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RotateCw,
  Info,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowRight,
  Lock,
  Unlock,
  IndianRupee,
} from 'lucide-react';
import { pmsBaselineApi } from '../../../api/pmsBaselineApi';
import BaselinePlanningWorkspaceModal from '../components/BaselinePlanningWorkspaceModal';

function formatCurrency(val) {
  if (!val || isNaN(val)) return '₹0';
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

const STATUS_CONFIG = {
  plannedMaterial: { label: 'Material Plan', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  plannedLabour: { label: 'Labour Plan', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  plannedTimeline: { label: 'Timeline Plan', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  plannedCashflow: { label: 'Cashflow Plan', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  baselineReview: { label: 'Awaiting Lock', color: 'bg-yellow-50 text-yellow-800 border-yellow-300' },
  locked: { label: 'Baseline Locked', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function PmsBaselineListPage() {
  const [kpis, setKpis] = useState({
    total: 0,
    inPlanning: 0,
    awaitingLock: 0,
    lockedCount: 0,
    totalBaselineBudget: 0,
    totalMaterialBudget: 0,
    totalLabourBudget: 0,
  });

  const [baselines, setBaselines] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedBaselineId, setSelectedBaselineId] = useState(null);

  useEffect(() => {
    fetchKPIs();
  }, []);

  useEffect(() => {
    fetchBaselines();
  }, [page, search, statusFilter]);

  const fetchKPIs = async () => {
    try {
      const res = await pmsBaselineApi.getKPIs();
      if (res?.success) {
        setKpis(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch baseline KPIs:', err);
    }
  };

  const fetchBaselines = async () => {
    setLoading(true);
    try {
      const res = await pmsBaselineApi.listBaselines({
        page,
        limit,
        search,
        status: statusFilter,
      });
      if (res?.success) {
        setBaselines(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch baselines:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKpiFilter = (filterKey) => {
    setStatusFilter(filterKey);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 font-bold border border-brand-200">
              Baseline Planning & Lock
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Baseline Planning & Governance Lock</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bill of materials, gang headcounts, milestone timelines, cashflows, and executive baseline freeze.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchKPIs();
              fetchBaselines();
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
              ? 'bg-brand-50/70 border-brand-300 ring-2 ring-brand-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Baselines</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Total registered project baseline master plans.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">All baseline records</div>
        </div>

        {/* KPI 2 */}
        <div
          onClick={() => handleKpiFilter('inPlanning')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            statusFilter === 'inPlanning'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">In Planning</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Projects currently formulating material BOM, labor gang, timeline, or cashflows.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-blue-700 mt-1">{kpis.inPlanning}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Planning active</div>
        </div>

        {/* KPI 3 */}
        <div
          onClick={() => handleKpiFilter('baselineReview')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            statusFilter === 'baselineReview'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Awaiting Lock</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                All 4 planning sections completed and submitted for executive baseline lock.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-amber-700 mt-1">{kpis.awaitingLock}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Gate review queue</div>
        </div>

        {/* KPI 4 */}
        <div
          onClick={() => handleKpiFilter('locked')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            statusFilter === 'locked'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Frozen & Locked</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Baselines officially frozen. Advanced to Stage 7 for civil execution.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">{kpis.lockedCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Stage 7 advanced</div>
        </div>

        {/* KPI 5 */}
        <div
          onClick={() => handleKpiFilter(statusFilter === 'hasBudget' ? 'all' : 'hasBudget')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            statusFilter === 'hasBudget'
              ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Baseline Budget</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Cumulative baseline budget allocation across all projects. Click to filter projects with baseline budget.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-purple-700 mt-1">
            {formatCurrency(kpis.totalBaselineBudget)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Target capital outlay</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search baseline code or project..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-brand-500 bg-white"
          >
            <option value="all">All Stages & Statuses</option>
            <option value="inPlanning">In Planning (Active)</option>
            <option value="plannedMaterial">Step: Planned Material</option>
            <option value="plannedLabour">Step: Planned Labour</option>
            <option value="plannedTimeline">Step: Planned Timeline</option>
            <option value="plannedCashflow">Step: Planned Cashflow</option>
            <option value="baselineReview">Awaiting Executive Lock</option>
            <option value="hasBudget">With Baseline Budget</option>
            <option value="locked">Baseline Frozen & Locked</option>
          </select>

          {(search || statusFilter !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-slate-800 underline px-2 py-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Default Table View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Code & Project</th>
                <th className="py-3 px-4">Material BOM Budget</th>
                <th className="py-3 px-4">Labour Gang Budget</th>
                <th className="py-3 px-4">Project Schedule</th>
                <th className="py-3 px-4">Total Baseline Budget</th>
                <th className="py-3 px-4">Governance Lock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading baseline planning records...</span>
                    </div>
                  </td>
                </tr>
              ) : baselines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No baseline planning records found matching criteria.
                  </td>
                </tr>
              ) : (
                baselines.map((b) => {
                  const isLocked = b.baselineLock?.isLocked;
                  const statusConf = STATUS_CONFIG[b.status] || {
                    label: b.status,
                    color: 'bg-slate-100 text-slate-700 border-slate-200',
                  };

                  return (
                    <tr
                      key={b._id}
                      onClick={() => setSelectedBaselineId(b._id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/60">
                            {b.code}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 hover:text-brand-600">
                              {b.project?.name || 'Unnamed Project'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              Stage {b.project?.stageOrder}/13: {b.project?.currentStageName || 'Baseline Lock'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">
                          {formatCurrency(b.plannedMaterial?.totalMaterialCost)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {b.plannedMaterial?.items?.length || 0} scheduled heads
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">
                          {formatCurrency(b.plannedLabour?.totalLabourCost)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {b.plannedLabour?.items?.length || 0} trade gangs
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {b.plannedTimeline?.totalDurationDays ? `${b.plannedTimeline.totalDurationDays} days` : '—'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {b.plannedTimeline?.plannedStartDate
                            ? `${new Date(b.plannedTimeline.plannedStartDate).toLocaleDateString()} to ${new Date(b.plannedTimeline.plannedCompletionDate).toLocaleDateString()}`
                            : 'Dates open'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-black text-emerald-800">
                          {formatCurrency(b.baselineLock?.totalBaselineBudget)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Cashflow: {formatCurrency(b.plannedCashflow?.totalCashflowPlanned)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap text-slate-700">
                            <Lock className="w-3 h-3 text-emerald-600" />
                            <span>LOCKED</span>
                          </span>
                        ) : (
                          <span className="text-xs font-semibold whitespace-nowrap text-slate-700">
                            {statusConf.label}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBaselineId(b._id);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors cursor-pointer"
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
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
          <div>
            Showing page <span className="font-semibold text-slate-800">{page}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalPages}</span> ({total} baseline planning records)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 border border-slate-200 rounded hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 border border-slate-200 rounded hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stage 6 Workspace Modal */}
      {selectedBaselineId && (
        <BaselinePlanningWorkspaceModal
          baselineId={selectedBaselineId}
          onClose={() => setSelectedBaselineId(null)}
          onRefresh={() => {
            fetchKPIs();
            fetchBaselines();
          }}
        />
      )}
    </div>
  );
}
