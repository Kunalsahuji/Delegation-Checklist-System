import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import {
  X,
  HeartHandshake,
  ShieldAlert,
  CalendarCheck2,
  Headphones,
  MessageSquareHeart,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Send,
  Building,
  Save,
  Check,
  Star,
  Sparkles,
  Wrench,
  ThumbsUp,
} from 'lucide-react';
import { pmsAfterSalesApi } from '../../../api/pmsAfterSalesApi';

const SECTIONS = [
  { key: 'warrantyClaims', title: '1. Warranty Claims (DLP)', icon: ShieldAlert },
  { key: 'amcVisits', title: '2. AMC Service Visits', icon: CalendarCheck2 },
  { key: 'customerSupport', title: '3. Resident Support Desk', icon: Headphones },
  { key: 'feedback', title: '4. Customer Satisfaction & NPS', icon: MessageSquareHeart },
];

export default function AfterSalesWorkspaceModal({ recordId, onClose, onRefresh }) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('warrantyClaims');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Claims state
  const [claims, setClaims] = useState([]);
  const [claimsRemarks, setClaimsRemarks] = useState('');
  const [newClaim, setNewClaim] = useState({
    claimNumber: '',
    customerName: '',
    unitNumber: '',
    trade: 'Plumbing',
    severity: 'Medium',
    issueDescription: '',
    assignedTechnician: 'DLP Rapid Response Team',
    resolutionCost: 0,
    status: 'Reported',
  });

  // 2. AMC Visits state
  const [visits, setVisits] = useState([]);
  const [visitsRemarks, setVisitsRemarks] = useState('');
  const [newVisit, setNewVisit] = useState({
    visitCode: '',
    visitType: 'Quarterly Preventive Maintenance',
    scheduledDate: new Date().toISOString().slice(0, 10),
    vendorName: 'BlueStar MEP Facilities',
    technicianName: 'Certified Service Engineer',
    findings: 'Routine diagnostic OK',
    status: 'Scheduled',
  });

  // 3. Support Tickets state
  const [tickets, setTickets] = useState([]);
  const [ticketsRemarks, setTicketsRemarks] = useState('');
  const [newTicket, setNewTicket] = useState({
    ticketNumber: '',
    customerName: '',
    contactNumber: '',
    category: 'Facility Maintenance',
    priority: 'Medium',
    subject: '',
    resolutionNotes: '',
    status: 'Open',
  });

  // 4. Feedback state
  const [reviews, setReviews] = useState([]);
  const [feedbackRemarks, setFeedbackRemarks] = useState('');
  const [newReview, setNewReview] = useState({
    reviewId: '',
    customerName: '',
    unitNumber: '',
    overallRating: 5,
    qualityRating: 5,
    serviceSpeedRating: 5,
    comments: '',
    npsScore: 10,
  });

  const [approvalNote, setApprovalNote] = useState('');

  useEffect(() => {
    if (recordId) {
      loadRecord(recordId);
    }
  }, [recordId]);

  const loadRecord = async (id) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await pmsAfterSalesApi.getRecordById(id);
      const data = res.data;
      setRecord(data);

      if (data.warrantyClaims) {
        setClaims(data.warrantyClaims.claims || []);
        setClaimsRemarks(data.warrantyClaims.remarks || '');
      }

      if (data.amcVisits) {
        setVisits(data.amcVisits.visits || []);
        setVisitsRemarks(data.amcVisits.remarks || '');
      }

      if (data.customerSupport) {
        setTickets(data.customerSupport.tickets || []);
        setTicketsRemarks(data.customerSupport.remarks || '');
      }

      if (data.feedback) {
        setReviews(data.feedback.reviews || []);
        setFeedbackRemarks(data.feedback.remarks || '');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load record');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSection = async (sectionKey) => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      let payload = {};
      if (sectionKey === 'warrantyClaims') {
        payload = { claims, remarks: claimsRemarks };
      } else if (sectionKey === 'amcVisits') {
        payload = { visits, remarks: visitsRemarks };
      } else if (sectionKey === 'customerSupport') {
        payload = { tickets, remarks: ticketsRemarks };
      } else if (sectionKey === 'feedback') {
        payload = { reviews, remarks: feedbackRemarks };
      }

      const res = await pmsAfterSalesApi.updateSection(record._id, sectionKey, payload);
      setRecord(res.data);
      setSuccessMsg(`Section "${sectionKey}" saved successfully!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteSection = async (sectionKey) => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await handleSaveSection(sectionKey);
      const res = await pmsAfterSalesApi.completeSection(record._id, sectionKey, 'Completed & verified');
      setRecord(res.data);
      setSuccessMsg(`Section "${sectionKey}" marked as completed!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to complete section');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestApproval = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await pmsAfterSalesApi.requestApproval(record._id);
      setRecord(res.data);
      setSuccessMsg('Submitted for Stage 13 Final DLP Maturity & Lifecycle Sign-off!');
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit approval');
    } finally {
      setSaving(false);
    }
  };

  const handleDecideApproval = async (decision) => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await pmsAfterSalesApi.decideApproval(record._id, {
        decision,
        reason: approvalNote || `After-Sales ${decision}`,
      });
      setRecord(res.data);
      setSuccessMsg(`Stage 13 DLP ${decision === 'approved' ? 'Approved & Full Project Lifecycle Completed!' : 'Rejected'}`);
      setApprovalNote('');
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed decision gate');
    } finally {
      setSaving(false);
    }
  };

  const handleAddClaim = () => {
    if (!newClaim.customerName.trim() || !newClaim.issueDescription.trim()) return;
    const claimNumber = newClaim.claimNumber.trim() || `CLM-${Date.now().toString().slice(-4)}`;
    setClaims((prev) => [
      ...prev,
      {
        ...newClaim,
        claimNumber,
        reportedDate: new Date(),
        resolvedDate: newClaim.status === 'Rectified' || newClaim.status === 'Closed' ? new Date() : null,
      },
    ]);
    setNewClaim({
      claimNumber: '',
      customerName: '',
      unitNumber: '',
      trade: 'Plumbing',
      severity: 'Medium',
      issueDescription: '',
      assignedTechnician: 'DLP Rapid Response Team',
      resolutionCost: 0,
      status: 'Reported',
    });
  };

  const handleUpdateClaimStatus = (idx, status) => {
    setClaims((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        status,
        resolvedDate: status === 'Rectified' || status === 'Closed' ? new Date() : null,
      };
      return copy;
    });
  };

  const handleAddVisit = () => {
    if (!newVisit.visitType.trim()) return;
    const visitCode = newVisit.visitCode.trim() || `AMC-${Date.now().toString().slice(-4)}`;
    setVisits((prev) => [
      ...prev,
      {
        ...newVisit,
        visitCode,
        completedDate: newVisit.status === 'Completed' ? new Date() : null,
      },
    ]);
    setNewVisit({
      visitCode: '',
      visitType: 'Quarterly Preventive Maintenance',
      scheduledDate: new Date().toISOString().slice(0, 10),
      vendorName: 'BlueStar MEP Facilities',
      technicianName: 'Certified Service Engineer',
      findings: 'Routine diagnostic OK',
      status: 'Scheduled',
    });
  };

  const handleUpdateVisitStatus = (idx, status) => {
    setVisits((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        status,
        completedDate: status === 'Completed' ? new Date() : null,
      };
      return copy;
    });
  };

  const handleAddTicket = () => {
    if (!newTicket.customerName.trim() || !newTicket.subject.trim()) return;
    const ticketNumber = newTicket.ticketNumber.trim() || `TKT-${Date.now().toString().slice(-4)}`;
    setTickets((prev) => [
      ...prev,
      {
        ...newTicket,
        ticketNumber,
        openedAt: new Date(),
        closedAt: newTicket.status === 'Resolved' || newTicket.status === 'Closed' ? new Date() : null,
      },
    ]);
    setNewTicket({
      ticketNumber: '',
      customerName: '',
      contactNumber: '',
      category: 'Facility Maintenance',
      priority: 'Medium',
      subject: '',
      resolutionNotes: '',
      status: 'Open',
    });
  };

  const handleUpdateTicketStatus = (idx, status) => {
    setTickets((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        status,
        closedAt: status === 'Resolved' || status === 'Closed' ? new Date() : null,
      };
      return copy;
    });
  };

  const handleAddReview = () => {
    if (!newReview.customerName.trim()) return;
    const reviewId = newReview.reviewId.trim() || `REV-${Date.now().toString().slice(-4)}`;
    setReviews((prev) => [
      ...prev,
      {
        ...newReview,
        reviewId,
        submittedAt: new Date(),
      },
    ]);
    setNewReview({
      reviewId: '',
      customerName: '',
      unitNumber: '',
      overallRating: 5,
      qualityRating: 5,
      serviceSpeedRating: 5,
      comments: '',
      npsScore: 10,
    });
  };

  if (loading) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-hidden animate-in fade-in duration-150">
        <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading Stage 13 After-Sales Workspace...</p>
        </div>
      </div>,
      document.body
    );
  }

  if (!record) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] max-h-[95vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-600/30 flex items-center justify-center text-pink-400 border border-pink-500/30">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Stage 13: After Sales & DLP Management Workspace
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  {record.code}
                </span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                  record.status === 'approved' || record.status === 'dlpMatured'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {record.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{record.project?.name || 'Project Name'}</span>
                <span className="text-slate-600">•</span>
                <span>Code: {record.project?.code || 'PRJ'}</span>
                <span className="text-slate-600">•</span>
                <span>Stage Order: 13 (Terminal Lifecycle)</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-50 border-b border-slate-200 px-6 pt-3 overflow-x-auto">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isCompleted = record[sec.key]?.status === 'completed';
            const isActive = activeTab === sec.key;
            return (
              <button
                key={sec.key}
                onClick={() => {
                  setActiveTab(sec.key);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
                  isActive
                    ? 'bg-white text-pink-700 border-pink-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-pink-600' : 'text-slate-400'}`} />
                <span>{sec.title}</span>
                {isCompleted && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: WARRANTY CLAIMS */}
          {activeTab === 'warrantyClaims' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Defect Liability Period (DLP) Claims</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Warranty claim registration, technician dispatch, and resolution SLA tracking.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    record.warrantyClaims?.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    Status: {record.warrantyClaims?.status || 'inProgress'}
                  </span>
                </div>
              </div>

              {/* Claims List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                {claims.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No warranty claims recorded. Use the form below to register a claim.
                  </div>
                ) : (
                  claims.map((claim, idx) => (
                    <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{claim.claimNumber}</span>
                          <span className="text-xs font-medium text-slate-600">• {claim.customerName} ({claim.unitNumber})</span>
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700">
                            {claim.trade}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                            claim.severity === 'Critical'
                              ? 'bg-rose-100 text-rose-700'
                              : claim.severity === 'High'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {claim.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{claim.issueDescription}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Assigned to: {claim.assignedTechnician}
                          {claim.resolutionCost > 0 && ` • Cost: ₹${claim.resolutionCost.toLocaleString('en-IN')}`}
                        </p>
                      </div>

                      <select
                        value={claim.status}
                        onChange={(e) => handleUpdateClaimStatus(idx, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer self-start sm:self-auto ${
                          claim.status === 'Closed' || claim.status === 'Rectified'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'bg-amber-50 border-amber-300 text-amber-700'
                        }`}
                      >
                        <option value="Reported">Reported</option>
                        <option value="Investigating">Investigating</option>
                        <option value="WorkAssigned">Work Assigned</option>
                        <option value="Rectified">Rectified</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  ))
                )}
              </div>

              {/* Add Claim Form */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Log New DLP Claim</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={newClaim.customerName}
                    onChange={(e) => setNewClaim({ ...newClaim, customerName: e.target.value })}
                    placeholder="Customer Name..."
                    className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                  <input
                    type="text"
                    value={newClaim.unitNumber}
                    onChange={(e) => setNewClaim({ ...newClaim, unitNumber: e.target.value })}
                    placeholder="Unit / Flat Number..."
                    className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                  <select
                    value={newClaim.trade}
                    onChange={(e) => setNewClaim({ ...newClaim, trade: e.target.value })}
                    className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 cursor-pointer"
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Civil & Masonry">Civil & Masonry</option>
                    <option value="Painting & Finishing">Painting & Finishing</option>
                    <option value="Waterproofing">Waterproofing</option>
                  </select>
                  <select
                    value={newClaim.severity}
                    onChange={(e) => setNewClaim({ ...newClaim, severity: e.target.value })}
                    className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newClaim.issueDescription}
                    onChange={(e) => setNewClaim({ ...newClaim, issueDescription: e.target.value })}
                    placeholder="Defect details / issue description..."
                    className="sm:col-span-2 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddClaim}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Claim</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Warranty Audit & Root Cause Remarks
                </label>
                <textarea
                  rows={2}
                  value={claimsRemarks}
                  onChange={(e) => setClaimsRemarks(e.target.value)}
                  placeholder="Record defect trends, contractor warranty recovery notes..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveSection('warrantyClaims')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Claims Draft</span>
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleCompleteSection('warrantyClaims')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Complete Warranty Audit</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: AMC VISITS */}
          {activeTab === 'amcVisits' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Annual Maintenance Contracts (AMC) & Service Log</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Preventive servicing schedules for elevators, HVAC, water purification, and diesel generators.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    record.amcVisits?.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    Status: {record.amcVisits?.status || 'inProgress'}
                  </span>
                </div>
              </div>

              {/* Visits List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                {visits.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No AMC maintenance visits logged.
                  </div>
                ) : (
                  visits.map((v, idx) => (
                    <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{v.visitCode}</span>
                          <span className="text-xs font-semibold text-slate-700">• {v.visitType}</span>
                          <span className="text-[11px] text-slate-500">({v.vendorName})</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{v.findings}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Tech: {v.technicianName} • Date: {new Date(v.scheduledDate).toLocaleDateString()}
                        </p>
                      </div>

                      <select
                        value={v.status}
                        onChange={(e) => handleUpdateVisitStatus(idx, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer self-start sm:self-auto ${
                          v.status === 'Completed'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'bg-blue-50 border-blue-300 text-blue-700'
                        }`}
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Rescheduled">Rescheduled</option>
                      </select>
                    </div>
                  ))
                )}
              </div>

              {/* Add AMC Visit */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Schedule AMC Visit</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newVisit.visitType}
                    onChange={(e) => setNewVisit({ ...newVisit, visitType: e.target.value })}
                    placeholder="Visit Type (e.g. Lift Safety Audit)..."
                    className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                  <input
                    type="text"
                    value={newVisit.vendorName}
                    onChange={(e) => setNewVisit({ ...newVisit, vendorName: e.target.value })}
                    placeholder="Vendor Name..."
                    className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                  <input
                    type="date"
                    value={newVisit.scheduledDate}
                    onChange={(e) => setNewVisit({ ...newVisit, scheduledDate: e.target.value })}
                    className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newVisit.findings}
                    onChange={(e) => setNewVisit({ ...newVisit, findings: e.target.value })}
                    placeholder="Observations / findings / service notes..."
                    className="sm:col-span-2 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddVisit}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Visit</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  AMC Operational Remarks
                </label>
                <textarea
                  rows={2}
                  value={visitsRemarks}
                  onChange={(e) => setVisitsRemarks(e.target.value)}
                  placeholder="Record equipment uptime, preventive compliance notes..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveSection('amcVisits')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save AMC Log</span>
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleCompleteSection('amcVisits')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Complete AMC Sign-Off</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMER SUPPORT */}
          {activeTab === 'customerSupport' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Customer Support & Grievance Tickets</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Helpdesk query management, billing assistance, and association liaison ticketing.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    record.customerSupport?.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    Status: {record.customerSupport?.status || 'inProgress'}
                  </span>
                </div>
              </div>

              {/* Tickets List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                {tickets.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No support tickets registered.
                  </div>
                ) : (
                  tickets.map((t, idx) => (
                    <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{t.ticketNumber}</span>
                          <span className="text-xs font-semibold text-slate-700">• {t.subject}</span>
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700">
                            {t.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Client: {t.customerName} ({t.contactNumber})
                          {t.resolutionNotes && ` • Notes: ${t.resolutionNotes}`}
                        </p>
                      </div>

                      <select
                        value={t.status}
                        onChange={(e) => handleUpdateTicketStatus(idx, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer self-start sm:self-auto ${
                          t.status === 'Resolved' || t.status === 'Closed'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'bg-amber-50 border-amber-300 text-amber-700'
                        }`}
                      >
                        <option value="Open">Open</option>
                        <option value="InProgress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  ))
                )}
              </div>

              {/* Add Ticket */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Raise Support Ticket</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newTicket.customerName}
                    onChange={(e) => setNewTicket({ ...newTicket, customerName: e.target.value })}
                    placeholder="Customer Name..."
                    className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                  <input
                    type="text"
                    value={newTicket.contactNumber}
                    onChange={(e) => setNewTicket({ ...newTicket, contactNumber: e.target.value })}
                    placeholder="Contact Number..."
                    className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 cursor-pointer"
                  >
                    <option value="Facility Maintenance">Facility Maintenance</option>
                    <option value="Billing & Invoicing">Billing & Invoicing</option>
                    <option value="Documentation & Certificates">Documentation & Certificates</option>
                    <option value="Amenities & Club Access">Amenities & Club Access</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    placeholder="Ticket subject / issue summary..."
                    className="sm:col-span-2 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTicket}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Ticket</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Support Desk Performance Remarks
                </label>
                <textarea
                  rows={2}
                  value={ticketsRemarks}
                  onChange={(e) => setTicketsRemarks(e.target.value)}
                  placeholder="Record customer support turn-around SLA observations..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveSection('customerSupport')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Tickets</span>
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleCompleteSection('customerSupport')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Complete Support Verification</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: FEEDBACK & NPS */}
          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Homeowner Satisfaction & Net Promoter Score (NPS)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Post-handover survey evaluation, quality feedback, and brand advocacy metrics.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    record.feedback?.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    Status: {record.feedback?.status || 'inProgress'}
                  </span>
                </div>
              </div>

              {/* Top Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Average Rating</span>
                    <div className="text-2xl font-black text-amber-700 mt-1">
                      {record.feedback?.averageRating || 5.0} / 5.0
                    </div>
                  </div>
                  <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
                </div>

                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">NPS Benchmark</span>
                    <div className="text-2xl font-black text-emerald-700 mt-1">
                      +{record.feedback?.npsScore || 90}
                    </div>
                  </div>
                  <ThumbsUp className="w-8 h-8 text-emerald-500" />
                </div>

                <div className="bg-pink-50/50 border border-pink-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-pink-800 uppercase tracking-wider">Total Feedback</span>
                    <div className="text-2xl font-black text-pink-700 mt-1">
                      {reviews.length} Reviews
                    </div>
                  </div>
                  <MessageSquareHeart className="w-8 h-8 text-pink-500" />
                </div>
              </div>

              {/* Reviews List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                {reviews.map((rev, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{rev.customerName}</span>
                        <span className="text-xs text-slate-500">({rev.unitNumber || 'Unit General'})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.overallRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 mt-1.5 italic">"{rev.comments}"</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Submitted on {new Date(rev.submittedAt).toLocaleDateString()} • NPS Score: {rev.npsScore}/10
                    </p>
                  </div>
                ))}
              </div>

              {/* Add Review */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Capture Resident Feedback</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newReview.customerName}
                    onChange={(e) => setNewReview({ ...newReview, customerName: e.target.value })}
                    placeholder="Customer Name..."
                    className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                  <input
                    type="text"
                    value={newReview.unitNumber}
                    onChange={(e) => setNewReview({ ...newReview, unitNumber: e.target.value })}
                    placeholder="Unit / Flat..."
                    className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Rating:</span>
                    <select
                      value={newReview.overallRating}
                      onChange={(e) => setNewReview({ ...newReview, overallRating: parseInt(e.target.value, 10) })}
                      className="text-xs px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 cursor-pointer"
                    >
                      <option value="5">5 Stars (Excellent)</option>
                      <option value="4">4 Stars (Good)</option>
                      <option value="3">3 Stars (Average)</option>
                      <option value="2">2 Stars (Poor)</option>
                      <option value="1">1 Star (Critical)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newReview.comments}
                    onChange={(e) => setNewReview({ ...newReview, comments: e.target.value })}
                    placeholder="Customer testimonial / comments..."
                    className="sm:col-span-2 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddReview}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Submit Review</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Experience Remarks
                </label>
                <textarea
                  rows={2}
                  value={feedbackRemarks}
                  onChange={(e) => setFeedbackRemarks(e.target.value)}
                  placeholder="Record customer experience notes, sentiment analysis..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveSection('feedback')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Feedback</span>
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleCompleteSection('feedback')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Complete Feedback Audit</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Governance Bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              DLP Governance Gate:
            </span>
            {record.isApproved ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                DLP Successfully Matured (13-Stage Project Lifecycle 100% Completed)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Clock className="w-3.5 h-3.5" />
                Status: {record.status}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!record.isApproved && record.status !== 'auditPending' && (
              <button
                type="button"
                disabled={saving}
                onClick={handleRequestApproval}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-900 cursor-pointer shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for DLP Maturity Sign-off</span>
              </button>
            )}

            {!record.isApproved && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="Decision note..."
                  className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg w-40"
                />
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleDecideApproval('approved')}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve & Complete Lifecycle</span>
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleDecideApproval('rejected')}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  , document.body);
}