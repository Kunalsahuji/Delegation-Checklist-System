import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  IndianRupee,
  Search,
  Plus,
  RefreshCw,
  LayoutGrid,
  List,
  Eye,
  Edit2,
  Trash2,
  Calculator,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  Scale,
  Info,
} from 'lucide-react';
import WorkKpiStrip from '../../../components/WorkKpiStrip';
import { pmsPlotApi } from '../../../api/pmsPlotApi';
import { pmsProjectApi } from '../../../api/pmsProjectApi';
import { useToast } from '../../../context/ToastContext';
import PlotFormModal from '../components/PlotFormModal';
import FeasibilityDrawer from '../components/FeasibilityDrawer';

function formatCurrencyCr(amount) {
  if (!amount || isNaN(amount)) return '₹0';
  const val = Number(amount);
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)} L`;
  }
  return `₹${val.toLocaleString('en-IN')}`;
}

export default function PmsPlotListPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [kpis, setKpis] = useState({
    total: 0,
    identified: 0,
    visitScheduled: 0,
    underAnalysis: 0,
    approved: 0,
    rejected: 0,
    totalExpectedCapital: 0,
  });

  const [plots, setPlots] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // Default Table view per standard

  // Filtering & Search
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kpiFilter, setKpiFilter] = useState('all'); // 'all', 'visitScheduled', 'underAnalysis', 'approved'
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Modals & Drawers
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedPlotForEdit, setSelectedPlotForEdit] = useState(null);
  const [feasibilityDrawerOpen, setFeasibilityDrawerOpen] = useState(false);
  const [selectedPlotForFeasibility, setSelectedPlotForFeasibility] = useState(null);

  // Load projects for dropdown
  useEffect(() => {
    pmsProjectApi.listProjects({ limit: 100 }).then((res) => {
      if (res.success && res.data) setProjects(res.data);
    });
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      let effectiveStatus = statusFilter;
      if (kpiFilter === 'visitScheduled') effectiveStatus = 'visitScheduled';
      if (kpiFilter === 'underAnalysis') effectiveStatus = 'underAnalysis';
      if (kpiFilter === 'approved') effectiveStatus = 'approved';

      const [kpiRes, listRes] = await Promise.all([
        pmsPlotApi.getKPIs(projectFilter !== 'all' ? projectFilter : undefined),
        pmsPlotApi.listPlots({
          page: pagination.page,
          limit: pagination.limit,
          search,
          projectId: projectFilter !== 'all' ? projectFilter : undefined,
          status: effectiveStatus,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
      ]);

      if (kpiRes.success) setKpis(kpiRes.data);
      if (listRes.success) {
        setPlots(listRes.data || []);
        setPagination((prev) => ({
          ...prev,
          total: listRes.total || 0,
          totalPages: listRes.totalPages || 1,
        }));
      }
    } catch (err) {
      showError(err.message || 'Failed to load land plots');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, projectFilter, statusFilter, kpiFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleDeletePlot = async (plot) => {
    if (!window.confirm(`Are you sure you want to delete plot "${plot.title}"?`)) return;
    try {
      await pmsPlotApi.deletePlot(plot._id);
      showSuccess(`Plot "${plot.title}" removed`);
      loadData();
    } catch (err) {
      showError(err.message || 'Failed to delete plot');
    }
  };

  const handleOpenFeasibility = (plot) => {
    setSelectedPlotForFeasibility(plot);
    setFeasibilityDrawerOpen(true);
  };

  // 3-Liner KPI Tiles with (i) hover tooltips and interactive mutually exclusive filtering
  const kpiItems = [
    {
      key: 'total-plots',
      label: 'TOTAL PLOTS SCOUTED',
      value: kpis.total,
      tone: 'blue',
      hint: 'All land parcels identified',
      icon: MapPin,
      active: kpiFilter === 'all' && statusFilter === 'all',
      info: {
        title: 'Land Scout Register',
        summary: 'All potential development land parcels scouted across project corridors.',
        calculation: 'Count of non-deleted Plot records in MongoDB',
      },
      onClick: () => {
        setKpiFilter('all');
        setStatusFilter('all');
        setPagination((p) => ({ ...p, page: 1 }));
      },
    },
    {
      key: 'visit-scheduled',
      label: 'VISIT SCHEDULED',
      value: kpis.visitScheduled,
      tone: 'sky',
      hint: 'Pending field inspection',
      icon: Calendar,
      active: kpiFilter === 'visitScheduled',
      info: {
        title: 'Pending Site Inspections',
        summary: 'Land parcels with site inspection visits assigned to field engineers.',
        calculation: 'Plots where status = "visitScheduled" or "visited"',
      },
      onClick: () => {
        setKpiFilter(kpiFilter === 'visitScheduled' ? 'all' : 'visitScheduled');
        setPagination((p) => ({ ...p, page: 1 }));
      },
    },
    {
      key: 'under-feasibility',
      label: 'UNDER FEASIBILITY',
      value: kpis.underAnalysis,
      tone: 'orange',
      hint: 'Financial analysis in progress',
      icon: Calculator,
      active: kpiFilter === 'underAnalysis',
      info: {
        title: 'Feasibility Analysis Pipeline',
        summary: 'Land plots currently undergoing cost-benefit assessment and ROI projection.',
        calculation: 'Plots where status = "underAnalysis" or "feasibilityDone"',
      },
      onClick: () => {
        setKpiFilter(kpiFilter === 'underAnalysis' ? 'all' : 'underAnalysis');
        setPagination((p) => ({ ...p, page: 1 }));
      },
    },
    {
      key: 'approved-plots',
      label: 'APPROVED FOR ACQUISITION',
      value: kpis.approved,
      tone: 'success',
      hint: `${formatCurrencyCr(kpis.totalExpectedCapital)} capital required`,
      icon: CheckCircle2,
      active: kpiFilter === 'approved',
      info: {
        title: 'Approved Land Packages',
        summary: 'Vetted plots approved by management for legal verification and purchase registry.',
        calculation: 'Plots where status = "approved" and feasibility verdict is positive',
      },
      onClick: () => {
        setKpiFilter(kpiFilter === 'approved' ? 'all' : 'approved');
        setPagination((p) => ({ ...p, page: 1 }));
      },
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Land Acquisition & Feasibility
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full">
              Phase 02 • Stage 1 Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Land scout registry, Khasra survey verification, rate benchmarking, and chained financial feasibility engine.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedPlotForEdit(null);
              setFormModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Land Plot</span>
          </button>
        </div>
      </div>

      {/* 5-Card KPI Overview Grid (Consistent across all submodules) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* KPI 1 */}
        <div
          onClick={() => {
            setKpiFilter('all');
            setStatusFilter('all');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            kpiFilter === 'all' && statusFilter === 'all'
              ? 'bg-brand-50/70 border-brand-300 ring-2 ring-brand-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Plots</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Total scouted land parcels registered across all targeted project regions.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">All land parcels identified</div>
        </div>

        {/* KPI 2 */}
        <div
          onClick={() => {
            setKpiFilter(kpiFilter === 'visitScheduled' ? 'all' : 'visitScheduled');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            kpiFilter === 'visitScheduled'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Visit Scheduled</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Plots with active surveyor inspection or pending topography verification.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-blue-700 mt-1">{kpis.visitScheduled}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Pending field inspection</div>
        </div>

        {/* KPI 3 */}
        <div
          onClick={() => {
            setKpiFilter(kpiFilter === 'underAnalysis' ? 'all' : 'underAnalysis');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            kpiFilter === 'underAnalysis'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Under Feasibility</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Parcels undergoing pro-forma financial ROI, IRR, and FSI zoning analysis.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-amber-700 mt-1">{kpis.underAnalysis}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Financial analysis in progress</div>
        </div>

        {/* KPI 4 */}
        <div
          onClick={() => {
            setKpiFilter(kpiFilter === 'approved' ? 'all' : 'approved');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            kpiFilter === 'approved'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Approved for Acquisition</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Plots with positive investment committee sanction ready for legal verification.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">{kpis.approved}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sanctioned & advanced</div>
        </div>

        {/* KPI 5 */}
        <div
          onClick={() => {
            setKpiFilter('all');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            kpiFilter === 'acreage'
              ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Estimated Outlay</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Total estimated capital required for approved land parcel acquisitions.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-purple-700 mt-1">{formatCurrencyCr(kpis.totalEstimatedCost)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Capital deployment target</div>
        </div>
      </div>

      {/* Filters and Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plots by title, code, survey number, village, or owner..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50/50"
          />
        </div>

        {/* Dropdown Filters & View Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-brand-500 max-w-[180px] truncate"
          >
            <option value="all">All Associated Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setKpiFilter('all');
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="identified">Identified (Scouted)</option>
            <option value="visitScheduled">Visit Scheduled</option>
            <option value="underAnalysis">Under Analysis</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* View Mode Toggle (Table default) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-brand-700 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View (Default)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-brand-700 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2" />
          <p className="text-xs text-slate-500">Loading land plots...</p>
        </div>
      ) : plots.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No land plots found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or register a new plot.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plots.map((plot) => (
            <div
              key={plot._id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                    {plot.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      plot.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : plot.status === 'underAnalysis'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : plot.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {plot.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{plot.title}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Project: {plot.project?.name || 'Associated Project'}
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                    Survey: {plot.surveyNumber || 'N/A'}
                  </span>
                  <span>Village: {plot.location?.village || 'Jaipur'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Land Area</span>
                    <span className="font-bold text-slate-800">
                      {plot.area?.value?.toLocaleString()} {plot.area?.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Expected Price</span>
                    <span className="font-bold text-emerald-700">
                      {formatCurrencyCr(plot.expectedTotalPrice)}
                    </span>
                  </div>
                </div>

                {/* Feasibility Verdict Pill */}
                <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">Feasibility:</span>
                  <span
                    className={`font-bold capitalize text-[11px] ${
                      plot.verdict === 'feasible'
                        ? 'text-emerald-700'
                        : plot.verdict === 'feasibleWithConditions'
                        ? 'text-amber-700'
                        : plot.verdict === 'notFeasible'
                        ? 'text-rose-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {plot.verdict === 'feasibleWithConditions' ? 'Conditional' : plot.verdict}
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleOpenFeasibility(plot)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Feasibility</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlotForEdit(plot);
                      setFormModalOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePlot(plot)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View (Default Choice) */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Code & Plot Title</th>
                  <th className="py-3 px-4">Target Project</th>
                  <th className="py-3 px-4">Survey # & Village</th>
                  <th className="py-3 px-4">Land Area</th>
                  <th className="py-3 px-4">Est. Land Cost</th>
                  <th className="py-3 px-4">Feasibility Verdict</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plots.map((plot) => (
                  <tr key={plot._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                          {plot.code}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{plot.title}</div>
                          <div className="text-[11px] text-slate-400">Owner: {plot.owner?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {plot.project?.name || 'Associated Project'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-mono font-medium">{plot.surveyNumber || 'KH-N/A'}</div>
                      <div className="text-[11px] text-slate-400">{plot.location?.village || 'Jaipur'}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {plot.area?.value?.toLocaleString()} {plot.area?.unit}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {formatCurrencyCr(plot.expectedTotalPrice)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-semibold whitespace-nowrap text-slate-700 capitalize">
                        {plot.verdict === 'feasibleWithConditions' ? 'Conditional' : plot.verdict || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-semibold uppercase whitespace-nowrap text-slate-700">
                        {plot.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenFeasibility(plot)}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors cursor-pointer mr-2"
                        title="Calculate & assess financial feasibility"
                      >
                        Feasibility
                      </button>
                      {plot.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => navigate('/pms/legal-cases')}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer mr-2"
                          title="View Legal Due Diligence"
                        >
                          Legal
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlotForEdit(plot);
                          setFormModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        title="Edit Plot"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePlot(plot)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Delete Plot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dynamic Contextual Pagination Footer */}
          {!loading && pagination.total > 0 && (
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
              <div>
                Showing <span className="font-semibold text-slate-900">{plots.length}</span> of{' '}
                <span className="font-semibold text-slate-900">{pagination.total}</span>{' '}
                {kpiFilter === 'approved' || statusFilter === 'approved'
                  ? 'approved land acquisition plots'
                  : kpiFilter === 'underAnalysis' || statusFilter === 'underAnalysis'
                  ? 'plots under feasibility analysis'
                  : kpiFilter === 'visitScheduled' || statusFilter === 'visitScheduled'
                  ? 'plots with field visits scheduled'
                  : 'scouted land parcels'}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  className="px-2.5 py-1 border border-slate-200 rounded-md bg-white hover:bg-slate-100 disabled:opacity-40 text-xs font-medium cursor-pointer"
                >
                  Previous
                </button>
                <span className="px-2 font-medium text-slate-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  className="px-2.5 py-1 border border-slate-200 rounded-md bg-white hover:bg-slate-100 disabled:opacity-40 text-xs font-medium cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      <PlotFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        plot={selectedPlotForEdit}
        onSaved={loadData}
      />

      {/* Financial Feasibility Drawer */}
      <FeasibilityDrawer
        isOpen={feasibilityDrawerOpen}
        onClose={() => setFeasibilityDrawerOpen(false)}
        plot={selectedPlotForFeasibility}
        onUpdated={loadData}
      />
    </div>
  );
}
