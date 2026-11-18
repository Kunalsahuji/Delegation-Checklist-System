import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Network,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Plus,
  ArrowLeft,
  Building,
  MapPin,
  Phone,
  Eye,
  TrendingUp,
  Crown,
  Shield,
  Star,
} from 'lucide-react';
import WorkKpiStrip from '../../../components/WorkKpiStrip';
import { crmBrokerApi } from '../../../api/crmBrokerApi';
import { crmLeadAssignmentApi } from '../../../api/crmLeadAssignmentApi';
import { useToast } from '../../../context/ToastContext';
import BrokerFormModal from '../components/BrokerFormModal';
import BrokerDetailsModal from '../components/BrokerDetailsModal';

const TIER_ICONS = {
  'Sales Director': Crown,
  'Assistant Sales Director': Award,
  'Regional Sales Manager': Star,
  'Area Sales Manager': Shield,
  'Senior Sales Manager': Users,
  'Sales Manager': Users,
  Executive: Users,
  Associate: Users,
};

const TIER_GRADIENTS = {
  'Sales Director': 'from-rose-500/10 via-purple-500/10 to-transparent border-rose-200',
  'Assistant Sales Director': 'from-purple-500/10 via-indigo-500/10 to-transparent border-purple-200',
  'Regional Sales Manager': 'from-amber-500/10 via-orange-500/10 to-transparent border-amber-200',
  'Area Sales Manager': 'from-indigo-500/10 via-blue-500/10 to-transparent border-indigo-200',
  'Senior Sales Manager': 'from-teal-500/10 via-emerald-500/10 to-transparent border-teal-200',
  'Sales Manager': 'from-emerald-500/10 via-green-500/10 to-transparent border-emerald-200',
  Executive: 'from-blue-500/10 via-cyan-500/10 to-transparent border-blue-200',
  Associate: 'from-slate-500/10 via-gray-500/10 to-transparent border-slate-200',
};

const TIER_BADGES = {
  'Sales Director': 'bg-rose-100 text-rose-800 border-rose-300',
  'Assistant Sales Director': 'bg-purple-100 text-purple-800 border-purple-300',
  'Regional Sales Manager': 'bg-amber-100 text-amber-900 border-amber-300',
  'Area Sales Manager': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'Senior Sales Manager': 'bg-teal-100 text-teal-800 border-teal-300',
  'Sales Manager': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Executive: 'bg-blue-100 text-blue-800 border-blue-300',
  Associate: 'bg-slate-100 text-slate-700 border-slate-300',
};

