import React, { useState, useEffect } from 'react';
import {
  Share2,
  RefreshCw,
  Plus,
  Search,
  Filter,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ExternalLink,
  Tag,
  FileText,
  User,
  CheckSquare,
  Square,
} from 'lucide-react';
import WorkKpiStrip from '../../../components/WorkKpiStrip';
import { crmMetaLeadApi } from '../../../api/crmMetaLeadApi';
import { crmLeadAssignmentApi } from '../../../api/crmLeadAssignmentApi';
import { useToast } from '../../../context/ToastContext';
import MetaLeadAddModal from '../components/MetaLeadAddModal';
import MetaLeadAssignModal from '../components/MetaLeadAssignModal';

export default function MetaLeadsPage() {
  const { showSuccess, showError } = useToast();

  const [kpis, setKpis] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    skipped: 0,
  });

  const [leads, setLeads] = useState([]);
  const [salesPersons, setSalesPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters & Selection
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [assignModal, setAssignModal] = useState({ open: false, leads: [] });

  useEffect(() => {
    loadSalesPersons();
  }, []);

  useEffect(() => {
    loadAllData();
  }, [pagination.page, statusFilter]);

  const loadSalesPersons = async () => {
    try {
      const res = await crmLeadAssignmentApi.getWorkload();
      if (res.success && Array.isArray(res.data)) {
        setSalesPersons(res.data.map((w) => w.user));
      }
    } catch (err) {
      console.error('Failed to load sales team:', err);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [kpiRes, leadsRes] = await Promise.all([
        crmMetaLeadApi.getKPIs(),
        crmMetaLeadApi.listLeads({
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          status: statusFilter,
        }),
      ]);

      if (kpiRes.success) setKpis(kpiRes.data);
      if (leadsRes.success) {
        setLeads(leadsRes.data || []);
        setPagination((prev) => ({
          ...prev,
          total: leadsRes.pagination?.total || 0,
          totalPages: leadsRes.pagination?.totalPages || 1,
        }));
      }
    } catch (err) {
      showError(err.message || 'Failed to load Meta leads');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadAllData();
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await crmMetaLeadApi.syncLeads();
      if (res.success) {
        showSuccess(
          `Sync complete: checked ${res.data.pendingChecked} pending leads, linked ${res.data.linkedToExistingEnquiry} to CRM`
        );
        loadAllData();
      }
    } catch (err) {
      showError(err.message || 'Failed to sync Meta leads');
    } finally {
      setSyncing(false);
    }
  };

  const toggleSelectLead = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    const pendingOnPage = leads.filter((l) => l.status === 'pending');
    if (selectedIds.length === pendingOnPage.length && pendingOnPage.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingOnPage.map((l) => l._id));
    }
  };

  const handleSkipLead = async (lead) => {
    const reason = window.prompt(
      'Enter skip reason (e.g. duplicateOnMeta, invalidPhone, out of budget):',
      'duplicateOnMeta'
    );
    if (!reason) return;

    try {
      const res = await crmMetaLeadApi.skipLead(lead._id, reason);
      if (res.success) {
        showSuccess('Lead marked as skipped');
        loadAllData();
      }
    } catch (err) {
      showError(err.message || 'Failed to skip lead');
    }
  };

  const handleDeleteLead = async (lead) => {
    if (!window.confirm(`Delete lead submission for "${lead.clientName}"?`)) return;
    try {
      const res = await crmMetaLeadApi.deleteLead(lead._id);
      if (res.success) {
        showSuccess('Lead removed from holding area');
        setSelectedIds((prev) => prev.filter((id) => id !== lead._id));
        loadAllData();
      }
    } catch (err) {
      showError(err.message || 'Failed to delete lead');
    }
  };

  const pendingOnPage = leads.filter((l) => l.status === 'pending');
  const isAllPendingSelected =
    pendingOnPage.length > 0 && selectedIds.length === pendingOnPage.length;

  const kpiItems = [
    {
      key: 'total-meta-leads',
      label: 'TOTAL AD LEADS',
      value: kpis.total,
      status: 'neutral',
      info: {
        title: 'Meta Ad Form Submissions',
        summary: 'All prospective customer inquiries captured across Facebook and Instagram lead forms.',
        calculation: 'Total count of records in Meta Leads holding area',
      },
    },
    {
      key: 'pending-meta-leads',
      label: 'PENDING ASSIGNMENT',
      value: kpis.pending,
      status: kpis.pending > 0 ? 'warning' : 'positive',
      info: {
        title: 'Unassigned Holding Queue',
        summary: 'Fresh leads waiting to be verified and distributed to sales representatives.',
        calculation: 'Count of Meta leads with status = pending',
      },
    },
    {
      key: 'assigned-meta-leads',
      label: 'RELEASED TO CRM',
      value: kpis.assigned,
      status: 'positive',
      info: {
        title: 'Assigned into CRM Pipeline',
        summary: 'Leads converted into active CRM enquiries and handed to sales team members.',
        calculation: 'Count of Meta leads with status = assigned',
      },
    },
    {
      key: 'skipped-meta-leads',
      label: 'SKIPPED / DUPLICATES',
      value: kpis.skipped,
      status: 'neutral',
      info: {
        title: 'Skipped Submissions',
        summary: 'Submissions filtered out due to duplicate phone numbers or test form clicks.',
        calculation: 'Count of Meta leads with status = skipped',
      },
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Full-width Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Meta & Ad Campaign Leads</h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-700 rounded-md">
              LeadGen Holding Area
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Holding area for Facebook & Instagram lead forms. An Enquiry is created only once assigned to a sales rep.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
            title="Refresh Leads"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync from Meta'}</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Simulate Ad Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <WorkKpiStrip items={kpiItems} />

      {/* Batch Assign Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold text-purple-900">
              Pending leads selected for team distribution
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-xs text-purple-700 hover:bg-purple-100 rounded-lg transition-colors font-medium"
            >
              Clear Selection
            </button>
            <button
              onClick={() =>
                setAssignModal({
                  open: true,
                  leads: leads.filter((l) => selectedIds.includes(l._id)),
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assign {selectedIds.length} Leads to Team</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs w-full flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client name, phone, campaign, form..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-colors"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
              setSelectedIds([]);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">All Statuses ({kpis.total})</option>
            <option value="pending">Pending ({kpis.pending})</option>
            <option value="assigned">Assigned ({kpis.assigned})</option>
            <option value="skipped">Skipped ({kpis.skipped})</option>
          </select>
        </div>
      </div>

      {/* Meta Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden w-full">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent mb-3" />
            <p className="text-xs text-slate-500">Loading ad leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center">
            <Share2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No ad leads found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Simulate or sync incoming Facebook & Instagram lead ad submissions into this holding queue.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simulate Ad Lead</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      title={isAllPendingSelected ? 'Deselect all pending' : 'Select all pending'}
                    >
                      {isAllPendingSelected ? (
                        <CheckSquare className="w-4 h-4 text-purple-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">Client Contact</th>
                  <th className="py-3 px-3">Campaign & Form</th>
                  <th className="py-3 px-3">Requirement & Budget</th>
                  <th className="py-3 px-3">Submitted At</th>
                  <th className="py-3 px-3">Status & Owner</th>
                  <th className="py-3 px-3">CRM Reference</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => {
                  const isPending = lead.status === 'pending';
                  const isSelected = selectedIds.includes(lead._id);

                  return (
                    <tr
                      key={lead._id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-purple-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => toggleSelectLead(lead._id)}
                            className="text-slate-400 hover:text-purple-600 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-300">•</span>
                        )}
                      </td>

                      {/* Client Contact */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{lead.clientName}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <a href={`tel:${lead.clientPhone}`} className="hover:text-blue-600 font-medium">
                            {lead.clientPhone}
                          </a>
                        </div>
                        {lead.clientEmail && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {lead.clientEmail}
                          </div>
                        )}
                      </td>

                      {/* Campaign & Form */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="truncate max-w-[160px]">{lead.campaignName || 'Meta Ad Campaign'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{lead.formName || 'Lead Form'}</span>
                        </div>
                      </td>

                      {/* Requirement & Budget */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 truncate max-w-[180px]">
                          {lead.requirement || 'General Inquiry'}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          {lead.budget || 'Not specified'}
                        </div>
                      </td>

                      {/* Submitted At */}
                      <td className="py-3 px-3 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(lead.metaCreatedAt || lead.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 pl-4">
                          {new Date(lead.metaCreatedAt || lead.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Status & Owner */}
                      <td className="py-3 px-3">
                        {lead.status === 'assigned' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Assigned
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                              {lead.assignedTo?.name || 'CRM Lead Owner'}
                            </div>
                          </div>
                        ) : lead.status === 'skipped' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              Skipped
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {lead.skipReason || 'Duplicate'}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* CRM Reference */}
                      <td className="py-3 px-3">
                        {lead.enquiryId ? (
                          <span className="font-mono text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                            {lead.enquiryId.enquiryNumber || 'ENQ-CRM'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-300 italic">Not in CRM</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isPending && (
                            <>
                              <button
                                onClick={() => setAssignModal({ open: true, leads: [lead] })}
                                className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors cursor-pointer"
                                title="Assign to Sales Rep"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleSkipLead(lead)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                                title="Mark as Skipped"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteLead(lead)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing page <span className="font-semibold text-slate-900">{pagination.page}</span> of{' '}
              <span className="font-semibold text-slate-900">{pagination.totalPages}</span> ({pagination.total}{' '}
              leads)
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-2.5 py-1 border border-slate-200 rounded-md bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-2.5 py-1 border border-slate-200 rounded-md bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      <MetaLeadAddModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => {
          setIsAddOpen(false);
          loadAllData();
        }}
      />

      {/* Assign Modal */}
      <MetaLeadAssignModal
        isOpen={assignModal.open}
        onClose={() => setAssignModal({ open: false, leads: [] })}
        onSuccess={() => {
          setAssignModal({ open: false, leads: [] });
          setSelectedIds([]);
          loadAllData();
        }}
        selectedLeads={assignModal.leads}
        salesPersons={salesPersons}
      />
    </div>
  );
}
