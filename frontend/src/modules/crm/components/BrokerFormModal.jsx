import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Handshake, User, Phone, Building, Award, Percent } from 'lucide-react';
import { crmBrokerApi } from '../../../api/crmBrokerApi';
import { useToast } from '../../../context/ToastContext';

const BROKER_LEVELS = [
  'Associate',
  'Executive',
  'Sales Manager',
  'Senior Sales Manager',
  'Area Sales Manager',
  'Regional Sales Manager',
  'Assistant Sales Director',
  'Sales Director',
];

export default function BrokerFormModal({
  isOpen,
  onClose,
  onSuccess,
  broker = null, // null for create, object for edit
  salesPersons = [],
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

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    email: '',
    agencyName: '',
    city: 'Jaipur',
    address: '',
    level: 'Associate',
    totalYards: '',
    commissionRate: 2,
    managedBy: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (broker) {
        setFormData({
          name: broker.name || '',
          phone: broker.phone || '',
          alternatePhone: broker.alternatePhone || '',
          email: broker.email || '',
          agencyName: broker.agencyName || '',
          city: broker.city || 'Jaipur',
          address: broker.address || '',
          level: broker.level || 'Associate',
          totalYards: broker.totalYards !== undefined ? String(broker.totalYards) : '',
          commissionRate: broker.commissionRate !== undefined ? broker.commissionRate : 2,
          managedBy: broker.managedBy?._id || broker.managedBy || '',
          notes: broker.notes || '',
        });
      } else {
        setFormData({
          name: '',
          phone: '',
          alternatePhone: '',
          email: '',
          agencyName: '',
          city: 'Jaipur',
          address: '',
          level: 'Associate',
          totalYards: '',
          commissionRate: 2,
          managedBy: '',
          notes: '',
        });
      }
    }
  }, [isOpen, broker]);

  if (!isOpen) return null;

  const isEdit = Boolean(broker);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      return showError('Associate name and contact phone are required');
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        totalYards: Number(formData.totalYards) || 0,
        commissionRate: Number(formData.commissionRate) || 2,
      };

      if (isEdit) {
        await crmBrokerApi.updateBroker(broker._id, payload);
        showSuccess('Associate partner details updated');
      } else {
        await crmBrokerApi.createBroker(payload);
        showSuccess('Channel partner registered successfully');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to save associate partner');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {isEdit ? 'Edit Channel Partner' : 'Register New Channel Partner / Associate'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEdit ? `${broker.brokerCode} • ${broker.name}` : 'Create an external referral partner profile'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Associate Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sunil Shekhawat"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +91 98290 12345"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Agency / Real Estate Firm</label>
              <input
                type="text"
                value={formData.agencyName}
                onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                placeholder="e.g. Shekhawat Real Estate & Builders"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="broker@example.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sales Level / Tier</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
              >
                {BROKER_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Yards (Gaj) Sold</label>
              <input
                type="number"
                min="0"
                value={formData.totalYards}
                onChange={(e) => setFormData({ ...formData, totalYards: e.target.value })}
                placeholder="e.g. 500"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Commission Rate (%)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={formData.commissionRate}
                onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Managing Sales Representative</label>
              <select
                value={formData.managedBy}
                onChange={(e) => setFormData({ ...formData, managedBy: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
              >
                <option value="">Select Manager...</option>
                {salesPersons.map((u) => (
                  <option key={u._id || u.userId} value={u._id || u.userId}>
                    {u.name} ({u.role || 'Sales'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">City / Region</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Jaipur"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Office Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. 102, Apex Mall, Tonk Road, Jaipur"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes / Partnership Terms</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Special arrangements, payment terms, key projects preferred..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 shrink-0">
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
              {submitting ? 'Saving...' : isEdit ? 'Update Partner' : 'Register Partner'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