export default function BrokerNetworkPage() {
  const { showSuccess, showError } = useToast();

  const [hierarchyData, setHierarchyData] = useState([]);
  const [totalBrokers, setTotalBrokers] = useState(0);
  const [salesPersons, setSalesPersons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Expanded tier cards state
  const [expandedTiers, setExpandedTiers] = useState({});

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailsModal, setDetailsModal] = useState({ open: false, brokerId: null });

  useEffect(() => {
    loadSalesPersons();
    loadNetwork();
  }, []);

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

  const loadNetwork = async () => {
    try {
      setLoading(true);
      const res = await crmBrokerApi.getNetwork();
      if (res.success) {
        setTotalBrokers(res.data.totalBrokers || 0);
        setHierarchyData(res.data.hierarchy || []);

        // Expand tiers with members by default
        const initialExpanded = {};
        (res.data.hierarchy || []).forEach((t) => {
          if (t.count > 0) initialExpanded[t.tier] = true;
        });
        setExpandedTiers(initialExpanded);
      }
    } catch (err) {
      showError(err.message || 'Failed to load network hierarchy');
    } finally {
      setLoading(false);
    }
  };

  const toggleTier = (tierName) => {
    setExpandedTiers((prev) => ({
      ...prev,
      [tierName]: !prev[tierName],
    }));
  };

  // KPI Calculations
  const totalYards = hierarchyData.reduce((acc, t) => acc + (t.totalYards || 0), 0);
  const seniorLeaders = hierarchyData
    .filter((t) =>
      [
        'Sales Director',
        'Assistant Sales Director',
        'Regional Sales Manager',
        'Area Sales Manager',
        'Senior Sales Manager',
        'Sales Manager',
      ].includes(t.tier)
    )
    .reduce((acc, t) => acc + (t.count || 0), 0);

  const topDirectors = hierarchyData
    .filter((t) => ['Sales Director', 'Assistant Sales Director'].includes(t.tier))
    .reduce((acc, t) => acc + (t.count || 0), 0);

  const kpiItems = [
    {
      key: 'network-partners',
      label: 'TOTAL PARTNERS',
      value: totalBrokers,
      status: 'neutral',
      info: {
        title: 'Active Network Partners',
        summary: 'Total channel partners active across all 8 organizational tiers.',
        calculation: 'Count of active channel partners in the network tree',
      },
    },
    {
      key: 'network-yards',
      label: 'TOTAL YARDS SOLD',
      value: `${totalYards.toLocaleString()} Sq.Yd`,
      status: 'positive',
      info: {
        title: 'Cumulative Network Sales',
        summary: 'Total land area (Gaj/Sq.Yds) delivered collectively across all tiers.',
        calculation: 'Sum of totalYards across all hierarchy tiers',
      },
    },
    {
      key: 'senior-leaders',
      label: 'SENIOR LEADERS',
      value: seniorLeaders,
      status: 'positive',
      info: {
        title: 'Managerial & Executive Partners',
        summary: 'Partners who have delivered 500+ yards, qualifying for higher commission slabs.',
        calculation: 'Partners at Sales Manager level and above',
      },
    },
    {
      key: 'directorship',
      label: 'DIRECTORS & AD',
      value: topDirectors,
      status: 'neutral',
      info: {
        title: 'Directorship Leadership',
        summary: 'Top tier partners exceeding 7,000+ yards with 4.5% - 5.0% commission brackets.',
        calculation: 'Count of Assistant Sales Directors and Sales Directors',
      },
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Full-width Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/crm/brokers"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Back to Partners List"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Channel Partner Hierarchy</h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-100 text-purple-700 rounded-md">
                8-Tier Sales Pyramid
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Organizational hierarchy and performance tiers based on cumulative square yardage milestones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadNetwork}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
            title="Refresh Hierarchy"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/crm/brokers"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <Users className="w-4 h-4" />
            <span>Table View</span>
          </Link>

          <button
            onClick={() => setFormModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Partner</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <WorkKpiStrip items={kpiItems} />

      {/* 8-Tier Hierarchy Tree */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-2xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-purple-600 border-t-transparent mb-3" />
          <p className="text-xs text-slate-500">Building network hierarchy tree...</p>
        </div>
      ) : hierarchyData.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-2xs">
          <Network className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No network data</h3>
          <p className="text-xs text-slate-400 mt-1">Register channel partners to populate the sales pyramid.</p>
        </div>
      ) : (
        <div className="space-y-3 w-full">
          {hierarchyData.map((tierGroup, idx) => {
            const isExpanded = !!expandedTiers[tierGroup.tier];
            const TierIcon = TIER_ICONS[tierGroup.tier] || Users;
            const gradientClass = TIER_GRADIENTS[tierGroup.tier] || '';
            const badgeClass = TIER_BADGES[tierGroup.tier] || '';
            const hasBrokers = tierGroup.count > 0;

            return (
              <div
                key={tierGroup.tier}
                className={`bg-white rounded-xl border transition-all shadow-2xs overflow-hidden ${
                  hasBrokers ? 'border-slate-200 hover:border-slate-300' : 'border-slate-100 opacity-75'
                }`}
              >
                {/* Tier Card Header */}
                <div
                  onClick={() => hasBrokers && toggleTier(tierGroup.tier)}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r ${gradientClass} ${
                    hasBrokers ? 'cursor-pointer select-none' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0">
                      <TierIcon className="w-5 h-5 text-slate-700" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                          {tierGroup.tier}
                        </h2>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${badgeClass}`}>
                          {tierGroup.commission} Comm. Slab
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {tierGroup.minYards.toLocaleString()} -{' '}
                          {tierGroup.maxYards === Infinity ? '10,000+' : tierGroup.maxYards.toLocaleString()} Yd
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {tierGroup.count} Registered {tierGroup.count === 1 ? 'Partner' : 'Partners'} •{' '}
                        <span className="font-semibold text-slate-700">
                          {tierGroup.totalYards.toLocaleString()} Sq.Yds
                        </span>{' '}
                        aggregate volume
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between md:justify-end">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        {tierGroup.totalYards.toLocaleString()} Sq.Yd
                      </div>
                      <div className="text-[10px] text-slate-400">Total Group Volume</div>
                    </div>

                    {hasBrokers ? (
                      <button
                        type="button"
                        className="p-1.5 text-slate-500 hover:text-slate-800 bg-white rounded-lg border border-slate-200 shadow-2xs transition-colors"
                        title={isExpanded ? 'Collapse Tier' : 'Expand Tier'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic px-2">No partners yet</span>
                    )}
                  </div>
                </div>

                {/* Expanded Brokers Grid */}
                {isExpanded && hasBrokers && (
                  <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {tierGroup.brokers.map((broker) => {
                        const progress = broker.progress || {};
                        return (
                          <div
                            key={broker._id}
                            className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                                    <span>{broker.name}</span>
                                    {broker.code && (
                                      <span className="font-mono text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded">
                                        {broker.code}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                    {broker.agencyName || 'Independent Partner'}
                                  </div>
                                </div>

                                <button
                                  onClick={() => setDetailsModal({ open: true, brokerId: broker._id })}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="View Partner Profile"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="space-y-1 text-[11px] text-slate-600 mb-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400">Phone:</span>
                                  <a href={`tel:${broker.phone}`} className="font-medium hover:text-blue-600">
                                    {broker.phone}
                                  </a>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400">City:</span>
                                  <span className="font-medium text-slate-700">{broker.city || 'Jaipur'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400">Managing Rep:</span>
                                  <span className="font-medium text-slate-700 truncate max-w-[120px]">
                                    {broker.managedBy?.name || 'Unassigned'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Progress Strip */}
                            <div className="pt-2 border-t border-slate-100">
                              <div className="flex items-center justify-between text-[10px] mb-1">
                                <span className="font-bold text-slate-900">
                                  {(broker.totalYards || 0).toLocaleString()} Sq.Yd
                                </span>
                                <span className="text-slate-400">{progress.percentage || 0}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                <div
                                  className="bg-blue-600 h-1 rounded-full"
                                  style={{ width: `${Math.min(progress.percentage || 0, 100)}%` }}
                                />
                              </div>
                              {progress.nextTier && (
                                <div className="text-[9px] text-slate-400 mt-1 truncate">
                                  {progress.remainingYards?.toLocaleString()} Yd to {progress.nextTier}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <BrokerFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSuccess={() => {
          setFormModalOpen(false);
          loadNetwork();
        }}
        salesPersons={salesPersons}
      />

      {/* Details Modal */}
      <BrokerDetailsModal
        isOpen={detailsModal.open}
        onClose={() => setDetailsModal({ open: false, brokerId: null })}
        brokerId={detailsModal.brokerId}
      />
    </div>
  );
}
