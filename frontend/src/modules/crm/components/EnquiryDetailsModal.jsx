import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Send,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  Edit2,
  User,
} from 'lucide-react';
import { crmEnquiryApi } from '../../../api/crmEnquiryApi';
import { useToast } from '../../../context/ToastContext';

export default function EnquiryDetailsModal({
  isOpen,
  onClose,
  enquiry,
  onEdit,
  onOpenQualify,
  onUpdated,
}) {
  const { showSuccess, showError } = useToast();
  const [newRemarkText, setNewRemarkText] = useState('');
  const [submittingRemark, setSubmittingRemark] = useState(false);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !enquiry) return null;

  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!newRemarkText.trim()) return;

    try {
      setSubmittingRemark(true);
      await crmEnquiryApi.addRemark(enquiry._id, newRemarkText.trim());
      showSuccess('Remark logged');
      setNewRemarkText('');
      onUpdated?.();
    } catch (err) {
      showError(err.message || 'Failed to add remark');
    } finally {
      setSubmittingRemark(false);
    }
  };

  const handleToggleSpecial = async () => {
    try {
      await crmEnquiryApi.toggleSpecialFollowup(enquiry._id);
      showSuccess(enquiry.specialFollowUp ? 'Removed from Special Follow-up' : 'Marked as Special Follow-up');
      onUpdated?.();
    } catch (err) {
      showError(err.message || 'Failed to update flag');
    }
  };

  const cleanPhone = (enquiry.clientPhone || '').replace(/\D/g, '');

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{enquiry.clientName}</h2>
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-200 text-slate-700 rounded-md">
                  {enquiry.enquiryNumber}
                </span>
                <button
                  type="button"
                  onClick={handleToggleSpecial}
                  className={`p-1 rounded-md transition-colors ${
                    enquiry.specialFollowUp ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-amber-400'
                  }`}
                  title={enquiry.specialFollowUp ? 'Special Follow-up Pinned' : 'Pin to Special Follow-ups'}
                >
                  <Star className={`w-4 h-4 ${enquiry.specialFollowUp ? 'fill-amber-400 text-amber-500' : ''}`} />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Source: <span className="capitalize font-semibold text-slate-700">{enquiry.source}</span> · Registered{' '}
                {new Date(enquiry.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit?.(enquiry);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg border border-slate-200 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Contact & Action Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Primary Phone</span>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="font-mono font-bold text-slate-900 text-sm">{enquiry.clientPhone}</span>
                <a
                  href={`tel:${enquiry.clientPhone}`}
                  className="p-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded"
                  title="Direct Call"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 bg-emerald-500 text-white hover:bg-emerald-600 rounded"
                  title="WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">City / Location</span>
              <p className="text-xs font-bold text-slate-800">{enquiry.city || '—'}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Intent Temperature</span>
              <div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    enquiry.temperature === 'hot'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : enquiry.temperature === 'warm'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {enquiry.temperature === 'hot' ? 'Hot' : enquiry.temperature === 'warm' ? 'Warm' : 'Cold'}
                </span>
              </div>
            </div>
          </div>

          {/* Project & Budget Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-xl space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-brand-600" />
                <span>Property Requirement</span>
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Interested Project:</span>
                  <span className="font-semibold text-slate-900">{enquiry.project || 'General Inquiry'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Property Type:</span>
                  <span className="font-semibold text-slate-900">{enquiry.propertyType || '—'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Budget Range:</span>
                  <span className="font-semibold text-slate-900">
                    ₹{Number(enquiry.budgetMin || 0).toLocaleString('en-IN')} – ₹
                    {Number(enquiry.budgetMax || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Follow-up & Status Card */}
            <div className="p-4 border border-slate-200 rounded-xl space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-brand-600" />
                <span>Follow-Up Schedule</span>
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Next Scheduled Date:</span>
                  <span className="font-semibold text-slate-900">
                    {enquiry.nextFollowupAt
                      ? new Date(enquiry.nextFollowupAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'None scheduled'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Preferred Slot:</span>
                  <span className="font-semibold text-slate-900">{enquiry.followupTime || '—'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Status:</span>
                  <span className="capitalize font-bold text-brand-700">{enquiry.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Qualification Summary if exists */}
          {enquiry.qualification?.status && enquiry.qualification.status !== 'pending' && (
            <div
              className={`p-4 rounded-xl border ${
                enquiry.qualification.status === 'qualified'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/70 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {enquiry.qualification.status === 'qualified' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider">
                  Qualification Status: {enquiry.qualification.status}
                </span>
              </div>
              <p className="text-xs leading-relaxed">
                {enquiry.qualification.status === 'qualified'
                  ? `Timeline: ${enquiry.qualification.timeline || 'Immediate'} · ${enquiry.qualification.notes || ''}`
                  : `Reason: ${enquiry.qualification.rejectReason || 'Not specified'}`}
              </p>
            </div>
          )}

          {/* Remarks History & Conversation Feed */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Remarks & Interaction History ({enquiry.remarksHistory?.length || 0})
            </h3>

            {/* Add Remark Input */}
            <form onSubmit={handleAddRemark} className="flex gap-2">
              <input
                type="text"
                value={newRemarkText}
                onChange={(e) => setNewRemarkText(e.target.value)}
                placeholder="Log a new update, call note, or follow-up outcome..."
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={submittingRemark || !newRemarkText.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Log Note</span>
              </button>
            </form>

            {/* List of past remarks */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {!enquiry.remarksHistory || enquiry.remarksHistory.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-3">No remarks recorded yet.</p>
              ) : (
                [...enquiry.remarksHistory].reverse().map((r, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                    <p className="text-xs text-slate-800 leading-relaxed">{r.text}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Logged by {r.by?.name || 'Staff'}</span>
                      <span>
                        {new Date(r.at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {enquiry.status === 'qualified' ? (
              <span className="text-emerald-700 font-semibold">✓ Qualified for Lead Pipeline</span>
            ) : (
              <span>Pending Screening</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {enquiry.status !== 'qualified' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenQualify?.(enquiry);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Screen / Qualify</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
