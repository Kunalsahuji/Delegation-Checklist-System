import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MapPin,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  Phone,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import { crmVisitApi } from '../../../api/crmVisitApi';
import { crmProjectApi } from '../../../api/crmProjectApi';
import { crmLeadAssignmentApi } from '../../../api/crmLeadAssignmentApi';
import { useToast } from '../../../context/ToastContext';

export default function VisitFormModal({
  isOpen,
  onClose,
  onSuccess,
  projects = [],
  salesPersons = [],
  prefillLead = null,
}) {
  const { showSuccess, showError } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(null); // { lat, lng, accuracy, error }

  const [internalProjects, setInternalProjects] = useState([]);
  const [internalSalesPersons, setInternalSalesPersons] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    if (projects && projects.length > 0) {
      setInternalProjects(projects);
    } else {
      crmProjectApi
        .getProjects({ limit: 100 })
        .then((res) => {
          const list =
            res?.projects || res?.data?.projects || res?.data || (Array.isArray(res) ? res : []);
          setInternalProjects(list);
        })
        .catch(() => {});
    }

    if (salesPersons && salesPersons.length > 0) {
      setInternalSalesPersons(salesPersons);
    } else {
      crmLeadAssignmentApi
        .getWorkload()
        .then((res) => {
          if (res?.data && Array.isArray(res.data)) {
            setInternalSalesPersons(res.data.map((w) => w.user).filter(Boolean));
          } else if (Array.isArray(res)) {
            setInternalSalesPersons(res.map((w) => w.user || w).filter(Boolean));
          }
        })
        .catch(() => {});
    }
  }, [isOpen, projects, salesPersons]);

  const displayProjects = internalProjects.length > 0 ? internalProjects : projects;
  const displaySalesPersons = internalSalesPersons.length > 0 ? internalSalesPersons : salesPersons;

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const [formData, setFormData] = useState({
    leadId: '',
    customerName: '',
    contactNumber: '',
    visitorId: '',
    projectId: '',
    projectVisited: '',
    propertyInterested: 'Villa',
    firstPreference: '',
    secondPreference: '',
    customerBudget: '',
    customerProfession: '',
    customerAddress: '',
    seniorPerson: '',
    visitNumber: '1st',
    remarks: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (prefillLead) {
        setFormData({
          leadId: prefillLead._id || '',
          customerName: prefillLead.clientName || '',
          contactNumber: prefillLead.clientPhone || '',
          visitorId: prefillLead.assignedTo?._id || '',
          projectId: prefillLead.projectId?._id || prefillLead.projectId || '',
          projectVisited: prefillLead.project || '',
          propertyInterested: prefillLead.propertyType || 'Villa',
          firstPreference: '',
          secondPreference: '',
          customerBudget: prefillLead.budget ? String(prefillLead.budget) : '',
          customerProfession: '',
          customerAddress: prefillLead.city || '',
          seniorPerson: '',
          visitNumber: '1st',
          remarks: '',
        });
      } else {
        setFormData({
          leadId: '',
          customerName: '',
          contactNumber: '',
          visitorId: '',
          projectId: projects[0]?._id || '',
          projectVisited: projects[0]?.name || '',
          propertyInterested: 'Villa',
          firstPreference: '',
          secondPreference: '',
          customerBudget: '',
          customerProfession: '',
          customerAddress: '',
          seniorPerson: '',
          visitNumber: '1st',
          remarks: '',
        });
      }
      setGpsStatus(null);
    }
  }, [isOpen, prefillLead, projects]);

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      return showError('Geolocation is not supported by your browser');
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsStatus({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          error: null,
        });
        setGpsLoading(false);
        showSuccess('GPS coordinates captured accurately');
      },
      (err) => {
        setGpsLoading(false);
        setGpsStatus({
          lat: null,
          lng: null,
          accuracy: null,
          error: err.message || 'Unable to retrieve location',
        });
        showError(`GPS capture failed: ${err.message}. You can still submit the visit report.`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.contactNumber.trim()) {
      return showError('Customer Name and Contact Number are required');
    }

    try {
      setSubmitting(true);
      const selectedProj = projects.find((p) => String(p._id) === String(formData.projectId));

      await crmVisitApi.createVisit({
        ...formData,
        projectVisited: selectedProj ? selectedProj.name : formData.projectVisited,
        submittedLat: gpsStatus?.lat || null,
        submittedLng: gpsStatus?.lng || null,
        submittedAccuracy: gpsStatus?.accuracy || null,
      });

      showSuccess('Site visit report logged successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to submit site visit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Log Field Site Visit</h2>
              <p className="text-xs text-slate-500">
                Record physical site tour details, client feedback, and GPS geo-fence verification
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

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Geo-Fencing GPS Capture Strip */}
          <div className="p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Navigation className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">Site Geo-Verification</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Capture your current GPS location to verify the visit occurred at the project site.
                </p>
                {gpsStatus?.lat && (
                  <p className="text-[11px] font-medium text-emerald-700 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      GPS Locked: {gpsStatus.lat.toFixed(5)}, {gpsStatus.lng.toFixed(5)} (±{gpsStatus.accuracy}m)
                    </span>
                  </p>
                )}
                {gpsStatus?.error && (
                  <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{gpsStatus.error}</span>
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCaptureGps}
              disabled={gpsLoading}
              className="px-3.5 py-2 text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-100/60 rounded-xl shadow-2xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            >
              {gpsLoading ? 'Acquiring GPS...' : gpsStatus?.lat ? 'Refresh Location' : 'Capture GPS Location'}
            </button>
          </div>

          {/* Client & Visitor Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Customer Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="e.g. Ramesh Chandra"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="e.g. +91 98290 12345"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                required
              />
            </div>
          </div>

          {/* Project & Visitor User */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Project Visited <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => {
                  const p = displayProjects.find((x) => String(x._id) === e.target.value);
                  setFormData({
                    ...formData,
                    projectId: e.target.value,
                    projectVisited: p ? p.name : '',
                  });
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                required
              >
                <option value="">Select Project Site...</option>
                {displayProjects.map((proj) => (
                  <option key={proj._id} value={proj._id}>
                    {proj.name} ({proj.location || proj.city || 'Site'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Visited By (Representative)</label>
              <select
                value={formData.visitorId}
                onChange={(e) => setFormData({ ...formData, visitorId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
              >
                <option value="">Current User / Self</option>
                {displaySalesPersons.map((user) => (
                  <option key={user._id || user.userId} value={user._id || user.userId}>
                    {user.name} ({user.role || 'Sales'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Property Interests & Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Property Interested</label>
              <select
                value={formData.propertyInterested}
                onChange={(e) => setFormData({ ...formData, propertyInterested: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
              >
                <option value="Villa">Villa / House</option>
                <option value="Plot">Plot / Land</option>
                <option value="Apartment">Apartment</option>
                <option value="Commercial">Commercial Shop / Office</option>
                <option value="Farmhouse">Farmhouse</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Visit Number</label>
              <select
                value={formData.visitNumber}
                onChange={(e) => setFormData({ ...formData, visitNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
              >
                <option value="1st">1st Site Visit</option>
                <option value="2nd">2nd Site Visit (Re-visit)</option>
                <option value="3rd">3rd Site Visit</option>
                <option value="4th+">4th+ Site Visit</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Budget (₹)</label>
              <input
                type="text"
                value={formData.customerBudget}
                onChange={(e) => setFormData({ ...formData, customerBudget: e.target.value })}
                placeholder="e.g. 75,00,000"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Post-Visit Client Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">1st Preference (Unit / Facing)</label>
              <input
                type="text"
                value={formData.firstPreference}
                onChange={(e) => setFormData({ ...formData, firstPreference: e.target.value })}
                placeholder="e.g. Villa 42, Park Facing, 200 Sq. Yards"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">2nd Preference (Backup)</label>
              <input
                type="text"
                value={formData.secondPreference}
                onChange={(e) => setFormData({ ...formData, secondPreference: e.target.value })}
                placeholder="e.g. Villa 18, Corner, East Facing"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Client Background & Senior Person */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Profession</label>
              <input
                type="text"
                value={formData.customerProfession}
                onChange={(e) => setFormData({ ...formData, customerProfession: e.target.value })}
                placeholder="e.g. Senior Doctor / Business Owner"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Address / City</label>
              <input
                type="text"
                value={formData.customerAddress}
                onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                placeholder="e.g. Vaishali Nagar, Jaipur"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Senior Accompanying</label>
              <input
                type="text"
                value={formData.seniorPerson}
                onChange={(e) => setFormData({ ...formData, seniorPerson: e.target.value })}
                placeholder="e.g. Director / Sales HOD"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Detailed Remarks */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Site Tour Remarks & Observations</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Client reaction, questions asked about possession dates, negotiation on price, next meeting agreed..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 shrink-0">
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
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Visit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
