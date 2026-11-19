import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Kanban,
  Table as TableIcon,
  Phone,
  Mail,
  MapPin,
  Building,
  ArrowRight,
  CheckCircle2,
  Clock,
  User,
  Users,
  TrendingUp,
  Filter,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { crmLeadApi } from '../../../api/crmLeadApi';
import { crmProjectApi } from '../../../api/crmProjectApi';
import { useToast } from '../../../context/ToastContext';
import WorkKpiStrip from '../../../components/WorkKpiStrip';
import StageBadge, { formatShortStageName } from '../components/StageBadge';
import LeadDetailsModal from '../components/LeadDetailsModal';
import LeadFormModal from '../components/LeadFormModal';

export default function LeadsPage() {
  const { showSuccess, showError } = useToast();

  const [leads, setLeads] = useState([]);
  const [stages, setStages] = useState([]);
  const [projects, setProjects] = useState([]);
  const [kpis, setKpis] = useState({
    totalLeads: 0,
    activePipeline: 0,
    visitStageCount: 0,
    wonDeals: 0,
    droppedCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [temperatureFilter, setTemperatureFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');

  // Modals
  const [selectedLead, setSelectedLead] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Load Stages & Projects
  const loadMasterData = useCallback(async () => {
    try {
      const [stagesRes, projectsRes] = await Promise.all([
        crmLeadApi.getStages(),
        crmProjectApi.getProjects(),
      ]);
      const stageList = stagesRes?.data || (Array.isArray(stagesRes) ? stagesRes : []);
      const projectList = projectsRes?.data || (Array.isArray(projectsRes) ? projectsRes : []);
      setStages(stageList);
      setProjects(projectList);
    } catch (err) {
      console.error('Failed to load master stages/projects', err);
    }
  }, []);

  // Load Leads & KPIs
  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (temperatureFilter !== 'all') params.temperature = temperatureFilter;
      if (stageFilter !== 'all') params.stageId = stageFilter;

      const res = await crmLeadApi.getLeads(params);
      const leadsList =
        res?.leads ||
        res?.data?.leads ||
        (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
      setLeads(leadsList || []);

      if (res?.kpis) {
        setKpis(res.kpis);
      } else if (res?.data?.kpis) {
        setKpis(res.data.kpis);
      }

      if (res?.stages) {
        setStages(res.stages);
      } else if (res?.data?.stages) {
        setStages(res.data.stages);
      }
    } catch (err) {
      showError(err.message || 'Failed to load leads pipeline');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, temperatureFilter, stageFilter, showError]);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Handle opening details
  const handleOpenDetails = async (lead) => {
    try {
      const full = await crmLeadApi.getLeadById(lead._id);
      setSelectedLead(full?.data || full || lead);
      setDetailsModalOpen(true);
    } catch (err) {
      setSelectedLead(lead);
      setDetailsModalOpen(true);
    }
  };

  // Quick Advance Stage directly from card
  const handleQuickAdvance = async (e, lead) => {
    e.stopPropagation();
    const currentOrder = lead.currentStageOrder || 1;
    const nextStage = stages.find((s) => s.order === currentOrder + 1);
    if (!nextStage) {
      return handleOpenDetails(lead);
    }
    try {
      await crmLeadApi.moveStage(lead._id, {
        toStageId: nextStage._id,
        comment: `Advanced from ${lead.currentStageName} to ${nextStage.name}`,
      });
      showSuccess(`Lead moved to ${nextStage.name}`);
      loadLeads();
    } catch (err) {
      showError(err.message || 'Failed to advance stage');
    }
  };

  // KPI Strip Configuration with MetricInfoBadges
  const kpiItems = [
    {
      key: 'total-leads',
      id: 'total-leads',
      label: 'TOTAL LEADS',
      value: kpis.totalLeads,
      hint: 'All customer leads registered',
      tone: 'blue',
      icon: Users,
      info: {
        title: 'Total Leads',
        summary: 'All active, in-progress, won, and dropped customer opportunities registered in the CRM pipeline.',
        calculation: 'Count of all non-deleted lead records in the CRM database.',
      },
      onClick: () => {
        setStatusFilter('all');
        setStageFilter('all');
      },
    },
    {
      key: 'active-pipeline',
      id: 'active-pipeline',
      label: 'ACTIVE PIPELINE',
      value: kpis.activePipeline,
      hint: 'In active stage progression',
      tone: 'sky',
      icon: TrendingUp,
      info: {
        title: 'Active Pipeline',
        summary: 'Qualified buyers currently moving through the 8-stage sales progression pipeline.',
        calculation: 'Leads where status = "active".',
      },
      onClick: () => {
        setStatusFilter('active');
        setStageFilter('all');
      },
    },
    {
      key: 'visit-stage',
      id: 'VISIT STAGE',
      label: 'VISIT STAGE',
      value: kpis.visitStageCount,
      hint: 'Visit Confirmed & Feedback',
      tone: 'purple',
      icon: MapPin,
      info: {
        title: 'Site Visit Stage',
        summary: 'Leads that have confirmed a physical project tour or completed a site visit awaiting feedback.',
        calculation: 'Active leads where stage is "Visit Confirmed" (Step 4) or "Feedback Call" (Step 5).',
      },
      onClick: () => {
        setStatusFilter('active');
        const visitStage = stages.find((s) => s.order === 4);
        if (visitStage) setStageFilter(visitStage._id);
      },
    },
    {
      key: 'won-deals',
      id: 'won-deals',
      label: 'WON DEALS',
      value: kpis.wonDeals,
      hint: 'Closed bookings & sales',
      tone: 'emerald',
      icon: CheckCircle2,
      info: {
        title: 'Won Deals',
        summary: 'Successfully closed sales transactions with finalized plot/villa inventory and booking revenue.',
        calculation: 'Leads where status = "won".',
      },
      onClick: () => {
        setStatusFilter('won');
        setStageFilter('all');
      },
    },
    {
      key: 'dropped-leads',
      id: 'dropped-leads',
      label: 'DROPPED / LOST',
      value: kpis.droppedCount,
      hint: 'Withdrawn or lost leads',
      tone: 'danger',
      icon: Clock,
      info: {
        title: 'Dropped & Lost Leads',
        summary: 'Leads that exited the pipeline due to competitor purchase, budget mismatch, or unresponsive calls.',
        calculation: 'Leads where status in ["dropped", "lost"].',
      },
      onClick: () => {
        setStatusFilter('dropped');
        setStageFilter('all');
      },
    },
  ];

  const getTempPill = (temp) => {
    switch (temp) {
      case 'hot':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">HOT</span>;
      case 'cold':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">COLD</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">WARM</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'won':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Won</span>;
      case 'lost':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">Lost</span>;
      case 'dropped':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">Dropped</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">Active</span>;
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Leads & Sales Pipeline</h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full">
              CRM Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track qualified buyers through 8 pipeline stages from visit confirmation call to final deal token closing.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-blue-600 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={loadLeads}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh Leads"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip with Interactive Info Badges */}
      <WorkKpiStrip items={kpiItems} columns="grid-cols-2 sm:grid-cols-5" />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name, phone, code or project..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="won">Won Deals</option>
            <option value="lost">Lost</option>
            <option value="dropped">Dropped</option>
          </select>

          <select
            value={temperatureFilter}
            onChange={(e) => setTemperatureFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="all">All Temperatures</option>
            <option value="hot">🔥 Hot</option>
            <option value="warm">⚡ Warm</option>
            <option value="cold">❄ Cold</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-blue-500 max-w-[180px] truncate"
          >
            <option value="all">All Stages</option>
            {stages.map((st) => (
              <option key={st._id} value={st._id}>
                S{st.order}: {formatShortStageName(st.name, st.order)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200 animate-pulse w-full">
          Loading Leads Pipeline...
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN / PIPELINE STAGE BOARD */
        <div className="overflow-x-auto pb-4 w-full">
          <div className="flex gap-4 min-w-[1400px] items-start">
            {stages.map((st) => {
              const stageLeads = leads.filter(
                (l) => String(l.currentStageId?._id || l.currentStageId) === String(st._id)
              );

              return (
                <div
                  key={st._id}
                  className="w-72 shrink-0 bg-slate-100/70 border border-slate-200/80 rounded-xl p-3 flex flex-col max-h-[750px]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${st.order === 4 || st.order === 8 ? 'bg-emerald-500' : 'bg-slate-400'}`}
                      />
                      <span className="text-xs font-bold text-slate-800 truncate" title={st.name}>
                        S{st.order}: {formatShortStageName(st.name, st.order)}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Stage Leads Cards */}
                  <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                    {stageLeads.length === 0 ? (
                      <div className="py-10 text-center flex flex-col items-center justify-center text-[11px] text-slate-400 gap-1.5">
                        <Layers className="w-5 h-5 text-slate-300 stroke-1" />
                        <span>No leads in this stage</span>
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <div
                          key={lead._id}
                          onClick={() => handleOpenDetails(lead)}
                          className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer space-y-2 group"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {lead.clientName}
                              </h4>
                              <span className="text-[10px] font-mono text-slate-400">
                                {lead.leadNumber}
                              </span>
                            </div>
                            {getTempPill(lead.temperature)}
                          </div>

                          <div className="text-[11px] text-slate-500 space-y-1">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{lead.clientPhone}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Building className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{lead.project || 'Project N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 font-semibold text-slate-700">
                              <span>₹{Number(lead.budget || 0).toLocaleString('en-IN')}</span>
                              {getStatusBadge(lead.status)}
                            </div>
                          </div>

                          {/* Quick advance shortcut */}
                          {lead.status === 'active' && st.order < stages.length && (
                            <button
                              type="button"
                              onClick={(e) => handleQuickAdvance(e, lead)}
                              className="w-full mt-1.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center gap-1 transition-colors"
                              title="Advance to next stage"
                            >
                              <span>Advance Step</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-44 whitespace-nowrap">Lead ID & Date</th>
                  <th className="py-3 px-4 w-48">Client Name & Phone</th>
                  <th className="py-3 px-4 min-w-[240px]">Current Stage</th>
                  <th className="py-3 px-4 w-20">Temp</th>
                  <th className="py-3 px-4 w-40">Project</th>
                  <th className="py-3 px-4 w-28">Budget</th>
                  <th className="py-3 px-4 w-24">Status</th>
                  <th className="py-3 px-4 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2 stroke-1" />
                      <span className="text-xs font-semibold text-slate-600 block mb-1">No leads found</span>
                      <span className="text-[11px] text-slate-400 block mb-3">
                        Qualify an enquiry from the Enquiries page or register a new walk-in lead.
                      </span>
                      <button
                        type="button"
                        onClick={() => setCreateModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Register Lead
                      </button>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                  <tr
                    key={lead._id}
                    onClick={() => handleOpenDetails(lead)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono text-xs font-bold text-slate-900 tracking-tight">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100/90 border border-slate-200/90 text-slate-800">
                          {lead.leadNumber}
                        </span>
                      </div>
                      {lead.createdAt && (
                        <div className="text-[10px] text-slate-400 mt-0.5 font-sans font-medium">
                          {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{lead.clientName}</div>
                      <div className="text-[11px] text-slate-400">{lead.clientPhone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <StageBadge
                        stage={lead.currentStageName || lead.currentStageId}
                        order={lead.currentStageOrder || lead.currentStageId?.order}
                        color={lead.currentStageId?.color || lead.currentStageId?.colorHex}
                        showOrder={true}
                      />
                    </td>
                    <td className="py-3 px-4">{getTempPill(lead.temperature)}</td>
                    <td className="py-3 px-4 font-medium">{lead.project || '-'}</td>
                    <td className="py-3 px-4 font-semibold">₹{Number(lead.budget || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">{getStatusBadge(lead.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetails(lead);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        View & Manage
                      </button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lead Details Modal */}
      {detailsModalOpen && selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          stages={stages}
          projects={projects}
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          onUpdate={() => {
            loadLeads();
            handleOpenDetails(selectedLead);
          }}
        />
      )}

      {/* Create Lead Modal */}
      {createModalOpen && (
        <LeadFormModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={loadLeads}
          projects={projects}
        />
      )}
    </div>
  );
}
