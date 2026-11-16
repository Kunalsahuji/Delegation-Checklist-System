import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, AlertCircle } from 'lucide-react';

export default function DelegationReportDelayModal({ task, isOpen, onClose, onSubmit }) {
  const [note, setNote] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (task && isOpen) {
      if (task.dueDate) {
        setExpectedDate(new Date(task.dueDate).toISOString().split('T')[0]);
      } else {
        setExpectedDate('');
      }
      setNote('');
      setError('');
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim() || note.trim().length < 2) {
      setError('Please provide a progress or delay note');
      return;
    }
    if (!expectedDate) {
      setError('Please provide an expected completion date');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSubmit(task._id, {
        note: note.trim(),
        expectedDate: new Date(expectedDate).toISOString(),
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to report progress');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-xl max-w-md w-full border-0 sm:border border-slate-200 overflow-hidden my-0 sm:my-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-200/60">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Report Progress / Delay</h3>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-xs font-medium text-slate-800 line-clamp-2">{task.title}</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Progress / Delay Remark <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Work in progress, 60% completed, awaiting vendor delivery..."
              required
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Revised Expected Completion Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
            />
          </div>

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
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Remark</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
