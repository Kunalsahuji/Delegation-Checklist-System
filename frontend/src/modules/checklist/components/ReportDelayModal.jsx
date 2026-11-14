import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Calendar } from 'lucide-react';
import { Button } from '../../../components/Button';

export const ReportDelayModal = ({ isOpen, onClose, onSubmit, item, occurrence }) => {
  const targetItem = item || occurrence;
  const [note, setNote] = useState('');
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !targetItem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setLoading(true);
    try {
      await onSubmit(targetItem._id, { note, expectedDate });
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
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">Report Delay / Progress</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-2 mb-4">
          Task: <span className="font-semibold text-slate-700">{targetItem.title}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Why is it delayed? (Progress Note)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
              rows={3}
              placeholder="Explain the reason for delay or current progress..."
              className="field-input resize-none"
            />
          </div>

          <div>
            <label className="field-label">Expected Completion Date</label>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              required
              className="field-input"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={loading} size="sm">
              Save Progress Note
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
