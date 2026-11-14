import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus } from 'lucide-react';
import { Button } from '../../../components/Button';
import { axiosClient } from '../../../api/axiosClient';

export const ReassignModal = ({ isOpen, onClose, onSubmit, item, occurrence, users: initialUsers = [] }) => {
  const targetItem = item || occurrence;
  const [toUserId, setToUserId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState(initialUsers);

  useEffect(() => {
    if (initialUsers && initialUsers.length > 0) setUsers(initialUsers);
  }, [initialUsers]);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!users || users.length === 0) {
      axiosClient.get('/master/users').then((res) => {
        const uList = res?.data || res || [];
        if (Array.isArray(uList)) setUsers(uList);
      }).catch(console.error);
    }
  }, [isOpen, users.length]);

  if (!isOpen || !targetItem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toUserId) return;
    setLoading(true);
    try {
      await onSubmit(targetItem._id, { toUserId, reason });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-xl shadow-card border-0 sm:border border-slate-200 max-w-md w-full p-5 sm:p-6 my-0 sm:my-auto animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900">Reassign Checklist Item</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-2 mb-4">
          Current Assignee: <span className="font-semibold text-slate-800">{targetItem.assignedToName || 'Unassigned'}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Reassign To</label>
            <select
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              required
              className="field-input"
            >
              <option value="">Select Employee</option>
              {users
                .filter((u) => u._id !== item.assignedTo?._id)
                .map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="field-label">Reason for Reassignment</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Delegating due to site visit / leave..."
              className="field-input resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={loading} size="sm">
              Confirm Reassignment
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
