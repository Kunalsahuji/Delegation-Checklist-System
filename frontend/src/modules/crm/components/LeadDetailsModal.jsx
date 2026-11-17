import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building,
  User,
  MessageSquare,
  FileText,
  DollarSign,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { crmLeadApi } from '../../../api/crmLeadApi';
import { useToast } from '../../../context/ToastContext';

export default function LeadDetailsModal({
  lead,
  stages = [],
  projects = [],
  isOpen,
  onClose,
  onUpdate,
}) {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'history'
  const [submitting, setSubmitting] = useState(false);

  // Sub-modal states
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [targetStageId, setTargetStageId] = useState('');
  const [stageComment, setStageComment] = useState('');
  const [plannedDate, setPlannedDate] = useState('');

  const [wonModalOpen, setWonModalOpen] = useState(false);
  const [wonData, setWonData] = useState({
    finalizedProjectId: '',
    finalizedUnitId: '',
    finalizedUnitNumber: '',
    yards: '',
    actualValue: '',
    comment: '',
  });

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeType, setCloseType] = useState('lost'); // 'lost' | 'dropped'
  const [closeReason, setCloseReason] = useState('');
  const [closeComment, setCloseComment] = useState('');

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !lead) return null;

  const currentOrder = lead.currentStageOrder || 1;

  // Handle stage progression
  const handleOpenMoveModal = () => {
    // Default to the very next stage in sequence if available
    const nextStage = stages.find((s) => s.order === currentOrder + 1);
    setTargetStageId(nextStage ? nextStage._id : (stages[0]?._id || ''));
    setStageComment('');
    setPlannedDate('');
    setMoveModalOpen(true);
  };

  const handleConfirmMoveStage = async (e) => {
    e.preventDefault();
    if (!targetStageId) return showError('Please select a target stage');
    try {
      setSubmitting(true);
      await crmLeadApi.moveStage(lead._id, {
        toStageId: targetStageId,
        comment: stageComment,
        plannedAt: plannedDate || null,
      });
      showSuccess('Stage updated successfully');
      setMoveModalOpen(false);
      onUpdate?.();
    } catch (err) {
      showError(err.message || 'Failed to update stage');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Undo Stage
  const handleUndoStage = async () => {
    if (!window.confirm('Are you sure you want to revert to the previous stage?')) return;
    try {
      setSubmitting(true);
      await crmLeadApi.undoStage(lead._id);
      showSuccess('Stage reverted to previous step');
      onUpdate?.();
    } catch (err) {
      showError(err.message || 'Failed to undo stage');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Mark Won
  const handleOpenWonModal = () => {
    setWonData({
      finalizedProjectId: lead.projectId || (projects[0]?._id || ''),
      finalizedUnitId: '',
      finalizedUnitNumber: '',
      yards: lead.yards || 200,
      actualValue: lead.budget || '',
      comment: '',
    });
    setWonModalOpen(true);
  };

  const selectedProject = projects.find((p) => String(p._id) === String(wonData.finalizedProjectId));

  const handleConfirmWon = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await crmLeadApi.markWon(lead._id, wonData);
      showSuccess('Deal Closed! Lead marked as WON.');
      setWonModalOpen(false);
      onUpdate?.();
    } catch (err) {
      showError(err.message || 'Failed to mark lead as won');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Mark Lost / Dropped
  const handleOpenCloseModal = (type) => {
    setCloseType(type);
    setCloseReason('');
    setCloseComment('');
    setCloseModalOpen(true);
  };

  const handleConfirmClose = async (e) => {
    e.preventDefault();
    if (!closeReason.trim()) return showError('Please provide a reason');
    try {
      setSubmitting(true);
      if (closeType === 'lost') {
        await crmLeadApi.markLost(lead._id, { reason: closeReason, comment: closeComment });
        showSuccess('Lead marked as Lost');
      } else {
        await crmLeadApi.markDropped(lead._id, { reason: closeReason, comment: closeComment });
        showSuccess('Lead marked as Dropped');
      }
      setCloseModalOpen(false);
      onUpdate?.();
    } catch (err) {
      showError(err.message || `Failed to mark lead as ${closeType}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'won':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Won / Closed
          </span>
        );
      case 'lost':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Lost Deal
          </span>
        );
      case 'dropped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <AlertCircle className="w-3.5 h-3.5 text-slate-600" /> Dropped
          </span>
        );
      case 'active':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> Active Pipeline
          </span>
        );
    }
  };

  const getTempBadge = (temp) => {
    switch (temp) {
      case 'hot':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">🔥 HOT</span>;
      case 'cold':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">❄ COLD</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">⚡ WARM</span>;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">{lead.clientName}</h2>
                <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {lead.leadNumber}
                </span>
                {getStatusBadge(lead.status)}
                {getTempBadge(lead.temperature)}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {lead.city || 'Location N/A'}</span>
                <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5 text-slate-400" /> {lead.project || 'Project N/A'}</span>
                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-slate-400" /> Budget: ₹{Number(lead.budget || 0).toLocaleString('en-IN')}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Contact & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-white border-b border-slate-100">
          <div className="flex items-center gap-2">
            <a
              href={`tel:${lead.clientPhone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lead.clientPhone}</span>
            </a>
            {lead.clientEmail && (
              <a
                href={`mailto:${lead.clientEmail}`}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-sky-600" />
                <span>{lead.clientEmail}</span>
              </a>
            )}
            <a
              href={`https://wa.me/${lead.clientPhone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Workflow Actions (Active leads only) */}
          {lead.status === 'active' && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleUndoStage}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Revert to previous stage"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
              <button
                type="button"
                onClick={handleOpenMoveModal}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Advance Stage</span>
              </button>
              <button
                type="button"
                onClick={handleOpenWonModal}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Won</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenCloseModal('lost')}
                disabled={submitting}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              >
                Lost
              </button>
              <button
                type="button"
                onClick={() => handleOpenCloseModal('dropped')}
                disabled={submitting}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Drop
              </button>
            </div>
          )}
        </div>

        {/* Visual Stage Stepper Bar */}
        <div className="px-4 sm:px-6 py-4 bg-slate-50 border-b border-slate-100 overflow-x-auto">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Pipeline Stage Progression (Stage {currentOrder} of {stages.length || 8})
          </div>
          <div className="flex items-center gap-1 min-w-[650px]">
            {stages.map((st, index) => {
              const isPast = st.order < currentOrder;
              const isCurrent = st.order === currentOrder;
              const isFuture = st.order > currentOrder;

              return (
                <div key={st._id || index} className="flex-1 flex flex-col items-center relative group">
                  <div
                    className={`w-full h-2 rounded-full mb-2 transition-all duration-200 ${
                      isPast
                        ? 'bg-emerald-500'
                        : isCurrent
                        ? 'bg-blue-600 ring-2 ring-blue-300'
                        : 'bg-slate-200'
                    }`}
                  />
                  <div className="text-center">
                    <span
                      className={`block text-[11px] font-bold leading-tight line-clamp-1 ${
                        isCurrent
                          ? 'text-blue-700 font-extrabold'
                          : isPast
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }`}
                      title={st.name}
                    >
                      {st.name}
                    </span>
                    <span className="text-[10px] text-slate-400">Step {st.order}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs: Overview & History */}
        <div className="flex items-center gap-4 px-4 sm:px-6 border-b border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Lead Overview & Property
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Activity & Stage History</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
              {lead.stageHistory?.length || 0}
            </span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client & Requirement Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Buyer Profile & Preference
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Property Type</span>
                    <span className="font-semibold text-slate-800 capitalize">{lead.propertyType || 'Plot'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Preferred Project</span>
                    <span className="font-semibold text-slate-800">{lead.project || 'Any'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Budget Cap</span>
                    <span className="font-semibold text-slate-800">₹{Number(lead.budget || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Source</span>
                    <span className="font-semibold text-slate-800 capitalize">{lead.source || 'Phone'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Assigned Executive</span>
                    <span className="font-semibold text-slate-800">{lead.assignedTo?.name || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Visit Executive</span>
                    <span className="font-semibold text-slate-800">{lead.visitAssignedTo?.name || 'Unassigned'}</span>
                  </div>
                </div>

                {lead.notes && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 block text-[11px] mb-1">Requirement Notes</span>
                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {lead.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Deal Outcome / Current Stage Details */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Deal Status & Closing
                </h4>

                {lead.status === 'won' ? (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Deal Closed (Won)
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-emerald-900 mt-2">
                      <div>
                        <span className="text-[11px] text-emerald-700 block">Finalized Project:</span>
                        <span className="font-bold">{lead.finalizedProjectName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-emerald-700 block">Allotted Unit:</span>
                        <span className="font-bold">{lead.finalizedUnitNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-emerald-700 block">Area Sold:</span>
                        <span className="font-bold">{lead.yards} sq yards</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-emerald-700 block">Deal Revenue:</span>
                        <span className="font-bold">₹{Number(lead.actualValue || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ) : lead.status === 'lost' ? (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900">
                    <span className="font-bold block mb-1">Lead Marked as Lost</span>
                    <p className="text-[11px] text-rose-700">{lead.lostReason}</p>
                  </div>
                ) : lead.status === 'dropped' ? (
                  <div className="bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800">
                    <span className="font-bold block mb-1">Lead Dropped</span>
                    <p className="text-[11px] text-slate-600">{lead.dropReason}</p>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Current Stage</span>
                      <span className="font-bold text-blue-700 text-sm">{lead.currentStageName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Last Activity Recorded</span>
                      <span className="text-slate-700">
                        {lead.lastActivityAt ? new Date(lead.lastActivityAt).toLocaleString('en-IN') : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Planned Milestone</span>
                      <span className="text-slate-700">
                        {lead.plannedStageAt ? new Date(lead.plannedStageAt).toLocaleDateString('en-IN') : 'None'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* History & Activity Feed */
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Chronological Stage Progression & Activity Log
              </div>
              {lead.stageHistory && lead.stageHistory.length > 0 ? (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {lead.stageHistory.map((item, idx) => (
                    <div key={item._id || idx} className="relative group">
                      <div
                        className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 bg-white ${
                          item.isUndo ? 'border-amber-500 bg-amber-50' : 'border-blue-600'
                        }`}
                      />
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">
                            {item.toStageName}
                            {item.isUndo && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                UNDO
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(item.actualAt || item.movedAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {item.comment && (
                          <p className="text-xs text-slate-600 leading-relaxed">{item.comment}</p>
                        )}
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>By: {item.movedByName || item.movedBy?.name || 'System'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">No activity history recorded yet.</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>

      </div>

      {/* Sub-Modal: Move Stage */}
      {moveModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Advance Pipeline Stage</h3>
              <button type="button" onClick={() => setMoveModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmMoveStage} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Next Stage *</label>
                <select
                  value={targetStageId}
                  onChange={(e) => setTargetStageId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                  required
                >
                  {stages.map((st) => (
                    <option key={st._id} value={st._id}>
                      Step {st.order}: {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Planned Target Date / Visit Date</label>
                <input
                  type="date"
                  value={plannedDate}
                  onChange={(e) => setPlannedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Call / Milestone Remarks</label>
                <textarea
                  value={stageComment}
                  onChange={(e) => setStageComment(e.target.value)}
                  placeholder="Record outcome of the call or visit confirmation details..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500 h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMoveModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  {submitting ? 'Updating...' : 'Advance Stage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Modal: Mark Won */}
      {wonModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Close Deal — Mark as Won
              </h3>
              <button type="button" onClick={() => setWonModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmWon} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Finalized Project *</label>
                <select
                  value={wonData.finalizedProjectId}
                  onChange={(e) => setWonData({ ...wonData, finalizedProjectId: e.target.value, finalizedUnitId: '' })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-emerald-500 bg-white"
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.city || 'City'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedProject && selectedProject.units && selectedProject.units.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Unit / Plot (Optional)</label>
                  <select
                    value={wonData.finalizedUnitId}
                    onChange={(e) => {
                      const u = selectedProject.units.find((x) => String(x._id) === e.target.value);
                      setWonData({
                        ...wonData,
                        finalizedUnitId: e.target.value,
                        finalizedUnitNumber: u ? u.unitNumber : '',
                        actualValue: u ? u.price : wonData.actualValue,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="">Choose Unit from Inventory</option>
                    {selectedProject.units
                      .filter((u) => u.status === 'available')
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.unitNumber} - {u.unitType} ({u.area} sq yd) - ₹{Number(u.price).toLocaleString('en-IN')}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Yards Sold (sq yds)</label>
                  <input
                    type="number"
                    value={wonData.yards}
                    onChange={(e) => setWonData({ ...wonData, yards: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    placeholder="e.g. 200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deal Value (₹) *</label>
                  <input
                    type="number"
                    value={wonData.actualValue}
                    onChange={(e) => setWonData({ ...wonData, actualValue: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    placeholder="Final transaction price"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Closing Comments</label>
                <textarea
                  value={wonData.comment}
                  onChange={(e) => setWonData({ ...wonData, comment: e.target.value })}
                  placeholder="Token advance details, payment terms, or allotment notes..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-emerald-500 h-16"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWonModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Confirm Won Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Modal: Close (Lost / Dropped) */}
      {closeModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Mark Lead as {closeType === 'lost' ? 'Lost' : 'Dropped'}
              </h3>
              <button type="button" onClick={() => setCloseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmClose} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason *</label>
                <input
                  type="text"
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  placeholder={
                    closeType === 'lost'
                      ? 'e.g. Bought competitor project / Budget out of reach'
                      : 'e.g. Not responding after 5 follow-up attempts'
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Remarks</label>
                <textarea
                  value={closeComment}
                  onChange={(e) => setCloseComment(e.target.value)}
                  placeholder="Optional context for future reference..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-rose-500 h-16"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCloseModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg shadow-xs ${
                    closeType === 'lost' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {submitting ? 'Updating...' : `Confirm ${closeType === 'lost' ? 'Lost' : 'Drop'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>,
    document.body
  );
}
