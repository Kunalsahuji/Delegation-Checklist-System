import React, { useState, useEffect } from 'react';
import { X, MapPin, Building2, IndianRupee, FileText, Check, User } from 'lucide-react';
import { pmsPlotApi } from '../../../api/pmsPlotApi';
import { pmsProjectApi } from '../../../api/pmsProjectApi';
import { useToast } from '../../../context/ToastContext';

export default function PlotFormModal({ isOpen, onClose, plot, onSaved }) {
  const { showSuccess, showError } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    project: '',
    surveyNumber: '',
    village: '',
    tehsil: '',
    district: 'Jaipur',
    state: 'Rajasthan',
    pincode: '',
    areaValue: '',
    areaUnit: 'sqyd',
    expectedRatePerUnit: '',
    expectedTotalPrice: '',
    ownerName: '',
    ownerContact: '',
    source: 'broker',
    brokerName: '',
    brokerMobile: '',
    commissionPct: '',
    zoning: 'residential',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      pmsProjectApi.listProjects({ limit: 100 }).then((res) => {
        if (res.success && res.data) setProjects(res.data);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (plot) {
      setFormData({
        title: plot.title || '',
        project: plot.project?._id || plot.project || '',
        surveyNumber: plot.surveyNumber || '',
        village: plot.location?.village || '',
        tehsil: plot.location?.tehsil || '',
        district: plot.location?.district || 'Jaipur',
        state: plot.location?.state || 'Rajasthan',
        pincode: plot.location?.pincode || '',
        areaValue: plot.area?.value || '',
        areaUnit: plot.area?.unit || 'sqyd',
        expectedRatePerUnit: plot.expectedRatePerUnit || '',
        expectedTotalPrice: plot.expectedTotalPrice ? plot.expectedTotalPrice / 10000000 : '',
        ownerName: plot.owner?.name || '',
        ownerContact: plot.owner?.contact || '',
        source: plot.source || 'broker',
        brokerName: plot.broker?.name || '',
        brokerMobile: plot.broker?.mobile || '',
        commissionPct: plot.broker?.commissionPct || '',
        zoning: plot.zoning || 'residential',
        notes: plot.notes || '',
      });
    } else {
      setFormData({
        title: '',
        project: '',
        surveyNumber: '',
        village: '',
        tehsil: '',
        district: 'Jaipur',
        state: 'Rajasthan',
        pincode: '',
        areaValue: '',
        areaUnit: 'sqyd',
        expectedRatePerUnit: '',
        expectedTotalPrice: '',
        ownerName: '',
        ownerContact: '',
        source: 'broker',
        brokerName: '',
        brokerMobile: '',
        commissionPct: '',
        zoning: 'residential',
        notes: '',
      });
    }
  }, [plot, isOpen]);

  // Auto calculate total expected price
  const handleAreaOrRateChange = (areaVal, rateVal) => {
    const a = Number(areaVal) || 0;
    const r = Number(rateVal) || 0;
    if (a > 0 && r > 0) {
      const total = a * r;
      setFormData((prev) => ({
        ...prev,
        areaValue: areaVal,
        expectedRatePerUnit: rateVal,
        expectedTotalPrice: (total / 10000000).toFixed(2), // into Cr
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        areaValue: areaVal,
        expectedRatePerUnit: rateVal,
      }));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.project || !formData.ownerName.trim()) {
      showError('Please fill in Plot Title, Target Project, and Owner Name');
      return;
    }

    try {
      setSubmitting(true);
      const totalInRupees = formData.expectedTotalPrice
        ? Number(formData.expectedTotalPrice) * 10000000
        : Number(formData.areaValue) * Number(formData.expectedRatePerUnit);

      const payload = {
        title: formData.title.trim(),
        project: formData.project,
        surveyNumber: formData.surveyNumber.trim(),
        location: {
          village: formData.village.trim(),
          tehsil: formData.tehsil.trim(),
          district: formData.district,
          state: formData.state,
          pincode: formData.pincode.trim(),
        },
        area: {
          value: Number(formData.areaValue) || 0,
          unit: formData.areaUnit,
        },
        expectedRatePerUnit: Number(formData.expectedRatePerUnit) || 0,
        expectedTotalPrice: totalInRupees || 0,
        owner: {
          name: formData.ownerName.trim(),
          contact: formData.ownerContact.trim(),
        },
        source: formData.source,
        broker: {
          name: formData.brokerName.trim(),
          mobile: formData.brokerMobile.trim(),
          commissionPct: Number(formData.commissionPct) || 0,
        },
        zoning: formData.zoning,
        notes: formData.notes.trim(),
      };

      if (plot?._id) {
        await pmsPlotApi.updatePlot(plot._id, payload);
        showSuccess('Land plot updated successfully');
      } else {
        await pmsPlotApi.createPlot(payload);
        showSuccess('New land plot registered for scouting');
      }

      onSaved();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to save land plot');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {plot ? 'Edit Scouted Land Plot' : 'Register Land Plot (Scouting & Acquisition)'}
              </h2>
              <p className="text-xs text-slate-500">
                Stage 1 Land Acquisition: Record survey number, land area, rate benchmarking, and owner contacts.
              </p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Plot Title & Project Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Plot Title / Identifier <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Khasra 402/1 Highway Parcel"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Target PMS Project <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-brand-500"
              >
                <option value="">Select Associated Project...</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    [{p.code}] {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Survey #, Village & Tehsil */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Khasra / Survey Number</label>
              <input
                type="text"
                value={formData.surveyNumber}
                onChange={(e) => setFormData({ ...formData, surveyNumber: e.target.value })}
                placeholder="e.g. KH-402/1"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Village / Locality</label>
              <input
                type="text"
                value={formData.village}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                placeholder="e.g. Sirsi / Mahapura"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tehsil</label>
              <input
                type="text"
                value={formData.tehsil}
                onChange={(e) => setFormData({ ...formData, tehsil: e.target.value })}
                placeholder="e.g. Sanganer / Amer"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          {/* Area Value, Unit & Rates */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Land Area <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.areaValue}
                onChange={(e) => handleAreaOrRateChange(e.target.value, formData.expectedRatePerUnit)}
                placeholder="e.g. 12500"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Area Unit</label>
              <select
                value={formData.areaUnit}
                onChange={(e) => setFormData({ ...formData, areaUnit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-brand-500"
              >
                <option value="sqyd">Sq.Yd (Gaj)</option>
                <option value="sqft">Sq.Ft</option>
                <option value="bigha">Bigha</option>
                <option value="acre">Acre</option>
                <option value="sqm">Sq.M</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Rate / Unit (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.expectedRatePerUnit}
                onChange={(e) => handleAreaOrRateChange(formData.areaValue, e.target.value)}
                placeholder="e.g. 14000"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Est. Total (₹ Cr)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.expectedTotalPrice}
                onChange={(e) => setFormData({ ...formData, expectedTotalPrice: e.target.value })}
                placeholder="e.g. 17.50"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 font-semibold text-slate-800 outline-none"
              />
            </div>
          </div>

          {/* Owner Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Landowner Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="e.g. Ramavtar Sharma"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Owner Contact Phone</label>
              <input
                type="text"
                value={formData.ownerContact}
                onChange={(e) => setFormData({ ...formData, ownerContact: e.target.value })}
                placeholder="e.g. 9829011222"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Zoning Category</label>
              <select
                value={formData.zoning}
                onChange={(e) => setFormData({ ...formData, zoning: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-brand-500"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="agricultural">Agricultural</option>
                <option value="mixed">Mixed Use</option>
                <option value="industrial">Industrial</option>
              </select>
            </div>
          </div>

          {/* Lead Source & Broker Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lead Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-brand-500"
              >
                <option value="broker">Channel Partner / Broker</option>
                <option value="direct">Direct from Landowner</option>
                <option value="agent">Local Agent</option>
                <option value="online">Online / Public Notice</option>
                <option value="other">Other Reference</option>
              </select>
            </div>
            {formData.source === 'broker' && (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Broker / Agency Name</label>
                  <input
                    type="text"
                    value={formData.brokerName}
                    onChange={(e) => setFormData({ ...formData, brokerName: e.target.value })}
                    placeholder="e.g. Shekhawat Real Estate"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Broker Mobile</label>
                  <input
                    type="text"
                    value={formData.brokerMobile}
                    onChange={(e) => setFormData({ ...formData, brokerMobile: e.target.value })}
                    placeholder="e.g. 9829800101"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Field Scouting Observations</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Road width, high-tension lines, water level, mutation status, topography notes..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{plot ? 'Save Changes' : 'Register Plot'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
