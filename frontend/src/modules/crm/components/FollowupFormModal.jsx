import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, Bell, User, CheckSquare } from 'lucide-react';
import { crmFollowupApi } from '../../../api/crmFollowupApi';
import { useToast } from '../../../context/ToastContext';

export default function FollowupFormModal({
  isOpen,
  onClose,
  onSuccess,
  salesPersons = [],
  prefill = null, // { referenceType, referenceId, title, clientName }
}) {
  const { showSuccess, showError } = useToast();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reminderDate: todayStr,
    reminderTime: '11:00',
    referenceType: 'personal',
    referenceId: null,
    category: 'followup',
    assignedTo: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (prefill) {
        setFormData({
          title: prefill.title || `Follow up with ${prefill.clientName || 'Client'}`,
          description: '',
          reminderDate: todayStr,
          reminderTime: '11:00',
          referenceType: prefill.referenceType || 'lead',
          referenceId: prefill.referenceId || null,
          category: 'followup',
          assignedTo: prefill.assignedTo?._id || prefill.assignedTo || '',
        });
      } else {
        setFormData({
          title: '',
          description: '',
          reminderDate: todayStr,
          reminderTime: '11:00',
          referenceType: 'personal',
          referenceId: null,
          category: 'followup',
          assignedTo: '',
        });
      }
    }
  }, [isOpen, prefill]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      return showError('Title or purpose of follow-up is required');
    }
    if (!formData.reminderDate) {
      return showError('Follow-up date is required');
    }

    try {
      setSubmitting(true);
      await crmFollowupApi.createReminder(formData);
      showSuccess('Follow-up scheduled successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to schedule follow-up');
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Schedule CRM Follow-up</h2>
              <p className="text-xs text-slate-500">
                Set a client reminder, planned discussion, or callback deadline
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Follow-up Title / Purpose <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Call client for revised site layout & quotation"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Follow-up Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.reminderDate}
                  onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Time Slot</label>
              <input
                type="time"
                value={formData.reminderTime}
                onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
              >
                <option value="followup">Client Follow-up</option>
                <option value="reminder">Special Reminder</option>
                <option value="plannedDate">Planned Stage Deadline</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Representative</label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
              >
                <option value="">Current User / Self</option>
                {salesPersons.map((user) => (
                  <option key={user._id || user.userId} value={user._id || user.userId}>
                    {user.name} ({user.role || 'Sales'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Agenda / Discussion Notes</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Key points to discuss, client objections to handle, discount approvals..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              {submitting ? 'Scheduling...' : 'Schedule Follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
