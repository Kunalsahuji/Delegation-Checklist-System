import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  HardHat,
  CheckCircle2,
  IndianRupee,
  Search,
  Plus,
  RefreshCw,
  LayoutGrid,
  List,
  Eye,
  Edit2,
  Trash2,
  ArrowRight,
  Lock,
  Layers,
  MapPin,
  Calendar,
} from 'lucide-react';
import WorkKpiStrip from '../../../components/WorkKpiStrip';
import { pmsProjectApi } from '../../../api/pmsProjectApi';
import { useToast } from '../../../context/ToastContext';
import ProjectFormModal from '../components/ProjectFormModal';

// Helper to format currency in Indian format (Cr / Lakhs)
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

export default function PmsProjectListPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [kpis, setKpis] = useState({
    total: 0,
    underConstruction: 0,
    completed: 0,
    planning: 0,
    onHold: 0,
    plannedBudget: 0,
    actualSpend: 0,
    portfolioProgress: 0,
  });

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // Default Table view per standard

  // Filtering & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [kpiFilter, setKpiFilter] = useState('all'); // 'all', 'active', 'completed', 'planning'
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Modal
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      let effectiveStatus = statusFilter;
      if (kpiFilter === 'active') effectiveStatus = 'active';
      if (kpiFilter === 'completed') effectiveStatus = 'completed';
      if (kpiFilter === 'planning') effectiveStatus = 'planning';

      const [kpiRes, listRes] = await Promise.all([
        pmsProjectApi.getKPIs(),
        pmsProjectApi.listProjects({
          page: pagination.page,
          limit: pagination.limit,
          search,
          status: effectiveStatus,
          stageOrder: stageFilter !== 'all' ? stageFilter : undefined,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
      ]);

      if (kpiRes.success) setKpis(kpiRes.data);
      if (listRes.success) {
        setProjects(listRes.data || []);
        setPagination((prev) => ({
          ...prev,
          total: listRes.total || 0,
          totalPages: listRes.totalPages || 1,
        }));
      }
    } catch (err) {
      showError(err.message || 'Failed to load PMS projects');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, stageFilter, kpiFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleDeleteProject = async (project) => {
    if (!window.confirm(`Are you sure you want to delete project "${project.name}"?`)) return;
    try {
      await pmsProjectApi.deleteProject(project._id);
      showSuccess(`Project "${project.name}" deleted`);
      loadData();
    } catch (err) {
      showError(err.message || 'Failed to delete project');
    }
  };

  // 3-Liner KPI Tiles with (i) hover tooltips and interactive mutually exclusive filtering
  const kpiItems = [
    {
      key: 'total-projects',
      label: 'TOTAL PROJECTS',
      value: kpis.total,
      tone: 'blue',
      hint: 'All real estate developments',
      icon: Building2,
      active: kpiFilter === 'all' && statusFilter === 'all',
      info: {
        title: 'Total Projects Portfolio',
        summary: 'All master real estate developments registered across land, planning, and execution phases.',
        calculation: 'Count of non-deleted PmsProject records in MongoDB',
      },
      onClick: () => {
        setKpiFilter('all');
        setStatusFilter('all');
        setPagination((p) => ({ ...p, page: 1 }));
      },
    },
    {
      key: 'under-construction',
      label: 'UNDER CONSTRUCTION',
      value: kpis.underConstruction,
      tone: 'orange',
      hint: 'Stage 6–10 active civil works',
      icon: HardHat,
      active: kpiFilter === 'active',
      info: {
        title: 'Active Construction Projects',
        summary: 'Projects actively executing civil work, daily labor logs, and structural work packages.',
        calculation: 'Projects with status = "active" (Stage 6 Baseline Planning through Stage 10)',
      },
      onClick: () => {
        setKpiFilter(kpiFilter === 'active' ? 'all' : 'active');
        setPagination((p) => ({ ...p, page: 1 }));
      },
    },
    {
      key: 'completed-projects',
      label: 'COMPLETED & HANDED OVER',
      value: kpis.completed,
      tone: 'success',
      hint: 'Handover & After-Sales',
      icon: CheckCircle2,
      active: kpiFilter === 'completed',
      info: {
        title: 'Completed Developments',
        summary: 'Projects with 100% stage completions, final handover certificates, and possession letters issued.',
        calculation: 'Projects where stageOrder = 13 and status = "completed"',
      },
      onClick: () => {
        setKpiFilter(kpiFilter === 'completed' ? 'all' : 'completed');
        setPagination((p) => ({ ...p, page: 1 }));
      },
    },
    {
      key: 'planned-budget',
      label: 'PLANNED BUDGET',
      value: formatCurrencyCr(kpis.plannedBudget),
      tone: 'purple',
      hint: `${kpis.portfolioProgress}% portfolio milestone progression`,
      icon: IndianRupee,
      active: kpiFilter === 'planning',
      info: {
        title: 'Cumulative Planned Capital',
        summary: 'Aggregate capital expenditure budget planned across active and upcoming construction projects.',
        calculation: 'Sum of plannedBudget field across all active portfolio projects',
      },
      onClick: () => {
        setKpiFilter(kpiFilter === 'planning' ? 'all' : 'planning');
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
              Project Management System (PMS)
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/60 rounded-full">
              Project Master Portfolio
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global project catalog, 13-stage lifecycle progress rails, baseline governance, and site execution workspace.
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
              setSelectedProjectForEdit(null);
              setFormModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Project</span>
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
              <Building2 className="w-3.5 h-3.5 text-brand-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Projects</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                All master real estate developments registered across land, planning, and execution phases.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">All real estate developments</div>
        </div>

        {/* KPI 2 */}
        <div
          onClick={() => {
            setKpiFilter(kpiFilter === 'planning' ? 'all' : 'planning');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            kpiFilter === 'planning'
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
                Projects in land acquisition, legal due diligence, and master layout design.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-blue-700 mt-1">{kpis.planning || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Stages 1–5 active</div>
        </div>

        {/* KPI 3 */}
        <div
          onClick={() => {
            setKpiFilter(kpiFilter === 'active' ? 'all' : 'active');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            kpiFilter === 'active'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <HardHat className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Under Construction</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Projects actively executing civil work, daily labor logs, and structural work packages.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-amber-700 mt-1">{kpis.underConstruction}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Stage 6–10 active civil works</div>
        </div>

        {/* KPI 4 */}
        <div
          onClick={() => {
            setKpiFilter(kpiFilter === 'completed' ? 'all' : 'completed');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            kpiFilter === 'completed'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Completed & Handover</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Projects with 100% stage completions, final handover certificates, and possession letters issued.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">{kpis.completed}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Handover & After-Sales</div>
        </div>

        {/* KPI 5 */}
        <div
          onClick={() => {
            setKpiFilter(kpiFilter === 'planning' ? 'all' : 'planning');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            kpiFilter === 'planning'
              ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Planned Budget</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Aggregate capital expenditure budget planned across active and upcoming construction projects.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-purple-700 mt-1">{formatCurrencyCr(kpis.plannedBudget)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">${kpis.portfolioProgress}% portfolio progression</div>
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
            placeholder="Search projects by name, code, locality, or city..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50/50"
          />
        </div>

        {/* Dropdown Filters & View Toggle */}
        <div className="flex flex-wrap items-center gap-2">
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
            <option value="planning">Planning</option>
            <option value="active">Active Construction</option>
            <option value="onHold">On Hold</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-brand-500"
          >
            <option value="all">All 13 Stages</option>
            <option value="1">Stage 1 • Land Acquisition</option>
            <option value="2">Stage 2 • Legal Verification</option>
            <option value="3">Stage 3 • Land Purchase & Registry</option>
            <option value="4">Stage 4 • Planning & Approvals</option>
            <option value="5">Stage 5 • Pre-Site Start</option>
            <option value="6">Stage 6 • Baseline Planning</option>
            <option value="7">Stage 7 • Procurement & Inventory</option>
            <option value="8">Stage 8 • Construction Execution</option>
            <option value="9">Stage 9 • Quality Control</option>
            <option value="10">Stage 10 • Project Control</option>
            <option value="11">Stage 11 • Finance Management</option>
            <option value="12">Stage 12 • Handover Management</option>
            <option value="13">Stage 13 • After Sales Service</option>
          </select>

          {/* View Mode Toggle (Table as default) */}
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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mb-2" />
          <p className="text-xs text-slate-500">Loading construction projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No projects found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or register a new project.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => (
            <div
              key={proj._id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/60">
                    {proj.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      proj.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : proj.status === 'planning'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : proj.status === 'completed'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {proj.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{proj.name}</h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {proj.locality ? `${proj.locality}, ` : ''}
                    {proj.city || 'Jaipur'}
                  </span>
                </div>

                {/* 13-Stage Progress Rail Pill */}
                <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Stage {proj.stageOrder} / 13</span>
                    <span className="text-[11px] font-bold text-brand-600">{proj.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${proj.progressPercent}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-medium text-slate-600 mt-1 truncate">
                    {proj.currentStageName}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Planned Budget</span>
                    <span className="font-bold text-slate-800">{formatCurrencyCr(proj.plannedBudget)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Baseline Lock</span>
                    <span className="font-semibold flex items-center gap-1 text-slate-700">
                      <Lock
                        className={`w-3 h-3 ${proj.baselineLocked ? 'text-amber-600' : 'text-slate-400'}`}
                      />
                      {proj.baselineLocked ? 'Locked' : 'Open'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate(`/pms/projects/${proj._id}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors cursor-pointer"
                >
                  <span>Stage Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProjectForEdit(proj);
                      setFormModalOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(proj)}
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
                  <th className="py-3 px-4">Code & Project</th>
                  <th className="py-3 px-4">Locality / City</th>
                  <th className="py-3 px-4 min-w-[200px]">13-Stage Progress Rail</th>
                  <th className="py-3 px-4">Planned Budget</th>
                  <th className="py-3 px-4">Baseline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((proj) => (
                  <tr
                    key={proj._id}
                    onClick={() => navigate(`/pms/projects/${proj._id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 hover:text-brand-600">{proj.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {proj.code} • {proj.currentStageName || 'Planning'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{proj.locality || '—'}</div>
                      <div className="text-[11px] text-slate-400">{proj.city || 'Jaipur'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-slate-800">
                          Stage {proj.stageOrder}/13: {proj.currentStageName}
                        </span>
                        <span className="font-bold text-brand-600">{proj.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-brand-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${proj.progressPercent}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {formatCurrencyCr(proj.plannedBudget)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700">
                        <Lock
                          className={`w-3 h-3 ${proj.baselineLocked ? 'text-amber-600' : 'text-slate-400'}`}
                        />
                        {proj.baselineLocked ? 'Locked' : 'Open'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-semibold uppercase whitespace-nowrap text-slate-700">
                        {proj.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => navigate(`/pms/projects/${proj._id}`)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors cursor-pointer mr-2"
                        title="Open workspace"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Workspace</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProjectForEdit(proj);
                          setFormModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        title="Edit Project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(proj)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Delete Project"
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
                Showing <span className="font-semibold text-slate-900">{projects.length}</span> of{' '}
                <span className="font-semibold text-slate-900">{pagination.total}</span>{' '}
                {kpiFilter === 'active' || statusFilter === 'active'
                  ? 'active construction projects'
                  : kpiFilter === 'completed' || statusFilter === 'completed'
                  ? 'completed developments'
                  : kpiFilter === 'planning' || statusFilter === 'planning'
                  ? 'projects in planning stage'
                  : 'real estate construction projects'}
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
      <ProjectFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        project={selectedProjectForEdit}
        onSaved={loadData}
      />
    </div>
  );
}
