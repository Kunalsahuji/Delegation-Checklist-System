import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, UserCheck, Users, Check, AlertCircle } from 'lucide-react';
import { crmMetaLeadApi } from '../../../api/crmMetaLeadApi';
import { useToast } from '../../../context/ToastContext';

export default function MetaLeadAssignModal({
  isOpen,
  onClose,
  onSuccess,
  selectedLeads = [],
  salesPersons = [],
}) {
  const { showSuccess, showError } = useToast();
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSelectedUserIds([]);
    }
  }, [isOpen]);

  const getUserId = (u) => String(u?._id || u?.userId || u?.id || '');

  const safeSalesPersons = useMemo(() => {
    return (Array.isArray(salesPersons) ? salesPersons : [])
      .map((u) => u?.user || u)
      .filter((u) => u && (u._id || u.userId || u.id));
  }, [salesPersons]);

  // Round-robin distribution calculation preview
  const distribution = useMemo(() => {
    if (!selectedUserIds.length || !selectedLeads.length) return [];
    const n = selectedUserIds.length;
    const total = selectedLeads.length;

    return selectedUserIds.map((userId, index) => {
      const user = safeSalesPersons.find((u) => getUserId(u) === String(userId));
      const count = Math.floor(total / n) + (index < total % n ? 1 : 0);
      return {
        userId,
        name: user?.name || 'Sales Rep',
        count,
      };
    });
  }, [selectedUserIds, selectedLeads, safeSalesPersons]);

  if (!isOpen) return null;

  const toggleUser = (userId) => {
    const strId = String(userId);
    setSelectedUserIds((prev) =>
      prev.includes(strId) ? prev.filter((id) => id !== strId) : [...prev, strId]
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUserIds.length === safeSalesPersons.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(safeSalesPersons.map((u) => getUserId(u)));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserIds.length) {
      showError('Please select at least one sales representative');
      return;
    }

    try {
      setSubmitting(true);
      const res = await crmMetaLeadApi.assignLeads({
        leadIds: selectedLeads.map((l) => l._id),
        userIds: selectedUserIds,
      });

      if (res.success) {
        showSuccess(
          `Successfully assigned ${res.data.assignedCount} leads into CRM Enquiries pipeline`
        );
        onSuccess?.();
      }
    } catch (err) {
      showError(err.message || 'Failed to assign leads');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Assign Meta Leads</h2>
              <p className="text-xs text-slate-500">
                Release {selectedLeads.length} selected lead{selectedLeads.length === 1 ? '' : 's'} into CRM Enquiries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Select Sales Representatives ({selectedUserIds.length} of {safeSalesPersons.length} selected)
              </label>
              <button
                type="button"
                onClick={handleSelectAllUsers}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                {selectedUserIds.length === safeSalesPersons.length ? 'Deselect All' : 'Select All Team'}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50/50">
              {safeSalesPersons.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">No sales representatives available</div>
              ) : (
                safeSalesPersons.map((user) => {
                  const uid = getUserId(user);
                  const isSelected = selectedUserIds.includes(uid);
                  return (
                    <div
                      key={uid}
                      onClick={() => toggleUser(uid)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-purple-50 text-purple-900 border border-purple-200'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isSelected ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="text-xs font-semibold">{user.name}</div>
                          <div className="text-[10px] text-slate-400">{user.email || user.role}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-purple-600" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Round-robin distribution preview */}
          {distribution.length > 0 && (
            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 space-y-2">
              <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Round-Robin Lead Allocation Preview</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {distribution.map((d) => (
                  <div
                    key={d.userId}
                    className="bg-white border border-purple-200 rounded-lg px-2.5 py-1 text-xs text-purple-900 shadow-2xs flex items-center gap-1.5"
                  >
                    <span className="font-semibold">{d.name}:</span>
                    <span className="bg-purple-600 text-white rounded-full px-1.5 py-0.2 text-[10px] font-bold">
                      {d.count} lead{d.count === 1 ? '' : 's'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || selectedUserIds.length === 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>Release & Assign to CRM</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
