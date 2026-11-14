import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Calendar, AlertCircle } from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';

export default function AddDelegationModal({
  isOpen,
  onClose,
  onSubmit,
  users: initialUsers = [],
  departments: initialDepartments = [],
  projects: initialProjects = [],
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [department, setDepartment] = useState('');
  const [project, setProject] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [proofRequired, setProofRequired] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fallback master data cache
  const [users, setUsers] = useState(initialUsers);
  const [departments, setDepartments] = useState(initialDepartments);
  const [projects, setProjects] = useState(initialProjects);

  // Sync prop changes
  useEffect(() => {
    if (initialUsers && initialUsers.length > 0) setUsers(initialUsers);
  }, [initialUsers]);

  useEffect(() => {
    if (initialDepartments && initialDepartments.length > 0) setDepartments(initialDepartments);
  }, [initialDepartments]);

  useEffect(() => {
    if (initialProjects && initialProjects.length > 0) setProjects(initialProjects);
  }, [initialProjects]);

  // Self-fetch master data if missing when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let isSubscribed = true;

    const fetchMasterData = async () => {
      try {
        if (!users || users.length === 0) {
          const uRes = await axiosClient.get('/master/users');
          const uList = uRes?.data || uRes || [];
          if (isSubscribed && Array.isArray(uList) && uList.length > 0) setUsers(uList);
        }
        if (!departments || departments.length === 0) {
          const dRes = await axiosClient.get('/master/departments');
          const dList = dRes?.data || dRes || [];
          if (isSubscribed && Array.isArray(dList) && dList.length > 0) setDepartments(dList);
        }
        if (!projects || projects.length === 0) {
          const pRes = await axiosClient.get('/master/projects');
          const pList = pRes?.data || pRes || [];
          if (isSubscribed && Array.isArray(pList) && pList.length > 0) setProjects(pList);
        }
      } catch (err) {
        console.error('Failed to load master metadata for delegation modal', err);
      }
    };

    fetchMasterData();
    return () => {
      isSubscribed = false;
    };
  }, [isOpen, users.length, departments.length, projects.length]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Reset form when reopened
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setDepartment('');
      setProject('');
      setPriority('medium');
      const d = new Date();
      d.setDate(d.getDate() + 3);
      setDueDate(d.toISOString().split('T')[0]);
      setStartDate(new Date().toISOString().split('T')[0]);
      setProofRequired(false);
      setError('');
    }
  }, [isOpen]);

  // Auto-populate department when assignee is selected
  const handleAssigneeChange = (userId) => {
    setAssignedTo(userId);
    if (!userId) return;
    const selectedUser = users.find((u) => u._id === userId);
    if (selectedUser && selectedUser.department) {
      const deptId = typeof selectedUser.department === 'object' ? selectedUser.department._id : selectedUser.department;
      if (deptId) setDepartment(deptId);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!assignedTo) {
      setError('Please select an assignee for this delegation');
      return;
    }
    if (!dueDate) {
      setError('Please set a planned due date');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        assignedTo,
        department: department || null,
        project: project || null,
        priority,
        dueDate: new Date(dueDate).toISOString(),
        startDate: startDate ? new Date(startDate).toISOString() : null,
        proofRequired,
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to create delegation task');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-xl w-full border-0 sm:border border-slate-200 overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[92vh] my-0 sm:my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header - Fixed Top */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">Add New Delegation Task</h3>
              <p className="text-xs text-slate-500">Assign work with tracked original deadline</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Scrollable Middle */}
        <form id="add-delegation-form" onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Verify material delivery status or Review floor drawings"
              required
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Assignee & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assignee (Doer) <span className="text-rose-500">*</span>
              </label>
              <select
                value={assignedTo}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
              >
                <option value="">Company-wide</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Project & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project
              </label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
              >
                <option value="">Company-wide (No specific project)</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                {['low', 'medium', 'high'].map((p) => (
                  <label
                    key={p}
                    className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer text-xs font-semibold uppercase tracking-wider transition-all ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                          : p === 'medium'
                          ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-xs'
                          : 'bg-slate-100 border-slate-400 text-slate-700 shadow-xs'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={p}
                      checked={priority === p}
                      onChange={() => setPriority(p)}
                      className="sr-only"
                    />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Due Date & Start Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Planned Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Becomes the immutable original planned date.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date (Optional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, expected deliverables, or instructions..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={proofRequired}
                onChange={(e) => setProofRequired(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700 font-medium">
                Require proof attachment before completing task
              </span>
            </label>
          </div>
        </form>

        {/* Footer - Fixed Bottom */}
        <div className="flex items-center justify-end gap-2.5 p-4 sm:p-5 bg-slate-50 border-t border-slate-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-delegation-form"
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Delegation</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
