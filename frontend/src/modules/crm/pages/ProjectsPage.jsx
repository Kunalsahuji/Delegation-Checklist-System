import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  MapPin,
  ExternalLink,
  Compass,
  Home,
  CheckCircle2,
  ShieldAlert,
  Edit,
  Trash2,
  Layers,
  LayoutGrid,
  List,
  RefreshCw,
} from 'lucide-react';
import { crmProjectApi } from '../../../api/crmProjectApi';
import { useToast } from '../../../context/ToastContext';
import WorkKpiStrip from '../../../components/WorkKpiStrip';
import ProjectFormModal from '../components/ProjectFormModal';
import ProjectUnitsModal from '../components/ProjectUnitsModal';

export default function ProjectsPage() {
  const { showSuccess, showError } = useToast();

  const [projects, setProjects] = useState([]);
  const [kpis, setKpis] = useState({
    totalProjects: 0,
    openProjects: 0,
    totalUnits: 0,
    availableUnits: 0,
    bookedUnits: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [kpiFilter, setKpiFilter] = useState('all'); // 'all', 'has_units', 'available', 'booked'
  const [viewMode, setViewMode] = useState('table'); // default table, 'grid' on click

  // Modals state
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState(null);

  const [unitsModalOpen, setUnitsModalOpen] = useState(false);
  const [selectedProjectForUnits, setSelectedProjectForUnits] = useState(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await crmProjectApi.getProjects({
        search,
        status: statusFilter,
        propertyType: typeFilter,
      });
      const projectList =
        res?.projects || res?.data?.projects || res?.data || (Array.isArray(res) ? res : []);
      setProjects(projectList);
      if (res.kpis) {
        setKpis(res.kpis);
      }
    } catch (err) {
      showError(err.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProjects();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadProjects]);

  const handleOpenCreateModal = () => {
    setSelectedProjectForEdit(null);
    setProjectModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setSelectedProjectForEdit(p);
    setProjectModalOpen(true);
  };

  const handleOpenUnitsModal = (p) => {
    setSelectedProjectForUnits(p);
    setUnitsModalOpen(true);
  };

  const handleDeleteProject = async (p) => {
    if (!window.confirm(`Are you sure you want to delete project "${p.name}"?`)) return;
    try {
      await crmProjectApi.deleteProject(p._id);
      showSuccess(`Project "${p.name}" deleted successfully`);
      loadProjects();
    } catch (err) {
      showError(err.message || 'Failed to delete project');
    }
  };

  // Filter projects by selected KPI card
  const displayedProjects = projects.filter((p) => {
    const stats = p.stats || {
      totalUnits: p.units?.length || 0,
      availableUnits: (p.units || []).filter((u) => u.status === 'available').length,
      bookedUnits: (p.units || []).filter((u) => u.status === 'booked').length,
    };

    if (kpiFilter === 'available') {
      return (stats.availableUnits || 0) > 0;
    }
    if (kpiFilter === 'booked') {
      return (stats.bookedUnits || 0) > 0;
    }
    if (kpiFilter === 'has_units') {
      return (stats.totalUnits || 0) > 0;
    }
    return true;
  });

  // KPI Strip Configuration with interactive filtering
  const kpiItems = [
    {
      key: 'total-projects',
      id: 'total-projects',
      label: 'TOTAL PROJECTS',
      value: kpis.totalProjects,
      hint: `${kpis.openProjects} open for booking`,
      tone: 'blue',
      icon: Building2,
      active: kpiFilter === 'all' && statusFilter === 'all' && typeFilter === 'all',
      info: {
        title: 'Total Projects',
        summary: 'All registered real estate developments, plotting schemes, and commercial developments.',
        calculation: 'Count of all non-deleted projects in the master registry.',
      },
      onClick: () => {
        setKpiFilter('all');
        setStatusFilter('all');
        setTypeFilter('all');
      },
    },
    {
      key: 'total-units',
      id: 'total-units',
      label: 'INVENTORY UNITS',
      value: kpis.totalUnits,
      hint: 'Plots, villas & shops',
      tone: 'sky',
      icon: Layers,
      active: kpiFilter === 'has_units',
      info: {
        title: 'Inventory Units',
        summary: 'Total sellable inventory units configured across all projects.',
        calculation: 'Sum of units across all project inventory sheets.',
      },
      onClick: () => {
        setKpiFilter('has_units');
      },
    },
    {
      key: 'available-units',
      id: 'available-units',
      label: 'AVAILABLE',
      value: kpis.availableUnits,
      hint: `${kpis.totalUnits ? Math.round((kpis.availableUnits / kpis.totalUnits) * 100) : 0}% available`,
      tone: 'success',
      icon: CheckCircle2,
      active: kpiFilter === 'available',
      info: {
        title: 'Available Units',
        summary: 'Sellable units currently available for customer allocation, site visit selection, and booking.',
        calculation: 'Units with status = "available".',
      },
      onClick: () => {
        setKpiFilter('available');
      },
    },
    {
      key: 'booked-units',
      id: 'booked-units',
      label: 'BOOKED / SOLD',
      value: kpis.bookedUnits,
      hint: `${kpis.totalUnits ? Math.round((kpis.bookedUnits / kpis.totalUnits) * 100) : 0}% booked`,
      tone: 'orange',
      icon: Home,
      active: kpiFilter === 'booked',
      info: {
        title: 'Booked / Sold Units',
        summary: 'Units with confirmed customer bookings, advance token deposits, or sale registrations.',
        calculation: 'Units with status in ["booked", "sold"].',
      },
      onClick: () => {
        setKpiFilter('booked');
      },
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Projects & Inventory</h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/60 rounded-full">
              CRM Master
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage residential developments, sellable plots/villas, pricing, and GPS coordinates for field site visit verification.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadProjects}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Project</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <WorkKpiStrip items={kpiItems} columns="grid-cols-2 sm:grid-cols-4" />

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name, code or city..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50/50"
          />
        </div>

        {/* Dropdown Filters & View Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-brand-500"
          >
            <option value="all">All Types</option>
            <option value="Luxury Villas">Luxury Villas</option>
            <option value="Residential Plots">Residential Plots</option>
            <option value="Commercial & Retail">Commercial & Retail</option>
            <option value="Apartments">Apartments</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="hold">On Hold</option>
            <option value="soldOut">Sold Out</option>
          </select>

          {/* View Mode Toggle */}
          <div className="inline-flex items-center p-0.5 border border-slate-200 rounded-lg bg-slate-50">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white text-brand-700 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-white text-brand-700 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Presentation */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="inline-block w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-slate-500">Loading project inventory...</p>
        </div>
      ) : displayedProjects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No Projects Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {kpiFilter !== 'all'
              ? `No projects currently match the ${kpiFilter} units filter. Click 'TOTAL PROJECTS' above to reset.`
              : search || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'No projects match your active search filters.'
              : 'Start by creating your first real estate project with GPS coordinates and units.'}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {kpiFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setKpiFilter('all')}
                className="px-3.5 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg shadow-2xs"
              >
                Reset KPI Filter
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedProjects.map((p) => {
            const stats = p.stats || {
              totalUnits: 0,
              availableUnits: 0,
              bookedUnits: 0,
            };
            const availablePct = stats.totalUnits ? Math.round((stats.availableUnits / stats.totalUnits) * 100) : 0;

            return (
              <div
                key={p._id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-2xs hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                {/* Card Top Banner */}
                <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{p.name}</h3>
                      {p.code && (
                        <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-600 rounded">
                          {p.code}
                        </span>
                      )}
                    </div>
                    <span className="inline-block text-[11px] font-medium text-brand-600 mt-0.5">
                      {p.propertyType || 'Residential'}
                    </span>
                  </div>

                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      p.status === 'open'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : p.status === 'soldOut'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {p.status === 'open' ? 'Open' : p.status === 'soldOut' ? 'Sold Out' : 'On Hold'}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3 flex-1 text-xs">
                  {/* Location & Maps */}
                  <div className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{p.location || 'Location not specified'}</span>
                    </div>
                    {p.googleMapLink && (
                      <a
                        href={p.googleMapLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-[11px] font-medium text-sky-600 hover:text-sky-800 ml-2 shrink-0"
                        title="Open in Google Maps"
                      >
                        Map <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* GPS Geo-Coordinates Badge */}
                  <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg">
                    <Compass className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <div className="truncate text-[11px] text-slate-600">
                      {p.latitude && p.longitude ? (
                        <span>
                          {Number(p.latitude).toFixed(4)}°, {Number(p.longitude).toFixed(4)}°
                          <span className="text-slate-400 ml-1">({p.geoFenceRadius || 500}m radius)</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No GPS coordinates set</span>
                      )}
                    </div>
                  </div>

                  {/* Inventory Status Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700">Inventory Status</span>
                      <span className="text-slate-500">
                        <strong className="text-emerald-600">{stats.availableUnits}</strong> / {stats.totalUnits} Available
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${availablePct}%` }}
                        className="bg-emerald-500 h-full transition-all"
                        title={`${stats.availableUnits} Available`}
                      />
                      <div
                        style={{ width: `${100 - availablePct}%` }}
                        className="bg-rose-400 h-full transition-all"
                        title={`${stats.bookedUnits} Booked / Sold`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>Booked: {stats.bookedUnits}</span>
                      <span>Reserved/Held: {(stats.reservedUnits || 0) + (stats.heldUnits || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenUnitsModal(p)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100/80 border border-brand-200/80 rounded-lg transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Manage Units ({stats.totalUnits})</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(p)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors"
                      title="Edit project"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(p)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Project Name</th>
                  <th className="px-4 py-3">Property Type</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">GPS Coordinates</th>
                  <th className="px-4 py-3">Inventory</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedProjects.map((p) => {
                  const stats = p.stats || { totalUnits: 0, availableUnits: 0, bookedUnits: 0 };
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{p.name}</span>
                          {p.code && (
                            <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 rounded">
                              {p.code}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.propertyType || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="flex items-center gap-1">
                          <span className="truncate max-w-[150px]">{p.location || '—'}</span>
                          {p.googleMapLink && (
                            <a
                              href={p.googleMapLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-600 hover:text-sky-800"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                        {p.latitude && p.longitude
                          ? `${Number(p.latitude).toFixed(4)}, ${Number(p.longitude).toFixed(4)}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleOpenUnitsModal(p)}
                          className="font-semibold text-brand-600 hover:underline"
                        >
                          {stats.availableUnits} free / {stats.totalUnits} total
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.status === 'open'
                              ? 'bg-emerald-50 text-emerald-700'
                              : p.status === 'soldOut'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenUnitsModal(p)}
                          className="px-2 py-1 text-[11px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded"
                        >
                          Units
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1 text-slate-500 hover:text-slate-800 rounded"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(p)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Summary Footer */}
          {!loading && filteredProjects.length > 0 && (
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                Showing <span className="font-semibold text-slate-900">{filteredProjects.length}</span> of{' '}
                <span className="font-semibold text-slate-900">{projects.length}</span>{' '}
                {kpiFilter === 'available'
                  ? 'projects with available units'
                  : kpiFilter === 'booked'
                  ? 'projects with booked units'
                  : kpiFilter === 'has_units'
                  ? 'projects with active units'
                  : 'real estate projects'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Project Form Modal (Create / Edit) */}
      <ProjectFormModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        project={selectedProjectForEdit}
        onSaved={loadProjects}
      />

      {/* Project Units / Inventory Modal */}
      <ProjectUnitsModal
        isOpen={unitsModalOpen}
        onClose={() => setUnitsModalOpen(false)}
        project={selectedProjectForUnits}
        onUpdated={loadProjects}
      />
    </div>
  );
}
