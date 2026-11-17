import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, Phone, Mail, MapPin, Calendar, Clock, AlertCircle, Check, Star, Building2 } from 'lucide-react';
import { crmEnquiryApi } from '../../../api/crmEnquiryApi';
import { crmProjectApi } from '../../../api/crmProjectApi';
import { useToast } from '../../../context/ToastContext';

export default function EnquiryFormModal({ isOpen, onClose, enquiry = null, onSaved }) {
  const { showSuccess, showError } = useToast();
  const isEdit = Boolean(enquiry?._id);

  const [projectsList, setProjectsList] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    alternatePhone: '',
    clientEmail: '',
    city: '',
    source: 'phone',
    referenceName: '',
    brokerName: '',
    project: '',
    projectId: '',
    propertyType: 'Luxury Villas',
    budgetMin: '',
    budgetMax: '',
    temperature: 'warm',
    status: 'new',
    nextFollowupAt: '',
    followupTime: '',
    remarks: '',
    specialFollowUp: false,
  });

  useEffect(() => {
    if (isOpen) {
      loadProjects();
      if (enquiry) {
        setFormData({
          clientName: enquiry.clientName || '',
          clientPhone: enquiry.clientPhone || '',
          alternatePhone: enquiry.alternatePhone || '',
          clientEmail: enquiry.clientEmail || '',
          city: enquiry.city || '',
          source: enquiry.source || 'phone',
          referenceName: enquiry.referenceName || '',
          brokerName: enquiry.brokerName || '',
          project: enquiry.project || '',
          projectId: enquiry.projectId || '',
          propertyType: enquiry.propertyType || 'Luxury Villas',
          budgetMin: enquiry.budgetMin || '',
          budgetMax: enquiry.budgetMax || '',
          temperature: enquiry.temperature || 'warm',
          status: enquiry.status || 'new',
          nextFollowupAt: enquiry.nextFollowupAt ? enquiry.nextFollowupAt.slice(0, 10) : '',
          followupTime: enquiry.followupTime || '',
          remarks: enquiry.remarks || '',
          specialFollowUp: Boolean(enquiry.specialFollowUp),
        });
      } else {
        setFormData({
          clientName: '',
          clientPhone: '',
          alternatePhone: '',
          clientEmail: '',
          city: '',
          source: 'phone',
          referenceName: '',
          brokerName: '',
          project: '',
          projectId: '',
          propertyType: 'Luxury Villas',
          budgetMin: '',
          budgetMax: '',
          temperature: 'warm',
          status: 'new',
          nextFollowupAt: new Date().toISOString().slice(0, 10),
          followupTime: '11:00 AM',
          remarks: '',
          specialFollowUp: false,
        });
      }
      setDuplicateWarning(null);
      setErrorMsg('');
    }
  }, [isOpen, enquiry]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const loadProjects = async () => {
    try {
      const res = await crmProjectApi.getProjects();
      setProjectsList(res.projects || []);
    } catch (e) {
      // Non-blocking
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePhoneBlur = async () => {
    if (!formData.clientPhone || isEdit) return;
    try {
      const res = await crmEnquiryApi.checkPhone(formData.clientPhone);
      if (res.exists && res.data) {
        setDuplicateWarning(res.data);
      } else {
        setDuplicateWarning(null);
      }
    } catch (e) {
      // non-blocking
    }
  };

  const handleProjectSelect = (e) => {
    const pId = e.target.value;
    const selected = projectsList.find((p) => p._id === pId);
    setFormData((prev) => ({
      ...prev,
      projectId: pId,
      project: selected ? selected.name : '',
      propertyType: selected?.propertyType || prev.propertyType,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientName.trim()) {
      setErrorMsg('Client Name is required');
      return;
    }
    if (!formData.clientPhone.trim()) {
      setErrorMsg('Phone Number is required');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const payload = {
        ...formData,
        budgetMin: Number(formData.budgetMin) || 0,
        budgetMax: Number(formData.budgetMax) || 0,
      };

      if (isEdit) {
        await crmEnquiryApi.updateEnquiry(enquiry._id, payload);
        showSuccess('Enquiry updated successfully');
      } else {
        await crmEnquiryApi.createEnquiry(payload);
        showSuccess('New enquiry registered successfully');
      }

      onSaved();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save enquiry');
      showError(err.message || 'Failed to save enquiry');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
              <UserPlus className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEdit ? `Edit Enquiry (${enquiry.enquiryNumber || ''})` : 'Register Inbound Enquiry'}
              </h2>
              <p className="text-xs text-slate-500">Capture customer requirements, budget, and follow-up plan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {duplicateWarning && (
            <div className="flex items-start gap-2.5 p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold">Existing Phone Number Found!</p>
                <p className="mt-0.5">
                  This phone number is already registered for <strong>{duplicateWarning.clientName}</strong> ({duplicateWarning.enquiryNumber}) with status <strong>{duplicateWarning.status}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Row 1: Client Name and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Client Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                placeholder="Full name of client"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="clientPhone"
                  value={formData.clientPhone}
                  onChange={handleChange}
                  onBlur={handlePhoneBlur}
                  placeholder="+91 98290 12345"
                  className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Row 2: Alternate Phone, Email, City */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Alternate Phone / WhatsApp</label>
              <input
                type="text"
                name="alternatePhone"
                value={formData.alternatePhone}
                onChange={handleChange}
                placeholder="+91 94140 ..."
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  name="clientEmail"
                  value={formData.clientEmail}
                  onChange={handleChange}
                  placeholder="client@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">City / Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Jaipur"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Source, Project, Property Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Lead Source</label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
              >
                <option value="phone">Direct Phone Call</option>
                <option value="walkIn">Site / Office Walk-In</option>
                <option value="metaAds">Meta (Facebook/Instagram) Ads</option>
                <option value="broker">Broker / Channel Partner</option>
                <option value="reference">Client Reference</option>
                <option value="website">Website Form</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Interested Project</label>
              <select
                value={formData.projectId}
                onChange={handleProjectSelect}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
              >
                <option value="">Select Project...</option>
                {projectsList.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} {p.code ? `(${p.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Property Type</label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
              >
                <option value="Luxury Villas">Luxury Villas</option>
                <option value="Residential Plots">Residential Plots</option>
                <option value="Commercial & Retail">Commercial & Retail</option>
                <option value="Apartments">Apartments</option>
              </select>
            </div>
          </div>

          {/* Row 4: Budget Range and Temperature */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Min Budget (₹)</label>
              <input
                type="number"
                name="budgetMin"
                value={formData.budgetMin}
                onChange={handleChange}
                placeholder="e.g. 5000000"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Max Budget (₹)</label>
              <input
                type="number"
                name="budgetMax"
                value={formData.budgetMax}
                onChange={handleChange}
                placeholder="e.g. 12000000"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Temperature</label>
              <select
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white font-semibold"
              >
                <option value="hot" className="text-rose-600">🔥 Hot (High Intent)</option>
                <option value="warm" className="text-amber-600">☀️ Warm (Interested)</option>
                <option value="cold" className="text-slate-600">❄️ Cold (Browsing)</option>
              </select>
            </div>
          </div>

          {/* Row 5: Follow-up Scheduling */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
              <span>Next Follow-up Schedule</span>
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-amber-700 normal-case font-semibold text-xs">
                <input
                  type="checkbox"
                  name="specialFollowUp"
                  checked={formData.specialFollowUp}
                  onChange={handleChange}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>Mark as Special Follow-Up</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-600">Follow-Up Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    name="nextFollowupAt"
                    value={formData.nextFollowupAt}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white outline-none focus:border-brand-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-600">Preferred Time Slot</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="followupTime"
                    value={formData.followupTime}
                    onChange={handleChange}
                    placeholder="e.g. 11:30 AM"
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 6: Initial Remarks */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Call Notes & Remarks</label>
            <textarea
              name="remarks"
              rows={3}
              value={formData.remarks}
              onChange={handleChange}
              placeholder="Initial conversation summary, specific villa facing/unit requirements, etc."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving...' : isEdit ? 'Update Enquiry' : 'Register Enquiry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
