import React, { useState, useEffect } from 'react';
import { X, HelpCircle, AlertCircle, Loader2, User } from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { formatCivilDate } from '../../../utils/civilDate';

export default function EditDelegationModal({
  isOpen,
  onClose,
  task,
  onSaved,
  users: propUsers = [],
  departments: propDepartments = [],
  projects: propProjects = [],
}) {
  const [users, setUsers] = useState(propUsers);
  const [departments, setDepartments] = useState(propDepartments);
  const [projects, setProjects] = useState(propProjects);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [showAssigneeChange, setShowAssigneeChange] = useState(false);
  const [priority, setPriority] = useState('medium');
  const [departmentId, setDepartmentId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [workType, setWorkType] = useState('');
  const [proofRequired, setProofRequired] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [followUpRequired, setFollowUpRequired] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load masters if not supplied
  useEffect(() => {
    if (!isOpen) return;
    const fetchMasters = async () => {
      try {
        setLoadingOptions(true);
        const [uRes, dRes, pRes] = await Promise.all([
          propUsers?.length ? null : axiosClient.get('/users'),
          propDepartments?.length ? null : axiosClient.get('/departments'),
          propProjects?.length ? null : axiosClient.get('/projects'),
        ]);
        if (uRes) setUsers(uRes?.data || uRes || []);
        if (dRes) setDepartments(dRes?.data || dRes || []);
        if (pRes) setProjects(pRes?.data || pRes || []);
      } catch (e) {
        console.error('Failed to load master options for edit', e);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchMasters();
  }, [isOpen, propUsers, propDepartments, propProjects]);

  // Sync state from task
  useEffect(() => {
    if (!task) return;
    setTitle(task.title || '');
    setDescription(task.description || '');
    const currentAssigneeId = task.assignedTo?._id || task.assignedTo || '';
    setAssignedToId(currentAssigneeId);
    setReassignReason('');
    setShowAssigneeChange(false);
    setPriority(task.priority || 'medium');
    setDepartmentId(task.department?._id || task.department || '');
    setProjectId(task.project?._id || task.project || '');
    
    // Start date format YYYY-MM-DD
    if (task.startDate) {
      const d = new Date(task.startDate);
      if (!isNaN(d.getTime())) {
        setStartDate(d.toISOString().split('T')[0]);
      } else {
        setStartDate('');
      }
    } else {
      setStartDate('');
    }

    setWorkType(task.workType || '');
    setProofRequired(Boolean(task.proofRequired));
    setVerificationRequired(Boolean(task.verificationRequired));
    setFollowUpRequired(Boolean(task.followUp?.required || task.followUpRequired));
    setError(null);
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const currentAssigneeObj = users.find((u) => String(u._id || u.id) === String(assignedToId)) || {
    name: task.assignedToName || 'Current Assignee',
  };

  const currentProjectObj = projects.find((p) => String(p._id || p.id) === String(projectId));

  const hasAssigneeChanged = String(assignedToId) !== String(task.assignedTo?._id || task.assignedTo);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        priority,
        department: departmentId || null,
        project: projectId || null,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        proofRequired,
        verificationRequired,
        followUpRequired,
      };

      if (workType) {
        payload.workType = workType;
      }

      if (hasAssigneeChanged) {
        payload.assignedTo = assignedToId;
        payload.reassignReason = reassignReason.trim() || 'Assignee updated in edit modal';
      }

      await onSaved(task._id, payload);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">Edit delegation</h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
              <span className="font-semibold text-slate-700">{task.code}</span>
              <span>•</span>
              <span className="font-sans">Assigned by {task.assignedByName || 'Administrator'}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Assigned To */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-medium text-slate-700 flex items-center gap-1">
                <span>Assigned to</span>
                <span className="text-rose-500">*</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
              </label>
              {!showAssigneeChange && (
                <button
                  type="button"
                  onClick={() => setShowAssigneeChange(true)}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                >
                  Change
                </button>
              )}
            </div>

            {!showAssigneeChange ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
                <User className="w-4 h-4 text-slate-400" />
                <span>{currentAssigneeObj?.name || 'Unassigned'}</span>
              </div>
            ) : (
              <div className="space-y-2 p-3 bg-blue-50/50 border border-blue-200 rounded-lg">
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select user...</option>
                  {users.map((u) => (
                    <option key={u._id || u.id} value={u._id || u.id}>
                      {u.name} {u.role ? `(${u.role})` : ''}
                    </option>
                  ))}
                </select>
                {hasAssigneeChanged && (
                  <input
                    type="text"
                    value={reassignReason}
                    onChange={(e) => setReassignReason(e.target.value)}
                    placeholder="Reason for reassignment (optional)"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            )}
          </div>

          {/* Task Title */}
          <div className="space-y-1.5">
            <label className="font-medium text-slate-700 flex items-center gap-1">
              <span>Task title</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-medium text-slate-700">Description (optional)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What exactly is expected, and what does done look like?"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Row: Priority & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 flex items-center gap-1">
                <span>Priority</span>
                <span className="text-rose-500">*</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 capitalize"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-700">Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No department</option>
                {departments.map((d) => (
                  <option key={d._id || d.id} value={d._id || d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: Start Date & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 flex items-center gap-1">
                <span>Start date</span>
                <span className="text-rose-500">*</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 flex items-center gap-1">
                <span>Due date</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <input
                type="text"
                readOnly
                value={formatCivilDate(task.dueDate)}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-500 italic">
                To move the date, use "Change date" — it records why.
              </p>
            </div>
          </div>

          {/* Row: Project & Work Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-700">Project (optional)</label>
                {projectId && (
                  <button
                    type="button"
                    onClick={() => setProjectId('')}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Make it company-wide
                  </button>
                )}
              </div>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Company-wide</option>
                {projects.map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id}>
                    {p.name} {p.code ? `(${p.code})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500">
                This will also show on that project's People & Work page.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-700 flex items-center gap-1">
                <span>Work type</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not classified</option>
                <option value="followUp">Follow-up</option>
                <option value="execution">Execution</option>
                <option value="review">Review</option>
                <option value="coordination">Coordination</option>
              </select>
            </div>
          </div>

          {/* ADDITIONAL OPTIONS */}
          <div className="pt-2 border-t border-slate-200 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Additional options</span>
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={followUpRequired}
                  onChange={(e) => setFollowUpRequired(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <div>
                  <span className="font-semibold text-slate-800">Follow-up required</span>
                  <p className="text-[11px] text-slate-500">
                    You are reminded on the date you set, and log each check-in.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={proofRequired}
                  onChange={(e) => setProofRequired(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <div>
                  <span className="font-semibold text-slate-800">Proof required</span>
                  <p className="text-[11px] text-slate-500">
                    The doer must attach a file before completing it.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={verificationRequired}
                  onChange={(e) => setVerificationRequired(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <div>
                  <span className="font-semibold text-slate-800">Verification required</span>
                  <p className="text-[11px] text-slate-500">
                    You check the work before it counts as completed.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 shadow-xs"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
