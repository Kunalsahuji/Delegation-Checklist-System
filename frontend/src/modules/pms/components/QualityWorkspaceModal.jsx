import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import {
  X,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  ShieldCheck,
  Clock,
  AlertCircle,
  Plus,
  Send,
  Building,
  Save,
  Check,
  Camera,
  Layers,
  FileCheck2,
  BadgeCheck,
} from 'lucide-react';
import { pmsQualityApi } from '../../../api/pmsQualityApi';

const SECTIONS = [
  { key: 'stageInspection', title: '1. Stage Inspections', icon: ClipboardCheck },
  { key: 'engineerApproval', title: '2. Engineer Quality Gate', icon: FileCheck2 },
  { key: 'snagList', title: '3. Snag List Register', icon: AlertTriangle },
  { key: 'rectification', title: '4. Rectification & Closure', icon: Wrench },
];

export default function QualityWorkspaceModal({ recordId, onClose, onRefresh }) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stageInspection');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Stage Inspections State
  const [inspections, setInspections] = useState([]);
  const [newInspection, setNewInspection] = useState({
    stage: 'RCC Superstructure & Slab Casting',
    locationOrElement: '',
    inspector: 'Er. Sandeep Rathore',
    standardCode: 'IS 456:2000',
    tolerancePermitted: '±3mm',
    toleranceMeasured: '+1.5mm',
    result: 'Pass',
    notes: '',
    photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=800&q=80',
  });

  // 2. Engineer Approval State
  const [verifications, setVerifications] = useState([]);
  const [leadEngineer, setLeadEngineer] = useState('Er. Sandeep Rathore');
  const [signOffVerdict, setSignOffVerdict] = useState('Approved');
  const [newVerification, setNewVerification] = useState({
    criteria: '',
    verified: true,
    engineerRemarks: '',
  });

  // 3. Snag List State
  const [snags, setSnags] = useState([]);
  const [newSnag, setNewSnag] = useState({
    snagCode: '',
    category: 'Civil & Structural',
    description: '',
    location: '',
    severity: 'Medium',
    assignedContractor: 'Apex Civil Infra & RCC Contractors',
    targetDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // 4. Rectification State
  const [closures, setClosures] = useState([]);
  const [newClosure, setNewClosure] = useState({
    snagCode: '',
    rectificationDate: new Date().toISOString().split('T')[0],
    contractorNotes: '',
    photoAfter: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    verifiedBy: 'Er. Sandeep Rathore',
    closureNotes: 'Rectification verified to satisfaction. Approved for closure.',
  });

  // Approval form note
  const [approvalNote, setApprovalNote] = useState('');

  useEffect(() => {
    if (recordId) loadRecord();
  }, [recordId]);

  const loadRecord = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await pmsQualityApi.getRecordById(recordId);
      const data = res?.data || res;
      setRecord(data);
      if (data?.stageInspection?.inspections) setInspections(data.stageInspection.inspections);
      if (data?.engineerApproval?.checklistVerifications) {
        setVerifications(data.engineerApproval.checklistVerifications);
      }
      if (data?.engineerApproval?.leadEngineerName) setLeadEngineer(data.engineerApproval.leadEngineerName);
      if (data?.engineerApproval?.signOffVerdict) setSignOffVerdict(data.engineerApproval.signOffVerdict);
      if (data?.snagList?.snags) setSnags(data.snagList.snags);
      if (data?.rectification?.closures) setClosures(data.rectification.closures);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load record');
    } finally {
      setLoading(false);
    }
  };

  // Add Inspection
  const handleAddInspection = async (e) => {
    e.preventDefault();
    if (!newInspection.locationOrElement.trim()) {
      setErrorMsg('Location or structural element is required');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const updatedList = [
        ...inspections,
        {
          ...newInspection,
          inspectionDate: new Date(),
        },
      ];
      const res = await pmsQualityApi.updateSection(record._id, 'stageInspection', {
        inspections: updatedList,
      });
      const data = res?.data || res;
      setRecord(data);
      setInspections(data?.stageInspection?.inspections || updatedList);
      setNewInspection({
        stage: 'RCC Superstructure & Slab Casting',
        locationOrElement: '',
        inspector: 'Er. Sandeep Rathore',
        standardCode: 'IS 456:2000',
        tolerancePermitted: '±3mm',
        toleranceMeasured: '+1.5mm',
        result: 'Pass',
        notes: '',
        photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=800&q=80',
      });
      setSuccessMsg('Stage quality inspection recorded successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save inspection');
    } finally {
      setSaving(false);
    }
  };

  // Add Verification Check
  const handleAddVerification = async (e) => {
    e.preventDefault();
    if (!newVerification.criteria.trim()) {
      setErrorMsg('Verification criteria is required');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const updatedList = [
        ...verifications,
        {
          ...newVerification,
          verifiedDate: new Date(),
        },
      ];
      const res = await pmsQualityApi.updateSection(record._id, 'engineerApproval', {
        checklistVerifications: updatedList,
        leadEngineerName: leadEngineer,
        signOffVerdict,
      });
      const data = res?.data || res;
      setRecord(data);
      setVerifications(data?.engineerApproval?.checklistVerifications || updatedList);
      setNewVerification({
        criteria: '',
        verified: true,
        engineerRemarks: '',
      });
      setSuccessMsg('Engineer quality check logged');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to add check');
    } finally {
      setSaving(false);
    }
  };

  // Add Snag Item
  const handleAddSnag = async (e) => {
    e.preventDefault();
    if (!newSnag.snagCode.trim() || !newSnag.description.trim() || !newSnag.location.trim()) {
      setErrorMsg('Snag Code, Description, and Location are required');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const updatedList = [
        ...snags,
        {
          ...newSnag,
          snagCode: newSnag.snagCode.trim(),
          status: 'identified',
          dateIdentified: new Date(),
        },
      ];
      const res = await pmsQualityApi.updateSection(record._id, 'snagList', {
        snags: updatedList,
      });
      const data = res?.data || res;
      setRecord(data);
      setSnags(data?.snagList?.snags || updatedList);
      setNewSnag({
        snagCode: '',
        category: 'Civil & Structural',
        description: '',
        location: '',
        severity: 'Medium',
        assignedContractor: 'Apex Civil Infra & RCC Contractors',
        targetDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      setSuccessMsg('Snag item logged in register');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to add snag');
    } finally {
      setSaving(false);
    }
  };

  // Add Rectification Closure
  const handleAddClosure = async (e) => {
    e.preventDefault();
    if (!newClosure.snagCode.trim() || !newClosure.contractorNotes.trim()) {
      setErrorMsg('Snag Code and Contractor Rectification Notes are required');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const updatedClosures = [
        ...closures,
        {
          ...newClosure,
          rectificationDate: new Date(newClosure.rectificationDate),
          isApprovedClosure: true,
        },
      ];
      const res = await pmsQualityApi.updateSection(record._id, 'rectification', {
        closures: updatedClosures,
      });
      const data = res?.data || res;
      setRecord(data);
      setClosures(data?.rectification?.closures || updatedClosures);
      if (data?.snagList?.snags) setSnags(data.snagList.snags);
      setNewClosure({
        snagCode: '',
        rectificationDate: new Date().toISOString().split('T')[0],
        contractorNotes: '',
        photoAfter: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
        verifiedBy: 'Er. Sandeep Rathore',
        closureNotes: 'Rectification verified to satisfaction. Approved for closure.',
      });
      setSuccessMsg('Snag rectified and closed successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to close snag');
    } finally {
      setSaving(false);
    }
  };

  // Complete Section
  const handleCompleteSection = async (sectionKey) => {
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await pmsQualityApi.completeSection(record._id, sectionKey, 'Certified by Quality Assurance Lead');
      const data = res?.data || res;
      setRecord(data);
      setSuccessMsg(`${sectionKey} marked as completed!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to complete section');
    } finally {
      setSaving(false);
    }
  };

  // Request Approval
  const handleRequestApproval = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await pmsQualityApi.requestApproval(record._id);
      const data = res?.data || res;
      setRecord(data);
      setSuccessMsg('Submitted for Stage 9 Quality Certification Review');
      setTimeout(() => setSuccessMsg(''), 3000);
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit review');
    } finally {
      setSaving(false);
    }
  };

  // Decision Gate (Approve/Reject)
  const handleDecision = async (decision) => {
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await pmsQualityApi.decideApproval(record._id, {
        decision,
        reason: approvalNote || (decision === 'approved' ? 'Stage 9 Quality & Snags certified to specification' : 'Revisions requested'),
      });
      const data = res?.data || res;
      setRecord(data);
      setSuccessMsg(`Stage 9 Quality ${decision.toUpperCase()} successfully!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to apply decision');
    } finally {
      setSaving(false);
    }
  };

  if (!recordId) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] max-h-[95vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Stage 09 • Quality Control, Audits & Snags
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {record.code}
                </span>
                <span className="text-xs font-semibold text-teal-600">
                  • {record.status?.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Project: <span className="font-medium text-slate-700">{record.project?.name || "Project"}</span> ({record.project?.code}) • Stage Order: {record.stageOrder || 6}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="mx-6 mt-3 px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              {errorMsg}
            </span>
            <button onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-3 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-700 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {successMsg}
            </span>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Workspace Quick Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <p className="text-slate-500 font-medium">Stage Audits</p>
            <p className="text-base font-bold text-slate-800 mt-0.5">{inspections.length} Tests</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <p className="text-slate-500 font-medium">Test Pass Rate</p>
            <p className="text-base font-bold text-emerald-700 mt-0.5">{record?.inspectionPassRate || 100}%</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <p className="text-slate-500 font-medium">Total Snags Logged</p>
            <p className="text-base font-bold text-slate-800 mt-0.5">{snags.length} Items</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <p className="text-slate-500 font-medium">Open Snags</p>
            <p className="text-base font-bold text-rose-700 mt-0.5">{record?.openSnags || 0} Pending</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <p className="text-slate-500 font-medium">Snag Closure Rate</p>
            <p className="text-base font-bold text-teal-700 mt-0.5">{record?.snagClosureRate || 100}%</p>
          </div>
        </div>

        {/* Workspace Submodule Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6 overflow-x-auto shrink-0 scrollbar-none">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeTab === sec.key;
            const isCompleted = record?.[sec.key]?.status === 'completed';
            return (
              <button
                key={sec.key}
                onClick={() => setActiveTab(sec.key)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>{sec.title}</span>
                {isCompleted && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/60">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Clock className="w-8 h-8 animate-spin text-teal-600 mb-2" />
              <p className="text-xs font-medium">Loading Quality Control Workspace...</p>
            </div>
          ) : (
            <div>
              {/* TAB 1: STAGE INSPECTIONS */}
              {activeTab === 'stageInspection' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Stage Quality Inspections</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Conduct structural, architectural, and MEP audits against Indian Standard codes.
                      </p>
                    </div>
                    {record?.status !== 'approved' && (
                      <button
                        onClick={() => handleCompleteSection('stageInspection')}
                        disabled={saving || inspections.length === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark Inspections Complete
                      </button>
                    )}
                  </div>

                  {/* Add Inspection Form */}
                  {record?.status !== 'approved' && (
                    <form
                      onSubmit={handleAddInspection}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
                    >
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Plus className="w-4 h-4 text-teal-600" /> Log Quality Inspection
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Inspection Stage</label>
                          <select
                            value={newInspection.stage}
                            onChange={(e) => setNewInspection({ ...newInspection, stage: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          >
                            <option value="Substructure & Excavation">Substructure & Excavation</option>
                            <option value="Plinth Beam & Anti-Termite">Plinth Beam & Anti-Termite</option>
                            <option value="RCC Superstructure & Slab Casting">RCC Superstructure & Slab</option>
                            <option value="Masonry & Brickwork">Masonry & Brickwork</option>
                            <option value="Internal & External Plastering">Plastering</option>
                            <option value="Waterproofing (Toilets & Terrace)">Waterproofing</option>
                            <option value="Flooring & Tiling Work">Flooring & Tiling</option>
                            <option value="Plumbing Pressure & Hydro Testing">Plumbing Pressure Test</option>
                            <option value="Electrical Megger & Wiring Verification">Electrical Megger Test</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Location / Element</label>
                          <input
                            type="text"
                            placeholder="e.g. Tower B 3rd Floor Slab"
                            value={newInspection.locationOrElement}
                            onChange={(e) => setNewInspection({ ...newInspection, locationOrElement: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Tolerances (Permitted / Measured)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="±3mm"
                              value={newInspection.tolerancePermitted}
                              onChange={(e) => setNewInspection({ ...newInspection, tolerancePermitted: e.target.value })}
                              className="w-1/2 mt-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                            <input
                              type="text"
                              placeholder="+1mm"
                              value={newInspection.toleranceMeasured}
                              onChange={(e) => setNewInspection({ ...newInspection, toleranceMeasured: e.target.value })}
                              className="w-1/2 mt-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Result Verdict</label>
                          <select
                            value={newInspection.result}
                            onChange={(e) => setNewInspection({ ...newInspection, result: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          >
                            <option value="Pass">Pass</option>
                            <option value="Conditional Pass">Conditional Pass</option>
                            <option value="Fail">Fail</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Standard Code & Inspector</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newInspection.standardCode}
                              onChange={(e) => setNewInspection({ ...newInspection, standardCode: e.target.value })}
                              className="w-1/2 mt-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                              placeholder="IS 456:2000"
                            />
                            <input
                              type="text"
                              value={newInspection.inspector}
                              onChange={(e) => setNewInspection({ ...newInspection, inspector: e.target.value })}
                              className="w-1/2 mt-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                              placeholder="Inspector"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Audit Notes & Test Observations</label>
                          <input
                            type="text"
                            placeholder="Observations, slump mm, cube strength, etc."
                            value={newInspection.notes}
                            onChange={(e) => setNewInspection({ ...newInspection, notes: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Add Inspection'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Inspections Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <th className="py-2.5 px-4">Stage & IS Code</th>
                          <th className="py-2.5 px-4">Location / Structural Element</th>
                          <th className="py-2.5 px-4 text-center">Permitted vs Measured</th>
                          <th className="py-2.5 px-4 text-center">Result</th>
                          <th className="py-2.5 px-4">Inspector & Date</th>
                          <th className="py-2.5 px-4">Observations</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {inspections.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition">
                            <td className="py-2.5 px-4">
                              <span className="font-bold text-slate-800 block">{item.stage}</span>
                              <span className="text-[11px] text-slate-500 font-mono">{item.standardCode}</span>
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-slate-700">{item.locationOrElement}</td>
                            <td className="py-2.5 px-4 text-center text-slate-600 font-mono text-[11px]">
                              {item.tolerancePermitted} / <span className="font-bold text-slate-800">{item.toleranceMeasured}</span>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.result === 'Pass'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : item.result === 'Conditional Pass'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {item.result}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">
                              <span className="block font-semibold text-slate-700">{item.inspector}</span>
                              <span className="text-[10px] text-slate-400">{new Date(item.inspectionDate).toLocaleDateString()}</span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 max-w-xs">{item.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: ENGINEER QUALITY GATE */}
              {activeTab === 'engineerApproval' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Engineer Quality Gate & Certification</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Mandatory compliance checklist, lab cube tests, rebar mill tests, and chief engineer sign-off.
                      </p>
                    </div>
                    {record?.status !== 'approved' && (
                      <button
                        onClick={() => handleCompleteSection('engineerApproval')}
                        disabled={saving || verifications.length === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark Gate Complete
                      </button>
                    )}
                  </div>

                  {/* Add Verification Form */}
                  {record?.status !== 'approved' && (
                    <form
                      onSubmit={handleAddVerification}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
                    >
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Plus className="w-4 h-4 text-teal-600" /> Add Mandatory Quality Check
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                          <label className="text-[11px] font-semibold text-slate-600">Quality Check Criteria</label>
                          <input
                            type="text"
                            placeholder="e.g. Concrete 28-day cube strength >= M25 certified"
                            value={newVerification.criteria}
                            onChange={(e) => setNewVerification({ ...newVerification, criteria: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Verification Remarks</label>
                          <input
                            type="text"
                            placeholder="e.g. Lab report verified & passed"
                            value={newVerification.engineerRemarks}
                            onChange={(e) => setNewVerification({ ...newVerification, engineerRemarks: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Add Quality Check'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Verification List */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
                    {verifications.map((v, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{v.criteria}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{v.engineerRemarks}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Verified
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: SNAG LIST REGISTER */}
              {activeTab === 'snagList' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Snag List Register</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Log non-conformances, honeycombing, hairline cracks, and contractor defect punch lists.
                      </p>
                    </div>
                    {record?.status !== 'approved' && (
                      <button
                        onClick={() => handleCompleteSection('snagList')}
                        disabled={saving || snags.length === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark Snags Complete
                      </button>
                    )}
                  </div>

                  {/* Add Snag Form */}
                  {record?.status !== 'approved' && (
                    <form
                      onSubmit={handleAddSnag}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
                    >
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Plus className="w-4 h-4 text-teal-600" /> Punch New Snag Item
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Snag Code</label>
                          <input
                            type="text"
                            placeholder="e.g. SNG-004"
                            value={newSnag.snagCode}
                            onChange={(e) => setNewSnag({ ...newSnag, snagCode: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Category</label>
                          <select
                            value={newSnag.category}
                            onChange={(e) => setNewSnag({ ...newSnag, category: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          >
                            <option value="Civil & Structural">Civil & Structural</option>
                            <option value="Plumbing & Drainage">Plumbing & Drainage</option>
                            <option value="Electrical & Automation">Electrical & Automation</option>
                            <option value="Carpentry & Woodwork">Carpentry & Woodwork</option>
                            <option value="Tiling & Flooring">Tiling & Flooring</option>
                            <option value="Painting & Finishing">Painting & Finishing</option>
                            <option value="Glass & Aluminum">Glass & Aluminum</option>
                            <option value="Safety & Cleaning">Safety & Cleaning</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Location</label>
                          <input
                            type="text"
                            placeholder="e.g. Flat 204 Bathroom"
                            value={newSnag.location}
                            onChange={(e) => setNewSnag({ ...newSnag, location: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Severity</label>
                          <select
                            value={newSnag.severity}
                            onChange={(e) => setNewSnag({ ...newSnag, severity: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Defect Description</label>
                          <input
                            type="text"
                            placeholder="Detailed description of defect..."
                            value={newSnag.description}
                            onChange={(e) => setNewSnag({ ...newSnag, description: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Assigned Contractor</label>
                          <input
                            type="text"
                            value={newSnag.assignedContractor}
                            onChange={(e) => setNewSnag({ ...newSnag, assignedContractor: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Add Snag Item'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Snags Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <th className="py-2.5 px-4">Snag Code</th>
                          <th className="py-2.5 px-4">Category</th>
                          <th className="py-2.5 px-4">Location & Description</th>
                          <th className="py-2.5 px-4 text-center">Severity</th>
                          <th className="py-2.5 px-4">Contractor</th>
                          <th className="py-2.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {snags.map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition">
                            <td className="py-2.5 px-4 font-bold text-slate-800">{s.snagCode}</td>
                            <td className="py-2.5 px-4 text-slate-600">{s.category}</td>
                            <td className="py-2.5 px-4">
                              <span className="font-semibold text-slate-700 block">{s.location}</span>
                              <span className="text-[11px] text-slate-500">{s.description}</span>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  s.severity === 'Critical'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : s.severity === 'High'
                                    ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                    : s.severity === 'Medium'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {s.severity}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">{s.assignedContractor}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                  s.status === 'verifiedClosed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : s.status === 'rectified'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {s.status === 'verifiedClosed' ? 'Closed' : s.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: RECTIFICATION & CLOSURE */}
              {activeTab === 'rectification' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Rectification Proof & Closure Sign-off</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Verify contractor repairs with post-rectification proof and site engineer sign-off.
                      </p>
                    </div>
                    {record?.status !== 'approved' && (
                      <button
                        onClick={() => handleCompleteSection('rectification')}
                        disabled={saving || closures.length === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark Rectification Complete
                      </button>
                    )}
                  </div>

                  {/* Add Closure Form */}
                  {record?.status !== 'approved' && (
                    <form
                      onSubmit={handleAddClosure}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
                    >
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Plus className="w-4 h-4 text-teal-600" /> Sign-off Snag Closure
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Select Snag Code</label>
                          <select
                            value={newClosure.snagCode}
                            onChange={(e) => setNewClosure({ ...newClosure, snagCode: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            required
                          >
                            <option value="">-- Choose Snag --</option>
                            {snags.map((s, idx) => (
                              <option key={idx} value={s.snagCode}>
                                {s.snagCode} ({s.category} - {s.location})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Contractor Repair Notes</label>
                          <input
                            type="text"
                            placeholder="Repair method, epoxy grout applied, etc."
                            value={newClosure.contractorNotes}
                            onChange={(e) => setNewClosure({ ...newClosure, contractorNotes: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Verified By</label>
                          <input
                            type="text"
                            value={newClosure.verifiedBy}
                            onChange={(e) => setNewClosure({ ...newClosure, verifiedBy: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Certify Closure'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Closures List */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
                    {closures.map((c, idx) => (
                      <div key={idx} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/80 transition">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-800">{c.snagCode}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Rectified & Closed
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 mt-1 font-medium">{c.contractorNotes}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Inspector: <strong className="text-slate-700">{c.verifiedBy}</strong> • {c.closureNotes}
                          </p>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(c.rectificationDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Decision & Sign-off Bar */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">
              Stage 9 Status: <strong className="text-slate-800 uppercase">{record?.status}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {record?.status === 'inProgress' && (
              <button
                onClick={handleRequestApproval}
                disabled={saving || inspections.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                Submit for PM Review
              </button>
            )}

            {record?.status === 'approvalPending' && (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Quality certification remarks..."
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-64"
                />
                <button
                  onClick={() => handleDecision('approved')}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Approve Stage 9
                </button>
                <button
                  onClick={() => handleDecision('rejected')}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 shadow-sm transition disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  Reject
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  , document.body);
}