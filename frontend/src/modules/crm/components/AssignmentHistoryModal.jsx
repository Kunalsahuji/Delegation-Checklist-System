import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, History, User, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { crmLeadAssignmentApi } from '../../../api/crmLeadAssignmentApi';

export default function AssignmentHistoryModal({ isOpen, onClose, lead }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && lead?._id) {
      loadHistory();
    }
  }, [isOpen, lead]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await crmLeadAssignmentApi.getLeadHistory(lead._id);
      setHistory(res.data || []);
    } catch (err) {
      console.error('Failed to load assignment history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !lead) return null;

  const getTriggerBadge = (type) => {
    switch (type) {
      case 'roundRobin':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">Round-Robin</span>;
      case 'bulk':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">Bulk Assign</span>;
      case 'reassign':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">Reassigned</span>;
      case 'auto24h':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700">Auto 24h</span>;
      case 'unassign':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">Unassigned</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">Manual</span>;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Assignment History</h2>
              <p className="text-xs text-slate-500">
                {lead.leadNumber} • {lead.clientName}
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

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading audit trail...</div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No assignment logs recorded</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                This lead has not been reassigned through the workflow yet.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {history.map((item, idx) => (
                <div key={item._id || idx} className="relative">
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white bg-blue-600 shadow-xs" />
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTriggerBadge(item.triggerType)}
                        <span className="text-[11px] font-semibold text-slate-700">
                          {item.assignedToName || item.assignedTo?.name || 'Unassigned'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(item.assignedAt).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {item.previousAssigneeName && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <span>Transferred from:</span>
                        <span className="font-medium text-slate-700 line-through">
                          {item.previousAssigneeName}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="font-semibold text-blue-700">
                          {item.assignedToName || item.assignedTo?.name}
                        </span>
                      </div>
                    )}

                    {item.assignmentReason && (
                      <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/60">
                        "{item.assignmentReason}"
                      </p>
                    )}

                    <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1">
                      <User className="w-3 h-3" />
                      <span>Initiated by: {item.assignedByName || item.assignedBy?.name || 'System'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
