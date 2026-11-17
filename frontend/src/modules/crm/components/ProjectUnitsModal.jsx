import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, CheckCircle2, Clock, AlertTriangle, ShieldAlert, Edit2, Check, RefreshCw } from 'lucide-react';
import { crmProjectApi } from '../../../api/crmProjectApi';
import { useToast } from '../../../context/ToastContext';

export default function ProjectUnitsModal({ isOpen, onClose, project, onUpdated }) {
  const { showSuccess, showError } = useToast();
  const [units, setUnits] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // New Unit Form State
  const [newUnit, setNewUnit] = useState({
    unitNumber: '',
    unitType: 'Villa',
    area: '',
    facing: 'East',
    price: '',
    status: 'available',
    notes: '',
  });

  // Edit Unit Inline State
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (isOpen && project?._id) {
      loadProjectDetails();
    }
  }, [isOpen, project?._id]);

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      const res = await crmProjectApi.getProject(project._id);
      if (res.data?.units) {
        setUnits(res.data.units);
      }
    } catch (err) {
      showError(err.message || 'Failed to load project inventory');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !project) return null;

  const handleAddUnit = async (e) => {
    e.preventDefault();
    if (!newUnit.unitNumber.trim()) {
      showError('Unit number is required');
      return;
    }

    try {
      setSubmitting(true);
      const res = await crmProjectApi.addUnit(project._id, newUnit);
      showSuccess(`Unit ${res.data.unitNumber} added successfully`);
      setNewUnit({
        unitNumber: '',
        unitType: 'Villa',
        area: '',
        facing: 'East',
        price: '',
        status: 'available',
        notes: '',
      });
      setShowAddForm(false);
      await loadProjectDetails();
      onUpdated?.();
    } catch (err) {
      showError(err.message || 'Failed to add unit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (unitId, newStatus) => {
    try {
      await crmProjectApi.updateUnit(project._id, unitId, { status: newStatus });
      showSuccess(`Unit marked as ${newStatus}`);
      await loadProjectDetails();
      onUpdated?.();
    } catch (err) {
      showError(err.message || 'Failed to update unit status');
    }
  };

  const handleDeleteUnit = async (unitId, unitNumber) => {
    if (!window.confirm(`Are you sure you want to remove Unit ${unitNumber}?`)) return;
    try {
      await crmProjectApi.deleteUnit(project._id, unitId);
      showSuccess(`Unit ${unitNumber} removed`);
      await loadProjectDetails();
      onUpdated?.();
    } catch (err) {
      showError(err.message || 'Failed to delete unit');
    }
  };

  const startEdit = (unit) => {
    setEditingUnitId(unit._id);
    setEditForm({
      unitNumber: unit.unitNumber,
      unitType: unit.unitType || 'Villa',
      area: unit.area || '',
      facing: unit.facing || '',
      price: unit.price || '',
      status: unit.status || 'available',
      buyerName: unit.buyerName || '',
      buyerPhone: unit.buyerPhone || '',
      notes: unit.notes || '',
    });
  };

  const saveEdit = async (unitId) => {
    try {
      await crmProjectApi.updateUnit(project._id, unitId, editForm);
      showSuccess('Unit updated');
      setEditingUnitId(null);
      await loadProjectDetails();
      onUpdated?.();
    } catch (err) {
      showError(err.message || 'Failed to save changes');
    }
  };

  const filteredUnits = units.filter((u) => {
    if (statusFilter === 'all') return true;
    return u.status === statusFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Available
          </span>
        );
      case 'booked':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            Booked / Sold
          </span>
        );
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Reserved
          </span>
        );
      case 'held':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <AlertTriangle className="w-3 h-3 text-sky-600" />
            On Hold
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{project.name}</h2>
              {project.code && (
                <span className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-slate-200 text-slate-700 rounded-md">
                  {project.code}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Unit Inventory & Availability Register ({units.length} total units)
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

        {/* Action & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {['all', 'available', 'booked', 'reserved', 'held'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-brand-600 text-white shadow-2xs'
                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                {st === 'all' ? `All (${units.length})` : st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadProjectDetails}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              title="Refresh units"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Close Form' : 'Add Unit'}</span>
            </button>
          </div>
        </div>

        {/* Add Unit Form Drawer (if open) */}
        {showAddForm && (
          <form
            onSubmit={handleAddUnit}
            className="p-4 sm:p-5 bg-brand-50/50 border-b border-brand-100/70 space-y-3 shrink-0 animate-in slide-in-from-top-3"
          >
            <div className="font-semibold text-xs text-brand-900">Add New Unit / Plot to Project</div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
              <div className="col-span-1">
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">Unit No. *</label>
                <input
                  type="text"
                  value={newUnit.unitNumber}
                  onChange={(e) => setNewUnit((p) => ({ ...p, unitNumber: e.target.value }))}
                  placeholder="e.g. Villa-107"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white outline-none focus:border-brand-500"
                  required
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">Type</label>
                <input
                  type="text"
                  value={newUnit.unitType}
                  onChange={(e) => setNewUnit((p) => ({ ...p, unitType: e.target.value }))}
                  placeholder="e.g. 4 BHK Villa"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white outline-none focus:border-brand-500"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">Area / Size</label>
                <input
                  type="text"
                  value={newUnit.area}
                  onChange={(e) => setNewUnit((p) => ({ ...p, area: e.target.value }))}
                  placeholder="e.g. 200 Sq. Yds"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white outline-none focus:border-brand-500"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">Facing</label>
                <select
                  value={newUnit.facing}
                  onChange={(e) => setNewUnit((p) => ({ ...p, facing: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white outline-none focus:border-brand-500"
                >
                  <option value="East">East</option>
                  <option value="West">West</option>
                  <option value="North">North</option>
                  <option value="South">South</option>
                  <option value="North-East">North-East</option>
                  <option value="North-West">North-West</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">Price (₹)</label>
                <input
                  type="number"
                  value={newUnit.price}
                  onChange={(e) => setNewUnit((p) => ({ ...p, price: e.target.value }))}
                  placeholder="e.g. 8500000"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white outline-none focus:border-brand-500"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">Status</label>
                <select
                  value={newUnit.status}
                  onChange={(e) => setNewUnit((p) => ({ ...p, status: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white outline-none focus:border-brand-500"
                >
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="held">On Hold</option>
                  <option value="booked">Booked</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200/60 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-3.5 py-1 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-md shadow-2xs disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Save Unit'}
              </button>
            </div>
          </form>
        )}

        {/* Units Content Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredUnits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-medium text-slate-500">No units match the selected status.</p>
              <p className="text-xs text-slate-400 mt-1">Click "Add Unit" above to register new plots or villas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Unit Number</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Area / Facing</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Buyer / Notes</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUnits.map((u) => {
                    const isEditing = editingUnitId === u._id;
                    if (isEditing) {
                      return (
                        <tr key={u._id} className="bg-amber-50/50">
                          <td className="px-4 py-2.5">
                            <input
                              type="text"
                              value={editForm.unitNumber}
                              onChange={(e) => setEditForm((p) => ({ ...p, unitNumber: e.target.value }))}
                              className="w-24 px-2 py-1 text-xs border rounded bg-white"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="text"
                              value={editForm.unitType}
                              onChange={(e) => setEditForm((p) => ({ ...p, unitType: e.target.value }))}
                              className="w-28 px-2 py-1 text-xs border rounded bg-white"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex gap-1">
                              <input
                                type="text"
                                placeholder="Area"
                                value={editForm.area}
                                onChange={(e) => setEditForm((p) => ({ ...p, area: e.target.value }))}
                                className="w-20 px-2 py-1 text-xs border rounded bg-white"
                              />
                              <input
                                type="text"
                                placeholder="Facing"
                                value={editForm.facing}
                                onChange={(e) => setEditForm((p) => ({ ...p, facing: e.target.value }))}
                                className="w-16 px-2 py-1 text-xs border rounded bg-white"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="number"
                              value={editForm.price}
                              onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))}
                              className="w-24 px-2 py-1 text-xs border rounded bg-white"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <select
                              value={editForm.status}
                              onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                              className="px-2 py-1 text-xs border rounded bg-white"
                            >
                              <option value="available">Available</option>
                              <option value="reserved">Reserved</option>
                              <option value="held">On Hold</option>
                              <option value="booked">Booked</option>
                            </select>
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="text"
                              placeholder="Buyer name/notes"
                              value={editForm.buyerName}
                              onChange={(e) => setEditForm((p) => ({ ...p, buyerName: e.target.value }))}
                              className="w-32 px-2 py-1 text-xs border rounded bg-white"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right space-x-1">
                            <button
                              type="button"
                              onClick={() => saveEdit(u._id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Save"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingUnitId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">{u.unitNumber}</td>
                        <td className="px-4 py-3 text-slate-600">{u.unitType || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {u.area ? <span>{u.area}</span> : '—'}
                          {u.facing && <span className="text-slate-400 ml-1">({u.facing})</span>}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {u.price ? `₹${Number(u.price).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(u.status)}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {u.buyerName ? (
                            <div>
                              <p className="font-semibold text-slate-800">{u.buyerName}</p>
                              {u.buyerPhone && <p className="text-[10px] text-slate-400">{u.buyerPhone}</p>}
                            </div>
                          ) : u.notes ? (
                            <span className="text-slate-500 italic text-[11px] truncate max-w-[150px] inline-block">
                              {u.notes}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            {/* Quick Status Toggles */}
                            {u.status !== 'booked' && (
                              <button
                                type="button"
                                onClick={() => handleQuickStatusChange(u._id, 'booked')}
                                className="px-2 py-0.5 text-[10px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded transition-colors"
                              >
                                Mark Booked
                              </button>
                            )}
                            {u.status !== 'available' && (
                              <button
                                type="button"
                                onClick={() => handleQuickStatusChange(u._id, 'available')}
                                className="px-2 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                              >
                                Free Up
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => startEdit(u)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                              title="Edit unit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUnit(u._id, u.unitNumber)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Delete unit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
