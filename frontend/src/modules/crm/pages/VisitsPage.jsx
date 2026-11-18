import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Building,
  User,
  Phone,
  Eye,
  Trash2,
  Calendar,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import WorkKpiStrip from '../../../components/WorkKpiStrip';
import { crmVisitApi } from '../../../api/crmVisitApi';
import { crmProjectApi } from '../../../api/crmProjectApi';
import { crmLeadAssignmentApi } from '../../../api/crmLeadAssignmentApi';
import { useToast } from '../../../context/ToastContext';
import VisitFormModal from '../components/VisitFormModal';
import VisitDetailsModal from '../components/VisitDetailsModal';

export default function VisitsPage() {
  const { showSuccess, showError } = useToast();

  const [stats, setStats] = useState({
    total: 0,
    geoVerified: 0,
    today: 0,
    month: 0,
  });

  const [visits, setVisits] = useState([]);
  const [projects, setProjects] = useState([]);
  const [salesPersons, setSalesPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [geoFilter, setGeoFilter] = useState(''); // '', 'true', 'false'
  const [kpiFilter, setKpiFilter] = useState('all'); // 'all', 'geo-verified', 'today', 'month'

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [detailsModal, setDetailsModal] = useState({ open: false, visit: null });

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    loadAllData();
  }, [pagination.page, selectedProjectId, geoFilter, kpiFilter]);

  const loadMasterData = async () => {
    try {
      const [projRes, workloadRes] = await Promise.all([
        crmProjectApi.getProjects({ limit: 100 }),
        crmLeadAssignmentApi.getWorkload(),
      ]);
      const projectList =
        projRes?.projects || projRes?.data?.projects || projRes?.data || (Array.isArray(projRes) ? projRes : []);
      setProjects(projectList);

      if (workloadRes?.data && Array.isArray(workloadRes.data)) {
        setSalesPersons(workloadRes.data.map((w) => w.user).filter(Boolean));
      } else if (Array.isArray(workloadRes)) {
        setSalesPersons(workloadRes.map((w) => w.user || w).filter(Boolean));
      }
    } catch (err) {
      console.error('Failed to load master projects/sales team:', err);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        projectId: selectedProjectId,
      };

      if (kpiFilter === 'geo-verified') {
        params.geoVerified = 'true';
      } else if (geoFilter) {
        params.geoVerified = geoFilter;
      }

      if (kpiFilter === 'today') {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        params.from = todayStart.toISOString();
      } else if (kpiFilter === 'month') {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        params.from = monthStart.toISOString();
      }

      const [statsRes, visitsRes] = await Promise.all([
        crmVisitApi.getStats(),
        crmVisitApi.listVisits(params),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (visitsRes.success) {
        setVisits(visitsRes.data || []);
        setPagination((prev) => ({
          ...prev,
          total: visitsRes.pagination?.total || 0,
          totalPages: visitsRes.pagination?.totalPages || 1,
        }));
      }
    } catch (err) {
      showError(err.message || 'Failed to load visits data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadAllData();
  };

  const handleDelete = async (visitId) => {
    if (!window.confirm('Are you sure you want to remove this visit report?')) return;
    try {
      await crmVisitApi.deleteVisit(visitId);
      showSuccess('Site visit report removed');
      loadAllData();
    } catch (err) {
      showError(err.message || 'Failed to delete visit report');
    }
  };

  // KPI Items with interactive filter triggers and MetricInfoBadge
  const kpiItems = [
    {
      key: 'total-visits',
      label: 'TOTAL SITE VISITS',
      value: stats.total,
      tone: 'blue',
      hint: 'All customer visits',
      icon: MapPin,
      active: kpiFilter === 'all' && !geoFilter,
      info: {
        title: 'Total Site Visits',
        summary: 'All physical site tours and walk-ins conducted across projects.',
        calculation: 'Count of visit reports where deletedAt is null',
      },
      onClick: () => {
        setKpiFilter('all');
        setGeoFilter('');
        setSelectedProjectId('');
        setPagination((prev) => ({ ...prev, page: 1 }));
      },
    },
    {
      key: 'geo-verified',
      label: 'GEO-VERIFIED VISITS',
      value: stats.geoVerified,
      tone: 'success',
      hint: `${stats.total ? Math.round((stats.geoVerified / stats.total) * 100) : 0}% authenticated`,
      icon: ShieldCheck,
      active: kpiFilter === 'geo-verified' || geoFilter === 'true',
      info: {
        title: 'Geo-Fence Verified Visits',
        summary: 'Visits authenticated on-site using GPS matching the designated project coordinates.',
        calculation: 'Count of visit reports where geoVerified = true',
      },
      onClick: () => {
        setKpiFilter('geo-verified');
        setGeoFilter('true');
        setPagination((prev) => ({ ...prev, page: 1 }));
      },
    },
    {
      key: 'today-visits',
      label: "TODAY'S VISITS",
      value: stats.today,
      tone: 'purple',
      hint: 'Conducted today',
      icon: Calendar,
      active: kpiFilter === 'today',
      info: {
        title: "Today's Field Visits",
        summary: 'Site tours completed by representatives today.',
        calculation: 'Count of visits with timestamp >= 00:00:00 today',
      },
      onClick: () => {
        setKpiFilter('today');
        setGeoFilter('');
        setPagination((prev) => ({ ...prev, page: 1 }));
      },
    },
    {
      key: 'month-visits',
      label: 'THIS MONTH',
      value: stats.month,
      tone: 'sky',
      hint: 'Current calendar month',
      icon: TrendingUp,
      active: kpiFilter === 'month',
      info: {
        title: 'Visits This Month',
        summary: 'Total physical customer site visits recorded in the current calendar month.',
        calculation: 'Count of visits with timestamp >= start of this month',
      },
      onClick: () => {
        setKpiFilter('month');
        setGeoFilter('');
        setPagination((prev) => ({ ...prev, page: 1 }));
      },
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Full-width Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Field Site Visits</h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-700 rounded-md">
              GPS Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track customer site tours, property preferences, and geo-fenced visit verifications in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadAllData()}
            className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refresh visits list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Field Site Visit</span>
          </button>
        </div>
      </div>

      {/* KPI Strip with MetricInfoBadge */}
      <WorkKpiStrip items={kpiItems} />

      {/* Filter and Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Filters Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <form onSubmit={handleSearch} className="relative flex-1 md:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer, phone, project, visitor..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* Project Filter */}
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white text-slate-700"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Geo Filter */}
            <select
              value={geoFilter}
              onChange={(e) => {
                setGeoFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white text-slate-700"
            >
              <option value="">All GPS Status</option>
              <option value="true">Geo-Verified Only</option>
              <option value="false">External / Unverified</option>
            </select>
          </div>
        </div>

        {/* Visits Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Visit Date & #</th>
                <th className="py-3 px-4">Client Contact</th>
                <th className="py-3 px-4">Project Visited</th>
                <th className="py-3 px-4">Preferences & Budget</th>
                <th className="py-3 px-4">Visited By</th>
                <th className="py-3 px-4">Geo-Verification</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={7} className="py-3.5 px-4 bg-slate-50/30">
                      <div className="h-4 bg-slate-200/60 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : visits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <MapPin className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">No site visits found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Log a new physical site tour to record customer feedback.
                    </p>
                  </td>
                </tr>
              ) : (
                visits.map((visit) => (
                  <tr key={visit._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {new Date(visit.visitedAt || visit.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                          {visit.visitNumber || '1st'} Visit
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(visit.visitedAt || visit.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{visit.customerName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{visit.contactNumber}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">
                        {visit.projectVisited || visit.projectId?.name || 'General Tour'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {visit.propertyInterested || 'Villa / Plot'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {visit.firstPreference ? (
                        <div className="font-medium text-slate-700 truncate max-w-[180px]" title={visit.firstPreference}>
                          {visit.firstPreference}
                        </div>
                      ) : (
                        <div className="text-slate-400 text-[11px]">—</div>
                      )}
                      {visit.customerBudget && (
                        <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                          ₹{visit.customerBudget}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">
                        {visit.visitorName || visit.visitorId?.name || 'Staff'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {visit.geoVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Geo-Verified</span>
                          {visit.geoDistanceMeters !== null && (
                            <span className="opacity-75">({visit.geoDistanceMeters}m)</span>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>External GPS</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailsModal({ open: true, visit })}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="View Visit Report"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(visit._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete Visit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pagination.total > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
            <div>
              Showing {visits.length} of {pagination.total} visits
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 font-medium text-slate-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Portaled Modals with z-[9999] */}
      <VisitFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => loadAllData()}
        projects={projects}
        salesPersons={salesPersons}
      />

      <VisitDetailsModal
        isOpen={detailsModal.open}
        visit={detailsModal.visit}
        onClose={() => setDetailsModal({ open: false, visit: null })}
      />
    </div>
  );
}
