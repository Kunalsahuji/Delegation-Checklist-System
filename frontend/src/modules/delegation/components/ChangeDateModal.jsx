import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, AlertTriangle, Clock } from 'lucide-react';

const formatCivilDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getUTCDate()).padStart(2, '0')}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
};

export default function ChangeDateModal({ task, isOpen, onClose, onSubmit }) {
  React.useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !task) return null;

  const [newDueDate, setNewDueDate] = useState(() => {
    if (task.dueDate) {
      return new Date(task.dueDate).toISOString().split('T')[0];
    }
    return '';
  });
  const [reason, setReason] = useState('');
  const [kind, setKind] = useState('revise');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDueDate) {
      setError('Please choose a valid new due date.');
      return;
    }
    if (!reason.trim() || reason.trim().length < 3) {
      setError('A mandatory reason is required to revise a task deadline (minimum 3 characters).');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSubmit(task._id, {
        newDueDate: new Date(newDueDate).toISOString(),
        reason: reason.trim(),
        kind,
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to update due date');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-xl max-w-lg w-full border-0 sm:border border-slate-200 overflow-hidden my-0 sm:my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Change Task Due Date</h3>
              <p className="text-xs text-slate-500 font-mono">{task.code}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target Task Summary */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1">
            <p className="text-xs font-medium text-slate-800 line-clamp-2">{task.title}</p>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
              <span>Doer: <strong className="text-slate-700">{task.assignedToName || 'Unassigned'}</strong></span>
              <span>•</span>
              <span>Planned: <strong className="text-slate-700">{formatCivilDate(task.originalDueDate)}</strong></span>
              <span>•</span>
              <span>Current Due: <strong className="text-slate-700">{formatCivilDate(task.dueDate)}</strong></span>
            </div>
          </div>

          {/* Audit Rule Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Mandatory Audit Requirement</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                The original planned date will remain preserved permanently. This date change will be logged in the Red/Yellow/Green performance scorecard.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Revision Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Revision Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                kind === 'revise'
                  ? 'bg-blue-50 border-blue-500 text-blue-900 font-medium'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="kind"
                  value="revise"
                  checked={kind === 'revise'}
                  onChange={() => setKind('revise')}
                  className="sr-only"
                />
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Standard Revision</span>
              </label>

              <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                kind === 'weekShift'
                  ? 'bg-orange-50 border-orange-500 text-orange-900 font-medium'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="kind"
                  value="weekShift"
                  checked={kind === 'weekShift'}
                  onChange={() => setKind('weekShift')}
                  className="sr-only"
                />
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
                <span>Week Shift (+7 days)</span>
              </label>
            </div>
          </div>

          {/* New Due Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Due Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
            />
          </div>

          {/* Mandatory Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Date Change <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this deadline is shifting (e.g., Client delayed drawing approval, site waterlogging)..."
              required
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder-slate-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              This explanation is stored in the permanent revision history.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Confirm Revision</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
