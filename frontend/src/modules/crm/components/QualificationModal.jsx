import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, Calendar, FileText } from 'lucide-react';
import { crmEnquiryApi } from '../../../api/crmEnquiryApi';
import { useToast } from '../../../context/ToastContext';

export default function QualificationModal({ isOpen, onClose, enquiry, onQualified }) {
  const { showSuccess, showError } = useToast();

  const [mode, setMode] = useState('qualify'); // 'qualify' | 'reject'
  const [budgetFit, setBudgetFit] = useState(true);
  const [timeline, setTimeline] = useState('Immediate (Within 15 days)');
  const [preferredVisitDate, setPreferredVisitDate] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !enquiry) return null;

  const handleQualifySubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (mode === 'qualify') {
        await crmEnquiryApi.qualifyEnquiry(enquiry._id, {
          budgetFit,
          timeline,
          preferredVisitDate: preferredVisitDate ? new Date(preferredVisitDate) : null,
          notes,
        });
        showSuccess(`Enquiry ${enquiry.enquiryNumber || ''} marked as Qualified!`);
      } else {
        if (!rejectReason.trim()) {
          showError('Please provide a reason for rejection');
          setSubmitting(false);
          return;
        }
        await crmEnquiryApi.rejectEnquiry(enquiry._id, {
          rejectReason: rejectReason.trim(),
        });
        showSuccess(`Enquiry ${enquiry.enquiryNumber || ''} marked as Not Qualified`);
      }

      onQualified();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to update qualification');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Qualify Lead Screening — {enquiry.clientName}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {enquiry.enquiryNumber} · {enquiry.clientPhone}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/40 p-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('qualify')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-colors ${
              mode === 'qualify'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark as Qualified</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('reject')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-colors ${
              mode === 'reject'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>Not Qualified (Reject)</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleQualifySubmit} className="p-6 space-y-4">
          {mode === 'qualify' ? (
            <>
              {/* Question 1: Budget Confirmation */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Budget Verification</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer flex-1 text-xs font-medium border-emerald-300 bg-emerald-50/40">
                    <input
                      type="radio"
                      name="budgetFit"
                      checked={budgetFit === true}
                      onChange={() => setBudgetFit(true)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Budget Verified & Matches Project</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer flex-1 text-xs font-medium border-slate-200 bg-slate-50">
                    <input
                      type="radio"
                      name="budgetFit"
                      checked={budgetFit === false}
                      onChange={() => setBudgetFit(false)}
                      className="text-slate-600 focus:ring-slate-500"
                    />
                    <span>Needs Special Negotiation</span>
                  </label>
                </div>
              </div>

              {/* Question 2: Purchase Timeline */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Purchase Decision Timeline</label>
                <select
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white focus:border-emerald-500"
                >
                  <option value="Immediate (Within 15 days)">Immediate (Within 15 days)</option>
                  <option value="1 Month">Within 1 Month</option>
                  <option value="2-3 Months">2-3 Months</option>
                  <option value="Exploring for Future">Exploring for Future Investment</option>
                </select>
              </div>

              {/* Question 3: Preferred Site Visit Date */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Preferred Site Visit Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={preferredVisitDate}
                    onChange={(e) => setPreferredVisitDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Question 4: Notes */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Qualification Screening Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Verified client owns business, looking for ready possession villa for family, ready to visit this Sunday."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </>
          ) : (
            /* Reject Form */
            <div className="space-y-3">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                Marking as <strong>Not Qualified</strong> moves this enquiry out of active tele-sales queues. You can reopen it in the future if the client's criteria change.
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Reason for Non-Qualification <span className="text-rose-500">*</span>
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white focus:border-rose-500"
                >
                  <option value="">Select reason...</option>
                  <option value="Budget significantly below minimum project inventory pricing">
                    Budget below minimum project pricing
                  </option>
                  <option value="Location mismatch (Looking outside project area)">
                    Location mismatch (Looking in different city/area)
                  </option>
                  <option value="Looking for rental property only">Looking for rental property only</option>
                  <option value="Wrong number / Invalid contact / Fake enquiry">
                    Wrong number / Invalid contact
                  </option>
                  <option value="Purchased property elsewhere">Purchased property elsewhere</option>
                  <option value="Other">Other Reason</option>
                </select>
              </div>

              {rejectReason === 'Other' && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Custom Reason Details</label>
                  <textarea
                    rows={2}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter detailed reason..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-rose-500 resize-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer ${
                mode === 'qualify' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <span>{submitting ? 'Submitting...' : mode === 'qualify' ? 'Confirm Qualified' : 'Mark Rejected'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
