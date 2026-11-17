import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UserCheck, AlertCircle, ArrowRightLeft, Sparkles } from 'lucide-react';
import { crmLeadAssignmentApi } from '../../../api/crmLeadAssignmentApi';
import { useToast } from '../../../context/ToastContext';

export default function AssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  lead,
  salesPersons = [],
}) {
  const { showSuccess, showError } = useToast();
  const [assignedTo, setAssignedTo] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (lead) {
      setAssignedTo(lead.assignedTo?._id || '');
      setReason('');
    }
  }, [lead, isOpen]);

  if (!isOpen || !lead) return null;

  const isReassign = Boolean(lead.assignedTo);
  const currentAssigneeName = lead.assignedTo?.name || 'Unassigned';

  const quickReasons = [
    'Workload rebalance across sales team',
    'Client location & language preference match',
    'Senior executive required for luxury requirement',
    'Follow-up availability & scheduling match',
    'Client requested dedicated representative',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assignedTo) {
      return showError('Please select a sales representative');
    }

    if (isReassign && String(lead.assignedTo?._id) === String(assignedTo)) {
      return showError('Please select a different representative to reassign');
    }

    if (isReassign && (!reason || reason.trim().length < 10)) {
      return showError('Reassignment requires an explanation of at least 10 characters');
    }

    try {
      setSubmitting(true);
      await crmLeadAssignmentApi.assignLead(lead._id, {
        assignedTo,
        reason: reason.trim(),
        triggerType: isReassign ? 'reassign' : 'manual',
      });

      showSuccess(isReassign ? 'Lead reassigned successfully' : 'Lead assigned successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to assign lead');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                isReassign ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}
            >
              {isReassign ? <ArrowRightLeft className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {isReassign ? 'Reassign Qualified Lead' : 'Assign Qualified Lead'}
              </h2>
              <p className="text-xs text-slate-500">
                {lead.leadNumber} • {lead.clientName}
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

        {/* Lead Context Summary */}
        <div className="px-6 py-3.5 bg-blue-50/50 border-b border-blue-100/60 text-xs flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-slate-500">Current Assignee:</span>{' '}
            <span className="font-semibold text-slate-800">{currentAssigneeName}</span>
          </div>
          <div>
            <span className="text-slate-500">Project:</span>{' '}
            <span className="font-semibold text-slate-800">{lead.project || 'General'}</span>
          </div>
          {lead.budget > 0 && (
            <div>
              <span className="text-slate-500">Budget:</span>{' '}
              <span className="font-semibold text-emerald-700">₹{lead.budget.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assign To Representative <span className="text-rose-500">*</span>
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
              required
            >
              <option value="">Select sales person...</option>
              {salesPersons.map((user) => (
                <option
                  key={user._id || user.userId}
                  value={user._id || user.userId}
                  disabled={isReassign && String(lead.assignedTo?._id) === String(user._id || user.userId)}
                >
                  {user.name} ({user.role || 'Sales'}) {user.total !== undefined ? `— ${user.total} leads` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                {isReassign ? (
                  <>
                    Reason for Reassignment <span className="text-rose-500">*</span> (min 10 chars)
                  </>
                ) : (
                  'Assignment Note / Instruction (Optional)'
                )}
              </label>
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isReassign
                  ? 'Explain why this lead is being reassigned to another representative...'
                  : 'Add any specific guidance, client preferences, or follow-up timelines...'
              }
              rows={3}
              className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required={isReassign}
            />
          </div>

          {/* Quick Reason Suggestions */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick templates:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickReasons.map((qr, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(qr)}
                  className="px-2.5 py-1 text-[11px] bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-left"
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>

          {isReassign && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                Reassigning will notify both representatives and log an immutable audit event in the lead's history.
              </span>
            </div>
          )}

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
              className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors ${
                isReassign ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting
                ? 'Processing...'
                : isReassign
                ? 'Confirm Reassignment'
                : 'Assign Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
