import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Plus,
  RefreshCw,
  Phone,
  User,
  Trash2,
  Star,
  CheckSquare,
} from 'lucide-react';
import WorkKpiStrip from '../../../components/WorkKpiStrip';
import StageBadge from '../components/StageBadge';
import { crmFollowupApi } from '../../../api/crmFollowupApi';
import { useToast } from '../../../context/ToastContext';
import FollowupFormModal from '../components/FollowupFormModal';
import CompleteFollowupModal from '../components/CompleteFollowupModal';
import RescheduleFollowupModal from '../components/RescheduleFollowupModal';

export default function FollowupsPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [stats, setStats] = useState({
    totalPending: 0,
    dueToday: 0,
    overdue: 0,
    completed: 0,
    specialFollowUps: 0,
  });

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'dueToday', 'overdue', 'upcoming', 'completed'
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [completeModal, setCompleteModal] = useState({ open: false, reminder: null });
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, reminder: null });

  useEffect(() => {
    loadAllData();
  }, [pagination.page, filterStatus]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [statsRes, listRes] = await Promise.all([
        crmFollowupApi.getStats(),
        crmFollowupApi.listReminders({
          page: pagination.page,
          limit: pagination.limit,
          filterStatus,
          search: searchTerm,
        }),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (listRes.success) {
        setReminders(listRes.data || []);
        setPagination((prev) => ({
          ...prev,
          total: listRes.pagination?.total || 0,
          totalPages: listRes.pagination?.totalPages || 1,
        }));
      }
    } catch (err) {
      showError(err.message || 'Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadAllData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this follow-up?')) return;
    try {
      await crmFollowupApi.deleteReminder(id);
      showSuccess('Follow-up deleted');
      loadAllData();
    } catch (err) {
      showError(err.message || 'Failed to delete follow-up');
    }
  };

  // 5 KPI Tiles with interactive filtering and MetricInfoBadge
  const kpiItems = [
    {
      key: 'total-pending',
      label: 'TOTAL PENDING',
      value: stats.totalPending,
      tone: 'blue',
      hint: 'Awaiting call action',
      icon: Clock,
      active: filterStatus === 'all',
      info: {
        title: 'Pending Follow-ups',
        summary: 'All client follow-up commitments and scheduled callbacks currently pending action.',
        calculation: 'Count of reminders where status = "pending"',
      },
      onClick: () => {
        setFilterStatus('all');
        setPagination((prev) => ({ ...prev, page: 1 }));
      },
    },
    {
      key: 'due-today',
      label: 'DUE TODAY',
      value: stats.dueToday,
      tone: stats.dueToday > 0 ? 'sky' : 'default',
      hint: 'Scheduled for today',
      icon: Calendar,
      active: filterStatus === 'dueToday',
      info: {
        title: 'Follow-ups Due Today',
        summary: 'Client calls and follow-ups requiring completion before end of today.',
        calculation: 'Count of pending reminders where reminderAt is within today',
      },
      onClick: () => {
        setFilterStatus('dueToday');
        setPagination((prev) => ({ ...prev, page: 1 }));
      },
    },
    {
      key: 'overdue',
      label: 'OVERDUE',
      value: stats.overdue,
      tone: stats.overdue > 0 ? 'danger' : 'default',
      hint: 'Past due deadline',
      icon: AlertTriangle,
      active: filterStatus === 'overdue',
      info: {
        title: 'Overdue Follow-ups',
        summary: 'Unresolved follow-up commitments past their scheduled due date.',
        calculation: 'Count of pending reminders where reminderAt < today 00:00:00',
      },
      onClick: () => {
        setFilterStatus('overdue');
        setPagination((prev) => ({ ...prev, page: 1 }));
      },
    },
    {
      key: 'completed',
      label: 'COMPLETED',
      value: stats.completed,
      tone: stats.completed > 0 ? 'success' : 'default',
      hint: 'Resolved & logged',
      icon: CheckCircle2,
      active: filterStatus === 'completed',
      info: {
        title: 'Completed Follow-ups',
        summary: 'Client follow-ups successfully resolved with outcome notes recorded.',
        calculation: 'Count of reminders where status = "completed"',
      },
      onClick: () => {
        setFilterStatus('completed');
        setPagination((prev) => ({ ...prev, page: 1 }));
      },
    },
    {
      key: 'special-followups',
      label: 'SPECIAL FOLLOW-UPS',
      value: stats.specialFollowUps,
      tone: stats.specialFollowUps > 0 ? 'warning' : 'default',
      hint: 'Starred VIP clients',
      icon: Star,
      info: {
        title: 'Special High-Priority Leads',
        summary: 'Flagged prospective deals and VIP buyers marked with special star follow-up priority.',
        calculation: 'Count of active enquiries and leads where specialFollowUp = true',
      },
      onClick: () => {
        navigate('/crm/special-followups');
      },
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Follow-ups & Reminders</h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-700 rounded-md">
              Client Engagement
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage daily client callbacks, planned stage milestones, and timely customer touchpoints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadAllData()}
            className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refresh follow-ups"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Follow-up</span>
          </button>
        </div>
      </div>

      {/* KPI Strip with MetricInfoBadge */}
      <WorkKpiStrip items={kpiItems} />

      {/* Workspace Table & Filter Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Filters Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
            <button
              onClick={() => {
                setFilterStatus('all');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              All Pending ({stats.totalPending})
            </button>
            <button
              onClick={() => {
                setFilterStatus('dueToday');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterStatus === 'dueToday'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Due Today ({stats.dueToday})
            </button>
            <button
              onClick={() => {
                setFilterStatus('overdue');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterStatus === 'overdue'
                  ? 'bg-white text-rose-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Overdue ({stats.overdue})
            </button>
            <button
              onClick={() => {
                setFilterStatus('upcoming');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterStatus === 'upcoming'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => {
                setFilterStatus('completed');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterStatus === 'completed'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Completed ({stats.completed})
            </button>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative flex-1 md:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, client, notes..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
            />
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Due Date & Time</th>
                <th className="py-3 px-4">Client Contact</th>
                <th className="py-3 px-4">Follow-up Purpose & Notes</th>
                <th className="py-3 px-4">Type & Stage</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={6} className="py-3.5 px-4 bg-slate-50/30">
                      <div className="h-4 bg-slate-200/60 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : reminders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">No follow-ups found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Schedule a follow-up or callback to keep track of prospective buyers.
                    </p>
                  </td>
                </tr>
              ) : (
                reminders.map((rem) => {
                  const isDone = rem.status === 'completed';
                  const remDate = new Date(rem.reminderAt);
                  const isOverdue = !isDone && remDate < new Date() && remDate.toDateString() !== new Date().toDateString();
                  const isToday = !isDone && remDate.toDateString() === new Date().toDateString();

                  return (
                    <tr
                      key={rem._id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isDone ? 'bg-slate-50/40 opacity-75' : isOverdue ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {isDone ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                              Completed
                            </span>
                          ) : isOverdue ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700">
                              Overdue
                            </span>
                          ) : isToday ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                              Due Today
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                              Upcoming
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-slate-800 mt-1">
                          {remDate.toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {rem.reminderTime || remDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 flex items-center gap-1.5">
                          <span>{rem.clientName || 'General Follow-up'}</span>
                          {rem.specialFollowUp && (
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                          )}
                        </div>
                        {rem.clientPhone && (
                          <a
                            href={`tel:${rem.clientPhone}`}
                            className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{rem.clientPhone}</span>
                          </a>
                        )}
                        {rem.referenceCode && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{rem.referenceCode}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-800">{rem.title}</div>
                        {rem.description && (
                          <div className="text-[11px] text-slate-500 truncate mt-0.5" title={rem.description}>
                            {rem.description}
                          </div>
                        )}
                        {isDone && rem.completionRemarks && (
                          <div className="text-[11px] text-emerald-700 italic mt-0.5">
                            Outcome: "{rem.completionRemarks}"
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {rem.category === 'plannedDate'
                              ? 'Planned Stage Date'
                              : rem.referenceType === 'enquiry'
                              ? 'Enquiry Follow-up'
                              : rem.referenceType === 'lead'
                              ? 'Lead Follow-up'
                              : 'Personal Reminder'}
                          </span>
                          {rem.stageName && (
                            <StageBadge
                              stage={rem.stageName}
                              color={rem.stageColor}
                              showOrder={true}
                            />
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{rem.assignedTo?.name || 'Self'}</div>
                        <div className="text-[10px] text-slate-400">{rem.assignedTo?.role || 'Sales'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isDone && (
                            <>
                              <button
                                type="button"
                                onClick={() => setCompleteModal({ open: true, reminder: rem })}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Mark Completed"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRescheduleModal({ open: true, reminder: rem })}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Reschedule Date"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(rem._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Pagination */}
        {!loading && pagination.total > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
            <div>
              Showing <span className="font-semibold text-slate-800">{reminders.length}</span> of{' '}
              <span className="font-semibold text-slate-800">{pagination.total}</span>{' '}
              {filterStatus === 'all'
                ? 'pending follow-ups'
                : filterStatus === 'dueToday'
                ? 'follow-ups due today'
                : filterStatus === 'overdue'
                ? 'overdue follow-ups'
                : filterStatus === 'completed'
                ? 'completed follow-ups'
                : filterStatus === 'special'
                ? 'special follow-ups'
                : 'follow-ups'}
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
      <FollowupFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => loadAllData()}
      />

      <CompleteFollowupModal
        isOpen={completeModal.open}
        reminder={completeModal.reminder}
        onClose={() => setCompleteModal({ open: false, reminder: null })}
        onSuccess={() => loadAllData()}
      />

      <RescheduleFollowupModal
        isOpen={rescheduleModal.open}
        reminder={rescheduleModal.reminder}
        onClose={() => setRescheduleModal({ open: false, reminder: null })}
        onSuccess={() => loadAllData()}
      />
    </div>
  );
}
