import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Handshake,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Award,
  Phone,
  Mail,
  MapPin,
  Building,
  TrendingUp,
  Eye,
  Edit2,
  Trash2,
  Network,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import WorkKpiStrip from '../../../components/WorkKpiStrip';
import { crmBrokerApi } from '../../../api/crmBrokerApi';
import { crmLeadAssignmentApi } from '../../../api/crmLeadAssignmentApi';
import { useToast } from '../../../context/ToastContext';
import BrokerFormModal from '../components/BrokerFormModal';
import BrokerDetailsModal from '../components/BrokerDetailsModal';

const LEVEL_COLORS = {
  Associate: 'bg-slate-100 text-slate-700 border-slate-200',
  Executive: 'bg-blue-50 text-blue-700 border-blue-200',
  'Sales Manager': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Senior Sales Manager': 'bg-teal-50 text-teal-700 border-teal-200',
  'Area Sales Manager': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Regional Sales Manager': 'bg-amber-50 text-amber-800 border-amber-200',
  'Assistant Sales Director': 'bg-purple-50 text-purple-700 border-purple-200',
  'Sales Director': 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
};

export default function BrokersPage() {
  const { showSuccess, showError } = useToast();

  const [kpis, setKpis] = useState({
    totalBrokers: 0,
    seniorBrokers: 0,
    totalYards: 0,
    totalReferralLeads: 0,
  });

  const [brokers, setBrokers] = useState([]);
  const [salesPersons, setSalesPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [formModal, setFormModal] = useState({ open: false, broker: null });
  const [detailsModal, setDetailsModal] = useState({ open: false, brokerId: null });

  useEffect(() => {
    loadSalesPersons();
  }, []);

  useEffect(() => {
    loadAllData();
  }, [pagination.page, levelFilter, statusFilter]);

  const loadSalesPersons = async () => {
    try {
      const res = await crmLeadAssignmentApi.getWorkload();
      if (res.success && Array.isArray(res.data)) {
        setSalesPersons(res.data.map((w) => w.user || w).filter(Boolean));
      }
    } catch (err) {
      console.error('Failed to load sales team:', err);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [kpiRes, brokersRes] = await Promise.all([
        crmBrokerApi.getKPIs(),
        crmBrokerApi.listBrokers({
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          level: levelFilter,
          status: statusFilter,
        }),
      ]);

      if (kpiRes.success) setKpis(kpiRes.data);
      if (brokersRes.success) {
        setBrokers(brokersRes.data || []);
        setPagination((prev) => ({
          ...prev,
          total: brokersRes.pagination?.total || 0,
          totalPages: brokersRes.pagination?.totalPages || 1,
        }));
      }
    } catch (err) {
      showError(err.message || 'Failed to load channel partner data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadAllData();
  };

  const handleDelete = async (broker) => {
    if (!window.confirm(`Are you sure you want to deactivate channel partner "${broker.name}"?`)) {
      return;
    }
    try {
      const res = await crmBrokerApi.deleteBroker(broker._id);
      if (res.success) {
        showSuccess('Channel partner removed successfully');
        loadAllData();
      }
    } catch (err) {
      showError(err.message || 'Failed to delete channel partner');
    }
  };

  const kpiItems = [
    {
      key: 'total-partners',
      label: 'TOTAL ASSOCIATES',
      value: kpis.totalBrokers,
      status: 'neutral',
      active: !levelFilter && !statusFilter,
      info: {
        title: 'Registered Channel Partners',
        summary: 'Active external brokers and channel associates generating sales in the partner network.',
        calculation: 'Count of active channel partners in Broker master (status not Inactive)',
      },
      onClick: () => {
        setLevelFilter('');
        setStatusFilter('');
        setPagination((p) => ({ ...p, page: 1 }));
      },
    },
    {
      key: 'total-yards',
      label: 'TOTAL YARDS SOLD',
      value: `${kpis.totalYards.toLocaleString()} Sq.Yd`,
      status: 'positive',
      info: {
        title: 'Cumulative Yards (Gaj) Sold',
        summary: 'Aggregate plot and villa land area sold through channel partner network transactions.',
        calculation: 'Sum of totalYards across all active channel partners',
      },
      onClick: () => {
        setLevelFilter('');
        setStatusFilter('');
        setPagination((p) => ({ ...p, page: 1 }));
      },
    },
    {
      key: 'referral-leads',
      label: 'ACTIVE BROKER LEADS',
      value: kpis.totalReferralLeads,
      status: 'positive',
      active: statusFilter === 'Active',
      info: {
        title: 'Partner Referral Pipeline',
        summary: 'Active buyer leads currently introduced through channel partner referrals.',
        calculation: 'Count of leads with source Channel Partner / Broker and status not Lost',
      },
      onClick: () => {
        setStatusFilter('Active');
        setPagination((p) => ({ ...p, page: 1 }));
      },
    },
    {
      key: 'senior-partners',
      label: 'SENIOR PARTNERS',
      value: kpis.seniorBrokers,
      status: 'neutral',
      active: levelFilter === 'Sales Manager',
      info: {
        title: 'Senior Network Partners',
        summary: 'Partners who achieved Sales Manager level and above through cumulative sales volume.',
        calculation: 'Count of brokers with level in Sales Manager through Sales Director (500+ yards)',
      },
      onClick: () => {
        setLevelFilter('Sales Manager');
        setPagination((p) => ({ ...p, page: 1 }));
      },
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Full-width Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Channel Partners & Brokers</h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-700 rounded-md">
              8-Tier Network
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage real estate channel partners, commission tiers, and cumulative Gaj sales milestones
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
            title="Refresh Partners"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/crm/network"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors shadow-2xs"
          >
            <Network className="w-4 h-4" />
            <span>Network Hierarchy Tree</span>
          </Link>

          <button
            onClick={() => setFormModal({ open: true, broker: null })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Partner</span>
          </button>
        </div>
      </div>

      {/* KPI Strip with MetricInfoBadge */}
      <WorkKpiStrip items={kpiItems} />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs w-full flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by partner name, phone, agency, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-colors"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={levelFilter}
            onChange={(e) => {
              setLevelFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">All Tiers / Levels</option>
            <option value="Associate">Associate (0 - 199 Yd)</option>
            <option value="Executive">Executive (200 - 499 Yd)</option>
            <option value="Sales Manager">Sales Manager (500 - 999 Yd)</option>
            <option value="Senior Sales Manager">Senior Sales Manager (1,000 - 1,999 Yd)</option>
            <option value="Area Sales Manager">Area Sales Manager (2,000 - 3,999 Yd)</option>
            <option value="Regional Sales Manager">Regional Sales Manager (4,000 - 6,999 Yd)</option>
            <option value="Assistant Sales Director">Assistant Sales Director (7,000 - 9,999 Yd)</option>
            <option value="Sales Director">Sales Director (10,000+ Yd)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Probation">Probation</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Brokers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden w-full">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent mb-3" />
            <p className="text-xs text-slate-500">Loading channel partners...</p>
          </div>
        ) : brokers.length === 0 ? (
          <div className="py-16 text-center">
            <Handshake className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No channel partners found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Register new channel partners to track their sales yardage, tiers, and referral commissions.
            </p>
            <button
              onClick={() => setFormModal({ open: true, broker: null })}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Partner</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Partner Code & Name</th>
                  <th className="py-3 px-4">Agency / City</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Tier & Commission</th>
                  <th className="py-3 px-4 min-w-[160px]">Sales Volume & Milestone</th>
                  <th className="py-3 px-4">Managing Rep</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {brokers.map((broker) => {
                  const progress = broker.progress || {};
                  return (
                    <tr key={broker._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Code */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {broker.name ? broker.name.charAt(0).toUpperCase() : 'B'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{broker.name}</span>
                              {broker.code && (
                                <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded border border-slate-200">
                                  {broker.code}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              {broker.email ? (
                                <a
                                  href={`mailto:${broker.email}`}
                                  className="hover:text-blue-600 truncate max-w-[140px]"
                                >
                                  {broker.email}
                                </a>
                              ) : (
                                <span>No email</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Agency & City */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{broker.agencyName || 'Independent'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{broker.city || 'Jaipur'}</span>
                        </div>
                      </td>

                      {/* Contact Phone */}
                      <td className="py-3 px-4">
                        <a
                          href={`tel:${broker.phone}`}
                          className="font-medium text-slate-800 hover:text-blue-600 flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{broker.phone}</span>
                        </a>
                        {broker.alternatePhone && (
                          <div className="text-[11px] text-slate-400 mt-0.5 pl-4">
                            Alt: {broker.alternatePhone}
                          </div>
                        )}
                      </td>

                      {/* Tier & Commission */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            LEVEL_COLORS[broker.level] || 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <Award className="w-2.5 h-2.5" />
                          {broker.level}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <span className="font-medium">{broker.commissionRate || 2}%</span>
                          <span className="text-slate-400">comm.</span>
                        </div>
                      </td>

                      {/* Sales Volume & Milestone Progress */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-slate-900">
                            {(broker.totalYards || 0).toLocaleString()} Sq.Yd
                          </span>
                          <span className="text-slate-400 font-medium">
                            {progress.percentage || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(progress.percentage || 0, 100)}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 truncate">
                          {progress.nextTier ? (
                            <span>
                              {progress.remainingYards?.toLocaleString()} Yd to {progress.nextTier}
                            </span>
                          ) : (
                            <span className="text-rose-600 font-semibold">Top Leadership Tier</span>
                          )}
                        </div>
                      </td>

                      {/* Managing Rep */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {broker.managedBy?.name || 'Unassigned'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {broker.managedBy?.role || 'CRM Desk'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailsModal({ open: true, brokerId: broker._id })}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            title="View Full Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setFormModal({ open: true, broker })}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                            title="Edit Partner"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(broker)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Delete Partner"
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
              partners)
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

      {/* Form Modal */}
      <BrokerFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, broker: null })}
        onSuccess={() => {
          setFormModal({ open: false, broker: null });
          loadAllData();
        }}
        broker={formModal.broker}
        salesPersons={salesPersons}
      />

      {/* Details Modal */}
      <BrokerDetailsModal
        isOpen={detailsModal.open}
        onClose={() => setDetailsModal({ open: false, brokerId: null })}
        brokerId={detailsModal.brokerId}
        onEdit={(brokerToEdit) => {
          setDetailsModal({ open: false, brokerId: null });
          setFormModal({ open: true, broker: brokerToEdit });
        }}
      />
    </div>
  );
}
