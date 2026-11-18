import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  Search,
  Filter,
  ArrowRightLeft,
  History,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Phone,
  Building,
  TrendingUp,
} from 'lucide-react';
import WorkKpiStrip from '../../../components/WorkKpiStrip';
import StageBadge from '../components/StageBadge';
import { crmLeadAssignmentApi } from '../../../api/crmLeadAssignmentApi';
import { useToast } from '../../../context/ToastContext';
import AssignmentModal from '../components/AssignmentModal';
import BulkAssignModal from '../components/BulkAssignModal';
import AssignmentHistoryModal from '../components/AssignmentHistoryModal';

export default function LeadAssignmentPage() {
  const { showSuccess, showError } = useToast();

  const [kpis, setKpis] = useState({
    unassignedLeads: 0,
    totalSalesPersons: 0,
    totalActiveLeads: 0,
    assignedToday: 0,
    reassignmentsCount: 0,
  });

  const [workload, setWorkload] = useState([]);
  const [showWorkload, setShowWorkload] = useState(true);
  const [selectedRepFilter, setSelectedRepFilter] = useState('');

  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'unassigned', 'assigned'

  // Multi-selection for bulk assignment
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);

  // Modals state
  const [singleAssignModal, setSingleAssignModal] = useState({ open: false, lead: null });
  const [bulkAssignModal, setBulkAssignModal] = useState(false);
  const [historyModal, setHistoryModal] = useState({ open: false, lead: null });
  const [distributing, setDistributing] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [pagination.page, statusFilter, selectedRepFilter]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [kpiRes, workloadRes, leadsRes] = await Promise.all([
        crmLeadAssignmentApi.getKPIs(),
        crmLeadAssignmentApi.getWorkload(),
        crmLeadAssignmentApi.listLeads({
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          assignmentStatus: statusFilter,
        }),
      ]);

      if (kpiRes.success) setKpis(kpiRes.data);
      if (workloadRes.success) setWorkload(workloadRes.data);
      if (leadsRes.success) {
        setLeads(leadsRes.data || []);
        setPagination((prev) => ({
          ...prev,
          total: leadsRes.pagination?.total || 0,
          totalPages: leadsRes.pagination?.totalPages || 1,
        }));
      }
    } catch (err) {
      showError(err.message || 'Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadAllData();
  };

  const handleToggleSelectAll = () => {
    if (selectedLeadIds.length === leads.length && leads.length > 0) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((l) => l._id));
    }
  };

  const handleToggleSelectLead = (id) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAutoDistribute = async (specificIds = null) => {
    try {
      setDistributing(true);
      const res = await crmLeadAssignmentApi.autoDistribute({
        leadIds: specificIds || (selectedLeadIds.length > 0 ? selectedLeadIds : []),
      });
      showSuccess(res.message || 'Round-robin distribution completed');
      setSelectedLeadIds([]);
      loadAllData();
    } catch (err) {
      showError(err.message || 'Auto-distribution failed');
    } finally {
      setDistributing(false);
    }
  };

  // Filter leads locally if sales rep filter is selected
  const displayLeads = useMemo(() => {
    if (!selectedRepFilter) return leads;
    return leads.filter((l) => l.assignedTo?._id === selectedRepFilter);
  }, [leads, selectedRepFilter]);

  // Construct 5 KPI tiles with rich MetricInfoBadge metadata
  const kpiItems = [
    {
      key: 'unassigned',
      label: 'UNASSIGNED LEADS',
      value: kpis.unassignedLeads,
      status: kpis.unassignedLeads > 0 ? 'warning' : 'neutral',
      active: statusFilter === 'unassigned' && !selectedRepFilter,
      info: {
        title: 'Unassigned Leads',
        summary: 'Qualified inbound deals awaiting sales representative assignment.',
        calculation: 'Count of active leads where assignedTo is null',
      },
      onClick: () => {
        setStatusFilter('unassigned');
        setSelectedRepFilter('');
        setPagination((p) => ({ ...p, page: 1 }));
      },
    },
    {
      key: 'sales-reps',
      label: 'ACTIVE SALES REPS',
      value: kpis.totalSalesPersons,
      status: 'neutral',
      active: statusFilter === 'assigned' && !selectedRepFilter,
      info: {
        title: 'Active Sales Representatives',
        summary: 'Total team members available to take ownership of prospective buyer deals.',
        calculation: 'Count of active users in the system',
      },
      onClick: () => {
        setShowWorkload(true);
        setStatusFilter('assigned');
        setSelectedRepFilter('');
        setPagination((p) => ({ ...p, page: 1 }));
      },
    },
    {
      key: 'active-leads',
      label: 'TOTAL ACTIVE LEADS',
      value: kpis.totalActiveLeads,
      status: 'positive',
      active: statusFilter === 'all' && !selectedRepFilter,
      info: {
        title: 'Total Active Pipeline Leads',
        summary: 'Active customer leads currently engaged throughout the sales pipeline.',
        calculation: 'Count of leads with status = "active"',
      },
      onClick: () => {
        setStatusFilter('all');
        setSelectedRepFilter('');
        setPagination((p) => ({ ...p, page: 1 }));
      },
    },
    {
      key: 'assigned-today',
      label: 'ASSIGNED TODAY',
      value: kpis.assignedToday,
      status: 'positive',
      active: statusFilter === 'assigned_today' && !selectedRepFilter,
      info: {
        title: 'Assigned Today',
        summary: 'Deals assigned or distributed to representatives today.',
        calculation: 'Count of assignment audit logs with timestamp >= 00:00 today',
      },
      onClick: () => {
        setStatusFilter('assigned_today');
        setSelectedRepFilter('');
        setPagination((p) => ({ ...p, page: 1 }));
      },
    },
    {
      key: 'reassignments',
      label: 'REASSIGNMENTS',
      value: kpis.reassignmentsCount,
      status: 'neutral',
      active: statusFilter === 'reassignments' && !selectedRepFilter,
      info: {
        title: 'Lead Reassignments',
        summary: 'Total instances where lead ownership was transferred between representatives.',
        calculation: 'Count of assignment logs where triggerType = "reassign" or previousAssignee is not null',
      },
      onClick: () => {
        setStatusFilter('reassignments');
        setSelectedRepFilter('');
        setPagination((p) => ({ ...p, page: 1 }));
      },
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Lead Assignment & Workload</h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-700 rounded-md">
              Team Balancing
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Distribute qualified pipeline opportunities fairly, monitor sales capacity, and track transfer audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadAllData()}
            className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Refresh assignments"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleAutoDistribute()}
            disabled={distributing || kpis.unassignedLeads === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{distributing ? 'Distributing...' : 'Auto-Distribute (Round-Robin)'}</span>
          </button>
        </div>
      </div>

      {/* KPI Strip with MetricInfoBadge */}
      <WorkKpiStrip items={kpiItems} />

      {/* Sales Team Workload Distribution Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div
          onClick={() => setShowWorkload(!showWorkload)}
          className="flex items-center justify-between px-5 py-3.5 bg-slate-50/60 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors select-none"
        >
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Sales Team Workload Distribution ({workload.length} Reps)
            </span>
            {selectedRepFilter && (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded-full">
                Filtered by Rep
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {selectedRepFilter && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRepFilter('');
                }}
                className="text-[11px] text-blue-600 hover:text-blue-800 underline font-medium"
              >
                Clear Filter
              </button>
            )}
            {showWorkload ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </div>

        {showWorkload && (
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {workload.map((rep) => {
                const isSelected = selectedRepFilter === String(rep.userId);
                return (
                  <div
                    key={rep.userId}
                    onClick={() => setSelectedRepFilter(isSelected ? '' : String(rep.userId))}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-100 shadow-xs'
                        : 'border-slate-200 bg-slate-50/40 hover:bg-slate-100/60 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-800 truncate" title={rep.name}>
                        {rep.name}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200/80 text-slate-700">
                        {rep.total} leads
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                      <span className="truncate">{rep.role}</span>
                      <span className="font-semibold text-slate-700">{rep.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(rep.percentage * 2, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Qualified Leads Assignment Workspace */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Workspace Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => {
                setStatusFilter('all');
                setSelectedRepFilter('');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              All Leads ({kpis.totalActiveLeads})
            </button>
            <button
              onClick={() => {
                setStatusFilter('unassigned');
                setSelectedRepFilter('');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'unassigned'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Unassigned ({kpis.unassignedLeads})
            </button>
            <button
              onClick={() => {
                setStatusFilter('assigned');
                setSelectedRepFilter('');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'assigned'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Assigned Only
            </button>
            <button
              onClick={() => {
                setStatusFilter('assigned_today');
                setSelectedRepFilter('');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'assigned_today'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Assigned Today ({kpis.assignedToday})
            </button>
            <button
              onClick={() => {
                setStatusFilter('reassignments');
                setSelectedRepFilter('');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'reassignments'
                  ? 'bg-white text-purple-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Reassignments ({kpis.reassignmentsCount})
            </button>
          </div>

          {/* Search bar & Bulk actions */}
          <div className="flex items-center gap-2 flex-1 md:max-w-md justify-end">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search client, phone, project..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
              />
            </form>
          </div>
        </div>

        {/* Selected Items Floating Strip */}
        {selectedLeadIds.length > 0 && (
          <div className="px-5 py-2.5 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-800">
                {selectedLeadIds.length} lead{selectedLeadIds.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedLeadIds([])}
                className="text-blue-600 hover:underline text-[11px]"
              >
                Clear
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBulkAssignModal(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Assign Selected to Rep
              </button>
              <button
                onClick={() => handleAutoDistribute(selectedLeadIds)}
                disabled={distributing}
                className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-100/60 rounded-lg transition-colors cursor-pointer"
              >
                Auto-Distribute Selected
              </button>
            </div>
          </div>
        )}

        {/* Qualified Leads Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {selectedLeadIds.length > 0 && selectedLeadIds.length === leads.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 w-44">Lead ID & Date</th>
                <th className="py-3 px-4 w-48">Client Contact</th>
                <th className="py-3 px-4 w-44">Project & Budget</th>
                <th className="py-3 px-4 min-w-[280px]">Stage & Temp</th>
                <th className="py-3 px-4 w-48">Assigned Representative</th>
                <th className="py-3 px-4 w-28 text-right">Actions</th>
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
              ) : displayLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <UserX className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">No qualified leads found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try altering filters or search criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                displayLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead._id);
                  const isAssigned = Boolean(lead.assignedTo);

                  return (
                    <tr
                      key={lead._id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectLead(lead._id)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-xs font-bold text-slate-900 tracking-tight">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-100/90 border border-slate-200/90 text-slate-800">
                            {lead.leadNumber}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-sans font-medium">
                          {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{lead.clientName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{lead.clientPhone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {lead.project || lead.projectId?.name || 'General Inquiry'}
                        </div>
                        {lead.budget > 0 && (
                          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                            ₹{lead.budget.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StageBadge
                            stage={lead.currentStageName || lead.currentStageId}
                            order={lead.currentStageOrder || lead.currentStageId?.order}
                            color={lead.currentStageId?.color || lead.currentStageId?.colorHex}
                            showOrder={true}
                          />
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              lead.temperature === 'hot'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : lead.temperature === 'warm'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-sky-50 text-sky-700 border border-sky-200'
                            }`}
                          >
                            {lead.temperature === 'hot' ? 'HOT' : lead.temperature === 'warm' ? 'WARM' : 'COLD'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isAssigned ? (
                          <div>
                            <div className="font-semibold text-slate-900">{lead.assignedTo?.name}</div>
                            <div className="text-[11px] text-slate-400">
                              {lead.assignedTo?.role || 'Sales'}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                            <UserX className="w-3 h-3" />
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setHistoryModal({ open: true, lead })}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="View assignment history"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSingleAssignModal({ open: true, lead })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              isAssigned
                                ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80'
                                : 'text-white bg-blue-600 hover:bg-blue-700 shadow-2xs'
                            }`}
                          >
                            {isAssigned ? 'Reassign' : 'Assign'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {!loading && pagination.total > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
            <div>
              Showing {leads.length} of {pagination.total} leads
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

      {/* Modals rendered with createPortal to document.body and z-[9999] */}
      <AssignmentModal
        isOpen={singleAssignModal.open}
        lead={singleAssignModal.lead}
        salesPersons={workload}
        onClose={() => setSingleAssignModal({ open: false, lead: null })}
        onSuccess={() => loadAllData()}
      />

      <BulkAssignModal
        isOpen={bulkAssignModal}
        selectedLeadIds={selectedLeadIds}
        salesPersons={workload}
        onClose={() => setBulkAssignModal(false)}
        onSuccess={() => {
          setSelectedLeadIds([]);
          loadAllData();
        }}
      />

      <AssignmentHistoryModal
        isOpen={historyModal.open}
        lead={historyModal.lead}
        onClose={() => setHistoryModal({ open: false, lead: null })}
      />
    </div>
  );
}
