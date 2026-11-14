import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Settings2, RefreshCw, HelpCircle } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { axiosClient } from '../../../api/axiosClient';
import { checklistApi } from '../api/checklistApi';
import { ChecklistKpis } from '../components/ChecklistKpis';
import { ChecklistFilters } from '../components/ChecklistFilters';
import { ItemsToTickTable } from '../components/ItemsToTickTable';
import { ChecklistSetupTable } from '../components/ChecklistSetupTable';
import { ChecklistTaskDrawer } from '../components/ChecklistTaskDrawer';
import { ReportDelayModal } from '../components/ReportDelayModal';
import { SkipModal } from '../components/SkipModal';
import { ReassignModal } from '../components/ReassignModal';
import ChecklistDetailPage from '../components/ChecklistDetailPage';

export const ChecklistWorkspacePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const openTaskId = searchParams.get('open');
  const activeTab = searchParams.get('tab') === 'setup' ? 'setup' : 'items';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Filter state synced with searchParams
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    department: searchParams.get('department') || '',
    frequency: searchParams.get('frequency') || '',
    status: searchParams.get('status') || 'all',
    assignee: searchParams.get('assignee') || '',
    slice: searchParams.get('slice') || '',
  });

  // Master options
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);

  // Data states
  const [occurrences, setOccurrences] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [delayItem, setDelayItem] = useState(null);
  const [skipItem, setSkipItem] = useState(null);
  const [reassignItem, setReassignItem] = useState(null);

  // Fetch Master Data (Departments & Users)
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const [deptRes, userRes] = await Promise.all([
          axiosClient.get('/master/departments'),
          axiosClient.get('/master/users'),
        ]);
        if (deptRes.success) setDepartments(deptRes.data);
        if (userRes.success) setUsers(userRes.data);
      } catch (err) {
        console.error('Failed to load master metadata', err);
      }
    };
    fetchMaster();
  }, []);

  // Fetch Occurrences or Tasks based on activeTab
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'items') {
        const [occRes, statsRes] = await Promise.all([
          checklistApi.listOccurrences({
            ...filters,
            page,
            limit: 20,
          }),
          checklistApi.getStats({
            department: filters.department,
            assignee: filters.assignee,
          }),
        ]);

        if (occRes.success) {
          setOccurrences(occRes.items);
          setPagination(occRes.pagination);
        }
        if (statsRes.success) {
          setStats(statsRes.data);
        }
      } else {
        const taskRes = await checklistApi.listTasks({
          department: filters.department,
          frequency: filters.frequency,
          q: filters.q,
        });
        if (taskRes.success) {
          setTasks(taskRes.data);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch checklist data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters, page, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tab Switcher
  const handleTabChange = (tab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    next.set('page', '1');
    setSearchParams(next);
  };

  // Filter change helper
  const handleFilterChange = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      q: '',
      department: '',
      frequency: '',
      status: 'all',
      assignee: '',
      slice: '',
    });
    const next = new URLSearchParams();
    if (activeTab === 'setup') next.set('tab', 'setup');
    setSearchParams(next);
  };

  // KPI card selection
  const handleKpiSelect = (kpiId) => {
    if (kpiId === 'all') {
      handleFilterChange('status', 'all');
      handleFilterChange('slice', '');
    } else if (kpiId === 'dueToday') {
      handleFilterChange('slice', 'dueToday');
      handleFilterChange('status', 'all');
    } else if (kpiId === 'overdue') {
      handleFilterChange('slice', 'overdue');
      handleFilterChange('status', 'all');
    } else {
      handleFilterChange('status', kpiId);
      handleFilterChange('slice', '');
    }
  };

  // Page change
  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(newPage));
    setSearchParams(next);
  };

  // Occurrence Actions
  const handleMarkDone = async (id) => {
    try {
      await checklistApi.setStatus(id, 'done');
      toast.success('Marked checklist as done');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleUndo = async (id) => {
    try {
      await checklistApi.setStatus(id, 'pending');
      toast.info('Occurrence reverted to pending');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to undo');
    }
  };

  const handleSkipConfirm = async (id, { status, remarks }) => {
    try {
      await checklistApi.setStatus(id, status, remarks);
      toast.info('Item skipped');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to skip');
    }
  };

  const handleProgressConfirm = async (id, { note, expectedDate }) => {
    try {
      await checklistApi.reportProgress(id, note, expectedDate);
      toast.success('Progress remark recorded');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to report progress');
    }
  };

  const handleReassignConfirm = async (id, { toUserId, reason }) => {
    try {
      await checklistApi.reassignItem(id, toUserId, reason);
      toast.success('Occurrence reassigned successfully');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to reassign');
    }
  };

  // Setup Actions
  const handleToggleTaskActive = async (id) => {
    try {
      await checklistApi.toggleTaskActive(id);
      toast.info('Checklist schedule status updated');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to toggle status');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this checklist definition?')) return;
    try {
      await checklistApi.deleteTask(id);
      toast.success('Checklist definition deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete checklist');
    }
  };

  return (
    <div className="space-y-4 w-full">
      {openTaskId ? (
        <ChecklistDetailPage
          taskId={openTaskId}
          onBack={() => {
            const next = new URLSearchParams(searchParams);
            next.delete('open');
            setSearchParams(next);
          }}
          onEdit={(task) => {
            setSelectedTask(task);
            setDrawerOpen(true);
          }}
          onChanged={fetchData}
        />
      ) : (
        <>
          {/* Breadcrumb & Header matching Delegation and Dashboard */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
                <span className="text-slate-400">Checklist</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-800 font-semibold">{activeTab === 'items' ? 'Checklists' : 'Setup'}</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 ml-1 cursor-pointer hover:text-slate-600" />
              </div>
              <p className="text-xs text-slate-500">
                Recurring operational work: daily/weekly compliance, due-time tracking, and progress notes
              </p>
            </div>

            {/* Top Controls: Segmented View + Add Button */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3">
              {/* Segmented Tab Buttons matching Screenshot 5 */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-xs text-xs font-medium">
                <button
                  onClick={() => handleTabChange('items')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    activeTab === 'items'
                      ? 'bg-slate-100 text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Items to tick
                </button>
                <button
                  onClick={() => handleTabChange('setup')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    activeTab === 'setup'
                      ? 'bg-slate-100 text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Checklist setup
                </button>
              </div>

              {/* Add Checklist Button */}
              <button
                onClick={() => {
                  setSelectedTask(null);
                  setDrawerOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Checklist</span>
              </button>
            </div>
          </div>

          {/* KPI strip (visible in Items to tick mode) */}
          {activeTab === 'items' && (
            <ChecklistKpis
              stats={stats}
              activeFilter={filters.slice || filters.status}
              onSelectFilter={handleKpiSelect}
            />
          )}

          {/* Filters Bar */}
          <ChecklistFilters
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
            departments={departments}
            users={users}
          />

          {/* Data Table */}
          {activeTab === 'items' ? (
            <ItemsToTickTable
              items={occurrences}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onOpenChecklist={(taskId) => {
                if (taskId) {
                  const next = new URLSearchParams(searchParams);
                  next.set('open', taskId);
                  setSearchParams(next);
                }
              }}
              onMarkDone={handleMarkDone}
              onSkip={(item) => setSkipItem(item)}
              onReportDelay={(item) => setDelayItem(item)}
              onReassign={(item) => setReassignItem(item)}
              onUndo={handleUndo}
            />
          ) : (
            <ChecklistSetupTable
              tasks={tasks}
              loading={loading}
              onOpenChecklist={(taskId) => {
                if (taskId) {
                  const next = new URLSearchParams(searchParams);
                  next.set('open', taskId);
                  setSearchParams(next);
                }
              }}
              onEdit={(task) => {
                setSelectedTask(task);
                setDrawerOpen(true);
              }}
              onToggleActive={handleToggleTaskActive}
              onDelete={handleDeleteTask}
            />
          )}
        </>
      )}

      {/* Slide-Over Drawer for Add/Edit Checklist Definition */}
      <ChecklistTaskDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={fetchData}
        task={selectedTask}
        departments={departments}
        users={users}
      />

      {/* Delay / Progress Modal */}
      <ReportDelayModal
        isOpen={Boolean(delayItem)}
        onClose={() => setDelayItem(null)}
        onSubmit={handleProgressConfirm}
        item={delayItem}
      />

      {/* Skip Modal */}
      <SkipModal
        isOpen={Boolean(skipItem)}
        onClose={() => setSkipItem(null)}
        onSubmit={handleSkipConfirm}
        item={skipItem}
      />

      {/* Reassign Modal */}
      <ReassignModal
        isOpen={Boolean(reassignItem)}
        onClose={() => setReassignItem(null)}
        onSubmit={handleReassignConfirm}
        item={reassignItem}
        users={users}
      />
    </div>
  );
};
