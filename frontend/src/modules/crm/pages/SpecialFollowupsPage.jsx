import React, { useState, useEffect } from 'react';
import {
  Star,
  RefreshCw,
  Search,
  Phone,
  Building,
  User,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import WorkKpiStrip from '../../../components/WorkKpiStrip';
import StageBadge from '../components/StageBadge';
import { crmFollowupApi } from '../../../api/crmFollowupApi';
import { useToast } from '../../../context/ToastContext';
import FollowupFormModal from '../components/FollowupFormModal';

export default function SpecialFollowupsPage() {
  const { showSuccess, showError } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [kpiFilter, setKpiFilter] = useState('all'); // 'all', 'hot', 'high-value', 'due-today'
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Modal
  const [scheduleModal, setScheduleModal] = useState({ open: false, prefill: null });

  useEffect(() => {
    loadData();
  }, [pagination.page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await crmFollowupApi.listSpecialFollowups({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
      });

      if (res.success) {
        setItems(res.data || []);
        setPagination((prev) => ({
          ...prev,
          total: res.pagination?.total || 0,
          totalPages: res.pagination?.totalPages || 1,
        }));
      }
    } catch (err) {
      showError(err.message || 'Failed to load special follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadData();
  };

  const handleToggleStar = async (item) => {
    try {
      await crmFollowupApi.toggleSpecialFollowup({
        referenceType: item.kind,
        referenceId: item._id,
        specialFollowUp: false,
      });
      showSuccess(`Removed ${item.clientName} from special follow-ups`);
      loadData();
    } catch (err) {
      showError(err.message || 'Failed to update status');
    }
  };

  const hotCount = items.filter((i) => i.temperature === 'hot').length;
  const highBudgetCount = items.filter((i) => i.budget >= 5000000).length;
  const dueTodayCount = items.filter((i) => {
    if (!i.nextFollowupAt) return false;
    return new Date(i.nextFollowupAt).toDateString() === new Date().toDateString();
  }).length;

  const filteredItems = items.filter((i) => {
    if (kpiFilter === 'hot') return i.temperature === 'hot';
    if (kpiFilter === 'high-value') return (i.budget || 0) >= 5000000;
    if (kpiFilter === 'due-today') {
      if (!i.nextFollowupAt) return false;
      return new Date(i.nextFollowupAt).toDateString() === new Date().toDateString();
    }
    return true;
  });

  const kpiItems = [
    {
      key: 'special-total',
      label: 'SPECIAL FOLLOW-UPS',
      value: pagination.total,
      status: 'warning',
      active: kpiFilter === 'all',
      info: {
        title: 'Special High-Priority Leads',
        summary: 'VIP prospective buyers and urgent deals requiring dedicated executive follow-up attention.',
        calculation: 'Count of active enquiries and leads marked with special follow-up flag',
      },
      onClick: () => setKpiFilter('all'),
    },
    {
      key: 'hot-leads',
      label: 'HOT TEMPERATURE',
      value: hotCount,
      status: 'negative',
      active: kpiFilter === 'hot',
      info: {
        title: 'Hot Temperature Buyers',
        summary: 'Clients actively ready to make purchase decisions on current properties.',
        calculation: 'Count of special follow-up records with temperature = "hot"',
      },
      onClick: () => setKpiFilter('hot'),
    },
    {
      key: 'high-value',
      label: 'HIGH BUDGET (₹50L+)',
      value: highBudgetCount,
      status: 'positive',
      active: kpiFilter === 'high-value',
      info: {
        title: 'High-Value Deals',
        summary: 'Prospective buyers with investment or luxury villa budgets exceeding ₹50 Lakhs.',
        calculation: 'Count of special follow-up records with budget >= 5,000,000',
      },
      onClick: () => setKpiFilter('high-value'),
    },
    {
      key: 'due-today',
      label: 'DUE TODAY',
      value: dueTodayCount,
      status: dueTodayCount > 0 ? 'warning' : 'neutral',
      active: kpiFilter === 'due-today',
      info: {
        title: 'Special Follow-ups Due Today',
        summary: 'High-priority client calls scheduled for discussion today.',
        calculation: 'Count of special follow-up records with nextFollowupAt = today',
      },
      onClick: () => setKpiFilter('due-today'),
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Special Follow-ups</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800 rounded-md">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              High Priority & VIP Deals
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dedicated workspace for high-value prospects, fast-moving decisions, and executive client escalations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refresh special follow-ups"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Strip with MetricInfoBadge */}
      <WorkKpiStrip items={kpiItems} />

      {/* Table & Search Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="relative flex-1 md:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search VIP client name, phone, project..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-amber-500 bg-white"
            />
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">★</th>
                <th className="py-3 px-4">Client Contact</th>
                <th className="py-3 px-4">Project & Budget</th>
                <th className="py-3 px-4">Pipeline Stage</th>
                <th className="py-3 px-4">Next Follow-up</th>
                <th className="py-3 px-4">Assigned To</th>
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
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Star className="w-10 h-10 mx-auto text-amber-200 mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">No special follow-ups match this filter</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Mark prospective buyers or deals with the Star icon or reset the KPI filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStar(item)}
                        className="text-amber-500 hover:text-slate-300 transition-colors cursor-pointer"
                        title="Click to unstar"
                      >
                        <Star className="w-4 h-4 fill-amber-400" />
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{item.clientName}</div>
                      <a
                        href={`tel:${item.clientPhone}`}
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.clientPhone}</span>
                      </a>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.kind.toUpperCase()}: {item.code}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{item.project || 'General'}</div>
                      {item.budget > 0 && (
                        <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                          ₹{item.budget.toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StageBadge
                          stage={item.stageName}
                          color={item.stageColor}
                          showOrder={true}
                        />
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                            item.temperature === 'hot'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {item.temperature === 'hot' ? '🔥 Hot' : '⚡ Warm'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {item.nextFollowupAt ? (
                        <div>
                          <div className="font-medium text-slate-800">
                            {new Date(item.nextFollowupAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.followupTime || 'Anytime'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Not Scheduled</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{item.assignedTo?.name || 'Unassigned'}</div>
                      <div className="text-[10px] text-slate-400">{item.assignedTo?.role || 'Sales'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setScheduleModal({
                              open: true,
                              prefill: {
                                referenceType: item.kind,
                                referenceId: item._id,
                                clientName: item.clientName,
                                assignedTo: item.assignedTo?._id,
                                title: `Special VIP Follow-up: ${item.clientName}`,
                              },
                            })
                          }
                          className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors cursor-pointer"
                        >
                          Schedule Follow-up
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
              Showing {items.length} of {pagination.total} special follow-ups
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

      {/* Portaled Modal with z-[9999] */}
      <FollowupFormModal
        isOpen={scheduleModal.open}
        prefill={scheduleModal.prefill}
        onClose={() => setScheduleModal({ open: false, prefill: null })}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
