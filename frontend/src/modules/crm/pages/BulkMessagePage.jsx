import React, { useState, useEffect } from 'react';
import {
  Send,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Trash2,
  Tag,
  Users,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import WorkKpiStrip from '../../../components/WorkKpiStrip';
import { crmBulkMessageApi } from '../../../api/crmBulkMessageApi';
import { useToast } from '../../../context/ToastContext';
import CampaignCreateModal from '../components/CampaignCreateModal';
import CampaignDetailsModal from '../components/CampaignDetailsModal';

export default function BulkMessagePage() {
  const { showSuccess, showError } = useToast();

  const [kpis, setKpis] = useState({
    totalCampaigns: 0,
    totalSent: 0,
    activeQueued: 0,
    successRate: 100,
    estimatedAudience: 0,
  });

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailsModal, setDetailsModal] = useState({ open: false, campaignId: null });

  useEffect(() => {
    loadAllData();
  }, [pagination.page, statusFilter]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [kpiRes, campRes] = await Promise.all([
        crmBulkMessageApi.getKPIs(),
        crmBulkMessageApi.listCampaigns({
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          status: statusFilter,
        }),
      ]);

      if (kpiRes.success) setKpis(kpiRes.data);
      if (campRes.success) {
        setCampaigns(campRes.data || []);
        setPagination((prev) => ({
          ...prev,
          total: campRes.pagination?.total || 0,
          totalPages: campRes.pagination?.totalPages || 1,
        }));
      }
    } catch (err) {
      showError(err.message || 'Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadAllData();
  };

  const handleDelete = async (campaign) => {
    if (!window.confirm(`Are you sure you want to delete campaign "${campaign.name}"?`)) {
      return;
    }

    try {
      const res = await crmBulkMessageApi.deleteCampaign(campaign._id);
      if (res.success) {
        showSuccess('Campaign deleted');
        loadAllData();
      }
    } catch (err) {
      showError(err.message || 'Failed to delete campaign');
    }
  };

  const kpiItems = [
    {
      key: 'total-campaigns',
      label: 'TOTAL CAMPAIGNS',
      value: kpis.totalCampaigns,
      status: 'neutral',
      info: {
        title: 'Broadcast Campaigns',
        summary: 'Total broadcast messaging campaigns initiated across the CRM system.',
        calculation: 'Count of bulk campaign records where deletedAt is null',
      },
    },
    {
      key: 'messages-sent',
      label: 'MESSAGES DELIVERED',
      value: kpis.totalSent.toLocaleString(),
      status: 'positive',
      info: {
        title: 'Delivered Messages',
        summary: 'Total outbound marketing and notification messages delivered to clients.',
        calculation: 'Cumulative sum of sent/delivered recipients across all campaigns',
      },
    },
    {
      key: 'reachable-audience',
      label: 'AUDIENCE REACH',
      value: `${kpis.estimatedAudience.toLocaleString()} Clients`,
      status: 'positive',
      info: {
        title: 'Audience Addressability',
        summary: 'Total unique client and broker phone contacts currently reachable in CRM.',
        calculation: 'Count of distinct phone records across Enquiries, Leads, and Brokers',
      },
    },
    {
      key: 'success-rate',
      label: 'SUCCESS RATE',
      value: `${kpis.successRate}%`,
      status: 'positive',
      info: {
        title: 'Broadcast Success Rate',
        summary: 'Proportion of dispatched messages successfully delivered to recipient handsets.',
        calculation: '(totalDelivered / totalSent) * 100',
      },
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Full-width Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bulk Broadcast & Campaigns</h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-md">
              Marketing Blast
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Broadcast promotional villa offers, plot launches, and broker incentives to filtered audience segments
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Campaigns"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <WorkKpiStrip items={kpiItems} />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs w-full flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-colors"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="running">Running</option>
            <option value="queued">Queued</option>
            <option value="paused">Paused</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden w-full">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-emerald-600 border-t-transparent mb-3" />
            <p className="text-xs text-slate-500">Loading broadcast campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-16 text-center">
            <Send className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No campaigns launched yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create and broadcast marketing announcements, holiday offers, or project updates to clients and brokers.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Launch First Campaign</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Campaign Name & Creator</th>
                  <th className="py-3 px-4">Target Audience Segment</th>
                  <th className="py-3 px-4">Template & Preview</th>
                  <th className="py-3 px-4 min-w-[160px]">Delivery Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((camp) => {
                  const percent =
                    camp.total > 0 ? Math.round(((camp.delivered || 0) / camp.total) * 100) : 100;
                  const selMode = camp.selection?.mode || 'all';

                  return (
                    <tr key={camp._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Creator */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{camp.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          By {camp.createdBy?.name || 'CRM Team'}
                        </div>
                      </td>

                      {/* Audience */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800 capitalize">
                            {selMode === 'all'
                              ? 'All Clients'
                              : selMode === 'brokers'
                              ? 'Broker Network'
                              : selMode === 'status'
                              ? 'By Status'
                              : selMode === 'lead'
                              ? 'Pipeline Leads'
                              : 'Project Visits'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {camp.total} recipients targeted
                        </div>
                      </td>

                      {/* Template */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[150px]">{camp.templateName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px] mt-0.5">
                          {camp.bodyText}
                        </div>
                      </td>

                      {/* Delivery Progress */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-slate-900">
                            {camp.delivered || 0} / {camp.total}
                          </span>
                          <span className="text-slate-400 font-medium">{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            camp.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : camp.status === 'running'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                              : camp.status === 'failed'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {camp.status === 'completed' ? (
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          ) : (
                            <Clock className="w-2.5 h-2.5" />
                          )}
                          <span className="capitalize">{camp.status}</span>
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        {new Date(camp.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailsModal({ open: true, campaignId: camp._id })}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                            title="View Broadcast Report"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(camp)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Delete Campaign"
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
              campaigns)
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

      {/* Campaign Create Modal */}
      <CampaignCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          loadAllData();
        }}
      />

      {/* Campaign Details Report Modal */}
      <CampaignDetailsModal
        isOpen={detailsModal.open}
        onClose={() => setDetailsModal({ open: false, campaignId: null })}
        campaignId={detailsModal.campaignId}
      />
    </div>
  );
}
