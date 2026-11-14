import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, HelpCircle, RefreshCw } from 'lucide-react';
import { delegationApi } from '../api/delegationApi';
import { axiosClient } from '../../../api/axiosClient';
import DelegationKpis from '../components/DelegationKpis';
import DelegationFilters from '../components/DelegationFilters';
import DelegationTable from '../components/DelegationTable';
import AddDelegationModal from '../components/AddDelegationModal';
import ChangeDateModal from '../components/ChangeDateModal';
import DelegationReportDelayModal from '../components/DelegationReportDelayModal';
import DelegationDetailDrawer from '../components/DelegationDetailDrawer';

export default function DelegationWorkspacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStatus = searchParams.get('status') || 'all';
  const urlSlice = searchParams.get('slice') || '';
  const initialSlice = urlSlice || (urlStatus !== 'all' ? urlStatus : 'all');

  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Master options
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);

  // Active slice & filters
  const [activeSlice, setActiveSlice] = useState(initialSlice);
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    status: urlStatus,
    department: searchParams.get('department') || '',
    assignee: searchParams.get('assignee') || '',
    project: searchParams.get('project') || '',
    priority: searchParams.get('priority') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: 20,
  });

  // Modal / Drawer states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [reviseTask, setReviseTask] = useState(null);
  const [delayTask, setDelayTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // Toast / notification banner
  const [notice, setNotice] = useState(null);

  const showNotice = (type, message) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4000);
  };

  // Fetch Master Data
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [uRes, dRes, pRes] = await Promise.all([
          axiosClient.get('/master/users'),
          axiosClient.get('/master/departments'),
          axiosClient.get('/master/projects'),
        ]);
        const userList = uRes?.data || uRes || [];
        const deptList = dRes?.data || dRes || [];
        const projList = pRes?.data || pRes || [];
        setUsers(Array.isArray(userList) ? userList : []);
        setDepartments(Array.isArray(deptList) ? deptList : []);
        setProjects(Array.isArray(projList) ? projList : []);
      } catch (err) {
        console.error('Failed to load master filters', err);
      }
    };
    fetchMasters();
  }, []);

  // Fetch KPIs / Stats
  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await delegationApi.getStats({
        department: filters.department,
        project: filters.project,
        assignee: filters.assignee,
      });
      setStats(data);
    } catch (err) {
      console.error('Failed to load delegation stats', err);
    } finally {
      setStatsLoading(false);
    }
  }, [filters.department, filters.project, filters.assignee]);

  // Fetch Tasks List
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const sliceParam = activeSlice !== 'all' && activeSlice !== filters.status ? activeSlice : '';
      const query = {
        ...filters,
        slice: sliceParam,
      };
      const res = await delegationApi.getTasks(query);
      setTasks(res?.items || res?.data || []);
      setPagination(res?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to fetch delegation tasks', err);
      showNotice('error', err?.response?.data?.message || err.message || 'Failed to load delegation tasks');
    } finally {
      setLoading(false);
    }
  }, [filters, activeSlice]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Filter handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setActiveSlice('all');
    setFilters({
      q: '',
      status: 'all',
      assignee: '',
      project: '',
      priority: '',
      page: 1,
      limit: 20,
    });
    setSearchParams(new URLSearchParams());
  };

  const handleSliceSelect = (sliceId) => {
    setActiveSlice(sliceId);
    const next = new URLSearchParams(searchParams);
    if (sliceId === 'all') {
      next.delete('status');
      next.delete('slice');
      setFilters((prev) => ({ ...prev, status: 'all', page: 1 }));
    } else if (sliceId === 'pending' || sliceId === 'completed' || sliceId === 'overdue' || sliceId === 'weekShifted') {
      next.set('status', sliceId);
      next.delete('slice');
      setFilters((prev) => ({ ...prev, status: sliceId, page: 1 }));
    } else {
      next.delete('status');
      next.set('slice', sliceId);
      setFilters((prev) => ({ ...prev, status: 'all', page: 1 }));
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Actions
  const handleCreateTask = async (payload) => {
    await delegationApi.createTask(payload);
    showNotice('success', 'Delegation task created successfully.');
    loadTasks();
    loadStats();
  };

  const handleReviseDate = async (id, data) => {
    await delegationApi.reviseDate(id, data);
    showNotice('success', 'Due date revised and reason logged to audit history.');
    loadTasks();
    loadStats();
    if (selectedTask && selectedTask._id === id) {
      const refreshed = await delegationApi.getTask(id);
      setSelectedTask(refreshed);
    }
  };

  const handleReportDelay = async (id, data) => {
    await delegationApi.reportProgress(id, data);
    showNotice('success', 'Progress remark recorded successfully.');
    loadTasks();
    loadStats();
    if (selectedTask && selectedTask._id === id) {
      const refreshed = await delegationApi.getTask(id);
      setSelectedTask(refreshed);
    }
  };

  const handleComplete = async (task) => {
    try {
      await delegationApi.setStatus(task._id, { status: 'completed' });
      showNotice('success', `Task ${task.code} marked as completed.`);
      loadTasks();
      loadStats();
      if (selectedTask && selectedTask._id === task._id) {
        setSelectedTask((prev) => ({ ...prev, status: 'completed' }));
      }
    } catch (err) {
      showNotice('error', err?.response?.data?.message || 'Failed to complete task');
    }
  };

  const handleReopen = async (task) => {
    try {
      await delegationApi.setStatus(task._id, { status: 'pending' });
      showNotice('success', `Task ${task.code} reopened to pending.`);
      loadTasks();
      loadStats();
      if (selectedTask && selectedTask._id === task._id) {
        setSelectedTask((prev) => ({ ...prev, status: 'pending' }));
      }
    } catch (err) {
      showNotice('error', err?.response?.data?.message || 'Failed to reopen task');
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Toast Notification */}
      {notice && (
        <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-150 ${
          notice.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <span>{notice.message}</span>
          <button type="button" onClick={() => setNotice(null)} className="underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
            <span className="text-slate-400">Delegation</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-800 font-semibold">Delegation</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 ml-1 cursor-pointer hover:text-slate-600" />
          </div>
          <p className="text-xs text-slate-500">
            Assigned work and due-date tracking
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => { loadTasks(); loadStats(); }}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Delegation</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <DelegationKpis
        stats={stats}
        activeSlice={activeSlice}
        onSelectSlice={handleSliceSelect}
        loading={statsLoading}
      />

      {/* Filter Bar */}
      <DelegationFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        users={users}
        departments={departments}
        projects={projects}
      />

      {/* Delegation Data Table */}
      <DelegationTable
        tasks={tasks}
        pagination={pagination}
        loading={loading}
        onPageChange={handlePageChange}
        onOpenTask={(task) => setSelectedTask(task)}
        onComplete={handleComplete}
        onReopen={handleReopen}
        onReviseDate={(task) => setReviseTask(task)}
        onReportDelay={(task) => setDelayTask(task)}
      />

      {/* Modals & Drawers */}
      <AddDelegationModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleCreateTask}
        users={users}
        departments={departments}
        projects={projects}
      />

      <ChangeDateModal
        task={reviseTask}
        isOpen={Boolean(reviseTask)}
        onClose={() => setReviseTask(null)}
        onSubmit={handleReviseDate}
      />

      <DelegationReportDelayModal
        task={delayTask}
        isOpen={Boolean(delayTask)}
        onClose={() => setDelayTask(null)}
        onSubmit={handleReportDelay}
      />

      <DelegationDetailDrawer
        task={selectedTask}
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        onReviseDate={(task) => setReviseTask(task)}
        onReportDelay={(task) => setDelayTask(task)}
        onComplete={handleComplete}
        onReopen={handleReopen}
      />
    </div>
  );
}
