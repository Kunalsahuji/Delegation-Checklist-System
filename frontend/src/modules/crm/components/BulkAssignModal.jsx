import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, AlertCircle } from 'lucide-react';
import { crmLeadAssignmentApi } from '../../../api/crmLeadAssignmentApi';
import { useToast } from '../../../context/ToastContext';

export default function BulkAssignModal({
  isOpen,
  onClose,
  onSuccess,
  selectedLeadIds = [],
  salesPersons = [],
}) {
  const { showSuccess, showError } = useToast();
  const [assignedTo, setAssignedTo] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setAssignedTo('');
      setReason('Bulk team assignment from intake pipeline');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assignedTo) {
      return showError('Please select an assignee representative');
    }

    try {
      setSubmitting(true);
      const res = await crmLeadAssignmentApi.bulkAssign({
        leadIds: selectedLeadIds,
        assignedTo,
        reason: reason.trim(),
      });

      showSuccess(`Successfully assigned ${res.data?.assignedCount || selectedLeadIds.length} leads`);
      onSuccess?.();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to complete bulk assignment');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Bulk Assign Leads</h2>
              <p className="text-xs text-slate-500">
                Assign {selectedLeadIds.length} selected lead{selectedLeadIds.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assignee Representative <span className="text-rose-500">*</span>
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
              required
            >
              <option value="">Select sales person...</option>
              {salesPersons.map((user) => (
                <option key={user._id || user.userId} value={user._id || user.userId}>
                  {user.name} ({user.role || 'Sales'}) {user.total !== undefined ? `— ${user.total} leads` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assignment Reason / Note
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Add reason for bulk assignment..."
              rows={3}
              className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200/80 text-[11px] text-blue-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            <span>
              All {selectedLeadIds.length} selected leads will have their ownership transferred and assignment logs recorded.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              {submitting ? 'Assigning...' : `Assign ${selectedLeadIds.length} Leads`}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
