import React, { useState, useEffect } from 'react';
import { X, Building, MapPin, IndianRupee, Calendar, FileText, Check } from 'lucide-react';
import { pmsProjectApi } from '../../../api/pmsProjectApi';
import { useToast } from '../../../context/ToastContext';

export default function ProjectFormModal({ isOpen, onClose, project, onSaved }) {
  const { showSuccess, showError } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    nameHi: '',
    code: '',
    locality: '',
    city: 'Jaipur',
    plannedBudget: '',
    totalVillas: '',
    totalPlots: '',
    targetCompletionAt: '',
    status: 'planning',
    description: '',
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        nameHi: project.nameHi || '',
        code: project.code || '',
        locality: project.locality || '',
        city: project.city || 'Jaipur',
        plannedBudget: project.plannedBudget ? project.plannedBudget / 10000000 : '', // into Cr
        totalVillas: project.totalVillas || '',
        totalPlots: project.totalPlots || '',
        targetCompletionAt: project.targetCompletionAt
          ? new Date(project.targetCompletionAt).toISOString().split('T')[0]
          : '',
        status: project.status || 'planning',
        description: project.description || '',
      });
    } else {
      setFormData({
        name: '',
        nameHi: '',
        code: '',
        locality: '',
        city: 'Jaipur',
        plannedBudget: '',
        totalVillas: '',
        totalPlots: '',
        targetCompletionAt: '',
        status: 'planning',
        description: '',
      });
    }
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError('Project name is required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        plannedBudget: formData.plannedBudget ? Number(formData.plannedBudget) * 10000000 : 0,
        totalVillas: Number(formData.totalVillas) || 0,
        totalPlots: Number(formData.totalPlots) || 0,
      };

      if (project?._id) {
        await pmsProjectApi.updateProject(project._id, payload);
        showSuccess('Project updated successfully');
      } else {
        await pmsProjectApi.createProject(payload);
        showSuccess('New PMS Project registered successfully');
      }

      onSaved();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-600">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {project ? 'Edit PMS Construction Project' : 'Register New Construction Project'}
              </h2>
              <p className="text-xs text-slate-500">
                Initialize project under the 13-stage real estate construction lifecycle
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
          {/* Project Name (En & Hi) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Project Name (English) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Royal Palms Residency"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Project Name (Hindi / स्थानीय)</label>
              <input
                type="text"
                value={formData.nameHi}
                onChange={(e) => setFormData({ ...formData, nameHi: e.target.value })}
                placeholder="उदा. रॉयल पाल्म्स रेजीडेंसी"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          {/* Project Code & Locality */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Project Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. PRJ-RPR"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none uppercase font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Locality / Area</label>
              <input
                type="text"
                value={formData.locality}
                onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                placeholder="e.g. Sirsi Road / Expressway"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Jaipur"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          {/* Planned Budget (₹ Cr) & Units */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Planned Budget (₹ Crore)</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.plannedBudget}
                  onChange={(e) => setFormData({ ...formData, plannedBudget: e.target.value })}
                  placeholder="e.g. 24.50"
                  className="w-full pl-6 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Villas Planned</label>
              <input
                type="number"
                min="0"
                value={formData.totalVillas}
                onChange={(e) => setFormData({ ...formData, totalVillas: e.target.value })}
                placeholder="e.g. 48"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Plots Planned</label>
              <input
                type="number"
                min="0"
                value={formData.totalPlots}
                onChange={(e) => setFormData({ ...formData, totalPlots: e.target.value })}
                placeholder="e.g. 60"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          {/* Status & Target Completion Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-brand-500"
              >
                <option value="planning">Planning (Stage 1-5)</option>
                <option value="active">Active Construction (Stage 6-10)</option>
                <option value="onHold">On Hold</option>
                <option value="completed">Completed / Handed Over</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Completion Date</label>
              <input
                type="date"
                value={formData.targetCompletionAt}
                onChange={(e) => setFormData({ ...formData, targetCompletionAt: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Scope & Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief details regarding property extent, boundary, contractor scope or amenities..."
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
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{project ? 'Save Changes' : 'Initialize Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
