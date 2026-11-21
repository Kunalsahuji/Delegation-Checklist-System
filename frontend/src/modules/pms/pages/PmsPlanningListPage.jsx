import React, { useState, useEffect } from 'react';
import {
  Compass,
  Layout,
  GitFork,
  Trees,
  Home,
  Calculator,
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
  AlertCircle,
  FileText,
} from 'lucide-react';
import { pmsPlanningApi } from '../../../api/pmsPlanningApi';
import ProjectPlanningWorkspaceModal from '../components/ProjectPlanningWorkspaceModal';

function formatCurrency(val) {
  if (!val || isNaN(val)) return '₹0';
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

const STATUS_CONFIG = {
  survey: { label: 'Survey', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  masterLayout: { label: 'Master Layout', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  roadPlanning: { label: 'Road Planning', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  amenities: { label: 'Amenities', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  plotVillaPlanning: { label: 'Plot/Villa Planning', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  budget: { label: 'Budgeting', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  managementApproval: { label: 'Approval Pending', color: 'bg-yellow-50 text-yellow-800 border-yellow-300' },
  pendingGovernmentApproval: { label: 'Govt NOC Pending', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  approved: { label: 'Approved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function PmsPlanningListPage() {
  const [kpis, setKpis] = useState({
    total: 0,
    inPlanning: 0,
    approvalPending: 0,
    approved: 0,
    totalEstimatedDevelopmentBudget: 0,
  });

  const [plans, setPlans] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedPlanId, setSelectedPlanId] = useState(null);

  useEffect(() => {
    fetchKPIs();
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [page, search, statusFilter]);

  const fetchKPIs = async () => {
    try {
      const res = await pmsPlanningApi.getKPIs();
      if (res?.success) {
        setKpis(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch planning KPIs:', err);
    }
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await pmsPlanningApi.listPlans({
        page,
        limit,
        search,
        status: statusFilter,
      });
      if (res?.success) {
        setPlans(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch planning records:', err);
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
              Planning & Approvals
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Project Planning & Sanctions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Architectural master layout, internal road zoning, amenity schedules, and civil development budgets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchKPIs();
              fetchPlans();
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
              <Layout className="w-3.5 h-3.5 text-brand-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Plans</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Total registered project planning & design master records.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">All planning records</div>
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
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">In Planning</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Projects actively progressing through survey, layout, roads, amenities, or budget.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-blue-700 mt-1">{kpis.inPlanning}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Design stages active</div>
        </div>

        {/* KPI 3 */}
        <div
          onClick={() => handleKpiFilter('managementApproval')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            statusFilter === 'managementApproval'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Awaiting Sanction</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                6 design sections completed and awaiting formal management sign-off.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-amber-700 mt-1">{kpis.approvalPending}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Gate review queue</div>
        </div>

        {/* KPI 4 */}
        <div
          onClick={() => handleKpiFilter('approved')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            statusFilter === 'approved'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Approved Plans</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Fully sanctioned plans cleared for contractor selection and site start.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">{kpis.approved}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sanctioned & advanced</div>
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
              <Calculator className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Dev Budget</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Cumulative estimated civil infrastructure development budget across projects. Click to filter budgeted plans.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-purple-700 mt-1">
            {formatCurrency(kpis.totalEstimatedDevelopmentBudget)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Civil outlay estimate</div>
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
            placeholder="Search plan code, project, or architect..."
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
            <option value="survey">Stage: Survey</option>
            <option value="masterLayout">Stage: Master Layout</option>
            <option value="roadPlanning">Stage: Roads & Drainage</option>
            <option value="amenities">Stage: Amenities</option>
            <option value="plotVillaPlanning">Stage: Plot/Villa Typology</option>
            <option value="budget">Stage: Dev Budgeting</option>
            <option value="hasBudget">With Development Budget</option>
            <option value="managementApproval">Awaiting Management Sanction</option>
            <option value="approved">Approved</option>
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
                <th className="py-3 px-4">Land Area</th>
                <th className="py-3 px-4">Master Layout & Architect</th>
                <th className="py-3 px-4">Plots / Villas</th>
                <th className="py-3 px-4">Estimated Dev Budget</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading project planning records...</span>
                    </div>
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No project planning records found matching criteria.
                  </td>
                </tr>
              ) : (
                plans.map((p) => {
                  const statusConf = STATUS_CONFIG[p.status] || {
                    label: p.status,
                    color: 'bg-slate-100 text-slate-700 border-slate-200',
                  };
                  return (
                    <tr
                      key={p._id}
                      onClick={() => setSelectedPlanId(p._id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/60">
                            {p.code}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 hover:text-brand-600">
                              {p.project?.name || 'Unnamed Project'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              Type: <span className="capitalize text-slate-600">{p.projectType}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {p.landAreaSnapshot?.value
                            ? `${Number(p.landAreaSnapshot.value).toLocaleString()} ${p.landAreaSnapshot.unit || 'sqyd'}`
                            : '—'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.plot?.plotNumber ? `Plot: ${p.plot.plotNumber}` : 'Base land plot'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {p.masterLayout?.layoutNumber ? `Layout ${p.masterLayout.layoutNumber}` : 'Layout in draft'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.masterLayout?.architect || 'Architect pending'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {p.plotVillaPlanning?.totalPlots || 0} Plots
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.plotVillaPlanning?.totalVillas || 0} Villas planned
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {formatCurrency(p.budget?.totalEstimatedCost)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.budget?.landDevelopmentCost ? `Earthwork: ${formatCurrency(p.budget.landDevelopmentCost)}` : 'Civil estimate'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold whitespace-nowrap text-slate-700">{statusConf.label}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlanId(p._id);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200/80 rounded-md transition-colors cursor-pointer"
                        >
                          Workspace
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
            <span className="font-semibold text-slate-800">{totalPages}</span> ({total} project planning records)
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

      {/* Stage 4 Planning Workspace Modal */}
      {selectedPlanId && (
        <ProjectPlanningWorkspaceModal
          planId={selectedPlanId}
          onClose={() => setSelectedPlanId(null)}
          onRefresh={() => {
            fetchKPIs();
            fetchPlans();
          }}
        />
      )}
    </div>
  );
}
