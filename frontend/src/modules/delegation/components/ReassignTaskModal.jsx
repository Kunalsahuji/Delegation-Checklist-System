import React, { useState, useEffect } from 'react';
import { X, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';

export default function ReassignTaskModal({
  isOpen,
  onClose,
  task,
  onReassigned,
  users: propUsers = [],
}) {
  const [users, setUsers] = useState(propUsers);
  const [targetUserId, setTargetUserId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    if (propUsers && propUsers.length > 0) {
      setUsers(propUsers);
    } else {
      axiosClient.get('/master/users').then((res) => {
        setUsers(res?.data || res || []);
      }).catch(() => {
        axiosClient.get('/users').then((res) => {
          setUsers(res?.data || res || []);
        }).catch((e) => console.error('Failed to load users for reassignment', e));
      });
    }
    setTargetUserId('');
    setReason('');
    setError(null);
  }, [isOpen, propUsers]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetUserId) {
      setError('Please select a new assignee');
      return;
    }
    if (targetUserId === String(task.assignedTo?._id || task.assignedTo)) {
      setError('Selected user is already the assignee of this task');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onReassigned(task._id, { toUserId: targetUserId, reason: reason.trim() });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to reassign task');
    } finally {
      setLoading(false);
    }
  };

  const currentName = task.assignedToName || task.assignedTo?.name || 'Current Assignee';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Reassign task</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{task.code} • {task.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500 block mb-1">Currently assigned to</span>
            <span className="font-semibold text-slate-800">{currentName}</span>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-slate-700 flex items-center gap-1">
              <span>New assignee</span>
              <span className="text-rose-500">*</span>
            </label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose someone else...</option>
              {users.map((u) => (
                <option key={u._id || u.id} value={u._id || u.id}>
                  {u.name} {u.role ? `(${u.role})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-slate-700">Reason for reassignment</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is it being reassigned?"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 shadow-xs"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
              <span>Reassign task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
