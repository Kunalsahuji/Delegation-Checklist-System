import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, Layers, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Spinner } from '../../../components/Spinner';
import { checklistApi } from '../api/checklistApi';
import { axiosClient } from '../../../api/axiosClient';

export const ChecklistTaskDrawer = ({
  isOpen,
  onClose,
  onSaved,
  task = null,
  departments: initialDepartments = [],
  users: initialUsers = [],
}) => {
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [department, setDepartment] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [anchorDate, setAnchorDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueTime, setDueTime] = useState('18:00');
  const [skipSundays, setSkipSundays] = useState(false);
  const [skipHolidays, setSkipHolidays] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fallback master data cache
  const [users, setUsers] = useState(initialUsers);
  const [departments, setDepartments] = useState(initialDepartments);

  // Sync prop changes
  useEffect(() => {
    if (initialUsers && initialUsers.length > 0) {
      setUsers(initialUsers);
    }
  }, [initialUsers]);

  useEffect(() => {
    if (initialDepartments && initialDepartments.length > 0) {
      setDepartments(initialDepartments);
    }
  }, [initialDepartments]);

  // Self-fetch master metadata if missing when opened
  useEffect(() => {
    if (!isOpen) return;
    let isSubscribed = true;

    const fetchMasterData = async () => {
      try {
        if (!users || users.length === 0) {
          const uRes = await axiosClient.get('/master/users');
          const uList = uRes?.data || uRes || [];
          if (isSubscribed && Array.isArray(uList) && uList.length > 0) {
            setUsers(uList);
          }
        }
        if (!departments || departments.length === 0) {
          const dRes = await axiosClient.get('/master/departments');
          const dList = dRes?.data || dRes || [];
          if (isSubscribed && Array.isArray(dList) && dList.length > 0) {
            setDepartments(dList);
          }
        }
      } catch (err) {
        console.error('Failed to load master metadata for checklist drawer', err);
      }
    };

    fetchMasterData();
    return () => {
      isSubscribed = false;
    };
  }, [isOpen, users.length, departments.length]);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Recurrence Preview state
  const [previewDates, setPreviewDates] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setAssignedTo(task.assignedTo?._id || task.assignedTo || '');
      setDepartment(task.department?._id || task.department || '');
      setFrequency(task.frequency || 'daily');
      setAnchorDate(
        task.anchorDate ? new Date(task.anchorDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
      );
      setDueTime(task.dueTime || '18:00');
      setSkipSundays(Boolean(task.skipSundays));
      setSkipHolidays(Boolean(task.skipHolidays));
      setError('');
    } else {
      setTitle('');
      setAssignedTo('');
      setDepartment('');
      setFrequency('daily');
      setAnchorDate(new Date().toISOString().slice(0, 10));
      setDueTime('18:00');
      setSkipSundays(false);
      setSkipHolidays(false);
      setError('');
    }
  }, [task, isOpen]);

  // Auto-populate department when user is chosen (if no dept chosen yet)
  const handleAssigneeChange = (userId) => {
    setAssignedTo(userId);
    if (!userId) return;
    const selectedUser = users.find((u) => u._id === userId);
    if (selectedUser && selectedUser.department) {
      const deptId = typeof selectedUser.department === 'object' ? selectedUser.department._id : selectedUser.department;
      if (deptId) {
        setDepartment(deptId);
      }
    }
  };

  // Fetch live recurrence preview whenever recurrence parameters change
  useEffect(() => {
    if (!isOpen || !frequency || !anchorDate) return;

    let active = true;
    const fetchPreview = async () => {
      setPreviewLoading(true);
      try {
        const res = await checklistApi.previewDates({
          frequency,
          anchorDate,
          dueTime,
          skipSundays,
          skipHolidays,
          count: 5,
        });
        if (active && res.success) {
          setPreviewDates(res.data);
        }
      } catch (e) {
        // ignore preview failure
      } finally {
        if (active) setPreviewLoading(false);
      }
    };

    fetchPreview();
    return () => {
      active = false;
    };
  }, [frequency, anchorDate, dueTime, skipSundays, skipHolidays, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!assignedTo) {
      setError('Please select an assigned person');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        title: title.trim(),
        assignedTo,
        department: department || null,
        frequency,
        anchorDate,
        dueTime,
        skipSundays,
        skipHolidays,
      };

      if (task?._id) {
        await checklistApi.updateTask(task._id, payload);
      } else {
        await checklistApi.createTask(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to save checklist task');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full sm:max-w-lg bg-white shadow-2xl h-full flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header - Fixed Top */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="pr-4">
            <h2 className="text-base font-bold text-slate-900 leading-snug">
              {task ? 'Edit Recurring Checklist' : 'New Recurring Checklist'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Define operational recurring work, recurrence rules, and assignees
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable Middle */}
        <form id="checklist-drawer-form" onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="field-label block text-xs font-semibold text-slate-700 mb-1">
              Checklist Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Daily site attendance verification"
              className="field-input w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="field-label block text-xs font-semibold text-slate-700 mb-1">
                Assigned Person <span className="text-rose-500">*</span>
              </label>
              <select
                value={assignedTo}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                required
                className="field-input w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
              >
                <option value="">Select Assignee</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} {u.role ? `(${u.role})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label block text-xs font-semibold text-slate-700 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="field-input w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
              >
                <option value="">Company-wide</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="field-label block text-xs font-semibold text-slate-700 mb-1">
                Frequency <span className="text-rose-500">*</span>
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                required
                className="field-input w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="lastWeekdayOfMonth">Last Weekday of Month</option>
              </select>
            </div>

            <div>
              <label className="field-label block text-xs font-semibold text-slate-700 mb-1">
                Due Time (IST) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  required
                  className="field-input w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="field-label block text-xs font-semibold text-slate-700 mb-1">
              Anchor / Start Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={anchorDate}
              onChange={(e) => setAnchorDate(e.target.value)}
              required
              className="field-input w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
            />
          </div>

          {frequency === 'daily' && (
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={skipSundays}
                  onChange={(e) => setSkipSundays(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Skip Sundays automatically</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={skipHolidays}
                  onChange={(e) => setSkipHolidays(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Skip Public Holidays automatically</span>
              </label>
            </div>
          )}

          {/* Live Recurrence Preview Box */}
          <div className="pt-2">
            <span className="field-label block text-xs font-semibold text-slate-700 mb-1">
              Schedule Preview (Next 5 Occurrences)
            </span>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-1">
              {previewLoading ? (
                <div className="flex items-center justify-center p-3">
                  <Spinner size="sm" className="text-blue-600 mr-2" />
                  <span className="text-xs text-slate-500">Calculating recurrence dates...</span>
                </div>
              ) : previewDates.length > 0 ? (
                <ul className="space-y-2">
                  {previewDates.map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between text-xs text-slate-700">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-800">{item.date}</span>
                      </div>
                      <span className="text-slate-500 font-mono text-[11px]">Due by {dueTime}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 text-center py-2">
                  No upcoming dates calculated for this window.
                </p>
              )}
            </div>
          </div>
        </form>

        {/* Footer - Fixed Bottom */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <Button variant="secondary" type="button" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="checklist-drawer-form" loading={loading} size="sm">
            {task ? 'Update Checklist' : 'Save & Materialise'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
