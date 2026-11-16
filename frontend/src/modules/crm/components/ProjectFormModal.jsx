import React, { useState, useEffect } from 'react';
import { X, MapPin, Navigation, Compass, Building2, Check, AlertCircle } from 'lucide-react';
import { crmProjectApi } from '../../../api/crmProjectApi';
import { useToast } from '../../../context/ToastContext';

export default function ProjectFormModal({ isOpen, onClose, project = null, onSaved }) {
  const { showSuccess, showError } = useToast();
  const isEdit = Boolean(project?._id);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    propertyType: 'Luxury Villas',
    status: 'open',
    description: '',
    latitude: '',
    longitude: '',
    geoFenceRadius: 500,
    googleMapLink: '',
  });

  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        code: project.code || '',
        location: project.location || '',
        propertyType: project.propertyType || 'Luxury Villas',
        status: project.status || 'open',
        description: project.description || '',
        latitude: project.latitude !== null && project.latitude !== undefined ? project.latitude : '',
        longitude: project.longitude !== null && project.longitude !== undefined ? project.longitude : '',
        geoFenceRadius: project.geoFenceRadius || 500,
        googleMapLink: project.googleMapLink || '',
      });
    } else {
      setFormData({
        name: '',
        code: '',
        location: '',
        propertyType: 'Luxury Villas',
        status: 'open',
        description: '',
        latitude: '',
        longitude: '',
        geoFenceRadius: 500,
        googleMapLink: '',
      });
    }
    setErrorMsg('');
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser');
      return;
    }
    setGeoLoading(true);
    setErrorMsg('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          googleMapLink: `https://maps.google.com/?q=${lat},${lng}`,
        }));
        setGeoLoading(false);
        showSuccess('Current GPS coordinates captured!');
      },
      (err) => {
        setGeoLoading(false);
        setErrorMsg(`Unable to retrieve location: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Project Name is required');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        location: formData.location.trim(),
        propertyType: formData.propertyType,
        status: formData.status,
        description: formData.description.trim(),
        latitude: formData.latitude !== '' ? Number(formData.latitude) : null,
        longitude: formData.longitude !== '' ? Number(formData.longitude) : null,
        geoFenceRadius: Number(formData.geoFenceRadius) || 500,
        googleMapLink: formData.googleMapLink.trim(),
      };

      if (isEdit) {
        await crmProjectApi.updateProject(project._id, payload);
        showSuccess('Project updated successfully');
      } else {
        await crmProjectApi.createProject(payload);
        showSuccess('New project created successfully');
      }

      onSaved();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save project');
      showError(err.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
              <Building2 className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEdit ? 'Edit Real Estate Project' : 'Register New Project'}
              </h2>
              <p className="text-xs text-slate-500">Configure master project details & site geo-fence coordinates</p>
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

          {/* Row 1: Name and Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Project Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Green Valley Residency"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Project Code</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g. GVR"
                className="w-full px-3 py-2 text-sm uppercase font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          {/* Row 2: Property Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                <option value="Apartments">Apartments / Flats</option>
                <option value="Commercial & Retail">Commercial & Retail</option>
                <option value="Farm Houses">Farm Houses / Plots</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Project Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white"
              >
                <option value="open">Open for Booking</option>
                <option value="hold">On Hold</option>
                <option value="soldOut">Sold Out</option>
              </select>
            </div>
          </div>

          {/* Row 3: Location */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Site Location / Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Ajmer Road, near Ring Road, Jaipur"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          {/* Geo-Fencing Section Card */}
          <div className="p-4 bg-sky-50/70 border border-sky-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-bold text-sky-900 uppercase tracking-wide">
                  GPS Geo-Fencing (Site Visit Verification)
                </span>
              </div>
              <button
                type="button"
                onClick={handleFetchCurrentLocation}
                disabled={geoLoading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-sky-700 bg-white border border-sky-300 rounded-md hover:bg-sky-100/60 transition-colors shadow-2xs"
              >
                <Navigation className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
                <span>{geoLoading ? 'Detecting...' : 'Use My GPS Location'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Latitude</label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="e.g. 26.8530"
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Longitude</label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="e.g. 75.8050"
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Radius (Meters)</label>
                <input
                  type="number"
                  name="geoFenceRadius"
                  value={formData.geoFenceRadius}
                  onChange={handleChange}
                  placeholder="500"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                />
              </div>
            </div>
            <p className="text-[11px] text-sky-800/80 leading-relaxed">
              When sales representatives log site visit reports, their physical distance from these coordinates must be within the geo-fence radius.
            </p>
          </div>

          {/* Row 4: Google Maps Link */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Google Maps Web Link</label>
            <input
              type="url"
              name="googleMapLink"
              value={formData.googleMapLink}
              onChange={handleChange}
              placeholder="https://maps.google.com/?q=..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
            />
          </div>

          {/* Row 5: Description */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Project Description & Amenities</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of project amenities, landmarks, approval status (RERA/JDA), etc."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
