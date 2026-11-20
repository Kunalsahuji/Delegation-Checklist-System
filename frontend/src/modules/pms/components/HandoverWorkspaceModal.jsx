import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  ShieldCheck,
  Sparkles,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Send,
  Building,
  Save,
  Check,
  Star,
  Gauge,
  FileText,
  UserCheck,
} from 'lucide-react';
import { pmsHandoverApi } from '../../../api/pmsHandoverApi';

const SECTIONS = [
  { key: 'finalInspection', title: '1. Final Inspection', icon: ClipboardCheck },
  { key: 'snagClosure', title: '2. Snag List Closure', icon: ShieldCheck },
  { key: 'deepCleaning', title: '3. Deep Cleaning', icon: Sparkles },
  { key: 'customerHandover', title: '4. Customer Handover & Keys', icon: KeyRound },
];

export default function HandoverWorkspaceModal({ recordId, onClose, onRefresh }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('finalInspection');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Final Inspection
  const [inspectionData, setInspectionData] = useState({
    inspectorName: 'Er. Sandeep Rathore',
    inspectionDate: new Date().toISOString().slice(0, 10),
    structuralIntegrityApproved: false,
    mepServicesCertified: false,
    finishingApproved: false,
    remarks: '',
  });

  // 2. Snag Closure
  const [snagData, setSnagData] = useState({
    totalSnagsIdentified: 0,
    snagsRectified: 0,
    zeroSnagCertificateIssued: false,
    deSnaggingEngineer: 'Er. Rajesh Kumar',
    remarks: '',
  });

  // 3. Deep Cleaning
  const [cleaningData, setCleaningData] = useState({
    deepCleaningContractor: 'Sparkle Facilities & Services',
    signOffDate: '',
    remarks: '',
  });
  const [cleaningAreas, setCleaningAreas] = useState([]);
  const [newAreaName, setNewAreaName] = useState('');

  // 4. Customer Handover
  const [handoverData, setHandoverData] = useState({
    customerName: '',
    unitNumber: '',
    possessionLetterIssued: false,
    keysHandedOver: false,
    welcomeKitHanded: false,
    handoverDate: '',
    satisfactionRating: 5,
    electricityMeter: '00124.5 kWh',
    waterMeter: '00045.0 L',
    remarks: '',
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
      const res = await pmsHandoverApi.getRecordById(id);
      const data = res.data;
      setRecord(data);

      if (data.finalInspection) {
        setInspectionData({
          inspectorName: data.finalInspection.inspectorName || 'Er. Sandeep Rathore',
          inspectionDate: data.finalInspection.inspectionDate
            ? new Date(data.finalInspection.inspectionDate).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          structuralIntegrityApproved: Boolean(data.finalInspection.structuralIntegrityApproved),
          mepServicesCertified: Boolean(data.finalInspection.mepServicesCertified),
          finishingApproved: Boolean(data.finalInspection.finishingApproved),
          remarks: data.finalInspection.remarks || '',
        });
      }

      if (data.snagClosure) {
        setSnagData({
          totalSnagsIdentified: data.snagClosure.totalSnagsIdentified || 0,
          snagsRectified: data.snagClosure.snagsRectified || 0,
          zeroSnagCertificateIssued: Boolean(data.snagClosure.zeroSnagCertificateIssued),
          deSnaggingEngineer: data.snagClosure.deSnaggingEngineer || 'Er. Rajesh Kumar',
          remarks: data.snagClosure.remarks || '',
        });
      }

      if (data.deepCleaning) {
        setCleaningData({
          deepCleaningContractor: data.deepCleaning.deepCleaningContractor || 'Sparkle Facilities & Services',
          signOffDate: data.deepCleaning.signOffDate
            ? new Date(data.deepCleaning.signOffDate).toISOString().slice(0, 10)
            : '',
          remarks: data.deepCleaning.remarks || '',
        });
        setCleaningAreas(data.deepCleaning.areasCleaned || []);
      }

      if (data.customerHandover) {
        setHandoverData({
          customerName: data.customerHandover.customerName || '',
          unitNumber: data.customerHandover.unitNumber || '',
          possessionLetterIssued: Boolean(data.customerHandover.possessionLetterIssued),
          keysHandedOver: Boolean(data.customerHandover.keysHandedOver),
          welcomeKitHanded: Boolean(data.customerHandover.welcomeKitHanded),
          handoverDate: data.customerHandover.handoverDate
            ? new Date(data.customerHandover.handoverDate).toISOString().slice(0, 10)
            : '',
          satisfactionRating: data.customerHandover.satisfactionRating || 5,
          electricityMeter: data.customerHandover.meterReadings?.electricity || '00124.5 kWh',
          waterMeter: data.customerHandover.meterReadings?.water || '00045.0 L',
          remarks: data.customerHandover.remarks || '',
        });
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
      if (sectionKey === 'finalInspection') {
        payload = inspectionData;
      } else if (sectionKey === 'snagClosure') {
        payload = snagData;
      } else if (sectionKey === 'deepCleaning') {
        payload = {
          ...cleaningData,
          areasCleaned: cleaningAreas,
        };
      } else if (sectionKey === 'customerHandover') {
        payload = {
          customerName: handoverData.customerName,
          unitNumber: handoverData.unitNumber,
          possessionLetterIssued: handoverData.possessionLetterIssued,
          keysHandedOver: handoverData.keysHandedOver,
          welcomeKitHanded: handoverData.welcomeKitHanded,
          handoverDate: handoverData.handoverDate || null,
          satisfactionRating: handoverData.satisfactionRating,
          meterReadings: {
            electricity: handoverData.electricityMeter,
            water: handoverData.waterMeter,
          },
          remarks: handoverData.remarks,
        };
      }

      const res = await pmsHandoverApi.updateSection(record._id, sectionKey, payload);
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
      const res = await pmsHandoverApi.completeSection(record._id, sectionKey, 'Completed & verified');
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
      const res = await pmsHandoverApi.requestApproval(record._id);
      setRecord(res.data);
      setSuccessMsg('Submitted for Stage 12 Handover Approval!');
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
      const res = await pmsHandoverApi.decideApproval(record._id, {
        decision,
        reason: approvalNote || `Handover ${decision}`,
      });
      setRecord(res.data);
      setSuccessMsg(`Stage 12 Handover ${decision === 'approved' ? 'Approved & Possession Certified!' : 'Rejected'}`);
      setApprovalNote('');
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed decision gate');
    } finally {
      setSaving(false);
    }
  };

  const handleAddArea = () => {
    if (!newAreaName.trim()) return;
    setCleaningAreas((prev) => [
      ...prev,
      {
        area: newAreaName.trim(),
        status: 'pending',
        cleanedAt: null,
        inspectedBy: 'Deep Cleaning Supervisor',
      },
    ]);
    setNewAreaName('');
  };

  const handleUpdateAreaStatus = (idx, status) => {
    setCleaningAreas((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        status,
        cleanedAt: status === 'completed' ? new Date() : null,
      };
      return copy;
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading Stage 12 Handover Workspace...</p>
        </div>
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600/30 flex items-center justify-center text-teal-400 border border-teal-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Stage 12: Handover & Possession Workspace
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {record.code}
                </span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                  record.status === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : record.status === 'possessionCompleted'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
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
                <span>Locality: {record.project?.locality || 'Primary Site'}</span>
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
                    ? 'bg-white text-teal-700 border-teal-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
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
          {/* TAB 1: FINAL INSPECTION */}
          {activeTab === 'finalInspection' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Final Architectural & MEP Inspection</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pre-handover structural stability, safety fixtures, and plumbing/electrical sign-off.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    record.finalInspection?.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    Status: {record.finalInspection?.status || 'inProgress'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Certified Lead Inspector
                  </label>
                  <input
                    type="text"
                    value={inspectionData.inspectorName}
                    onChange={(e) => setInspectionData({ ...inspectionData, inspectorName: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Inspection Date
                  </label>
                  <input
                    type="date"
                    value={inspectionData.inspectionDate}
                    onChange={(e) => setInspectionData({ ...inspectionData, inspectionDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Three Pillars of Clearance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className={`p-4 rounded-xl border transition-all ${
                  inspectionData.structuralIntegrityApproved
                    ? 'bg-emerald-50/50 border-emerald-300'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Structural Safety</span>
                    <input
                      type="checkbox"
                      checked={inspectionData.structuralIntegrityApproved}
                      onChange={(e) =>
                        setInspectionData({
                          ...inspectionData,
                          structuralIntegrityApproved: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    RCC columns, slabs, parapet heights, and load-bearing walls inspected & crack-free.
                  </p>
                </div>

                <div className={`p-4 rounded-xl border transition-all ${
                  inspectionData.mepServicesCertified
                    ? 'bg-emerald-50/50 border-emerald-300'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">MEP & Plumbing</span>
                    <input
                      type="checkbox"
                      checked={inspectionData.mepServicesCertified}
                      onChange={(e) =>
                        setInspectionData({
                          ...inspectionData,
                          mepServicesCertified: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Water pressure tested, drainage leak-proof, circuit breakers & earth pits certified.
                  </p>
                </div>

                <div className={`p-4 rounded-xl border transition-all ${
                  inspectionData.finishingApproved
                    ? 'bg-emerald-50/50 border-emerald-300'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Architectural Finishing</span>
                    <input
                      type="checkbox"
                      checked={inspectionData.finishingApproved}
                      onChange={(e) =>
                        setInspectionData({
                          ...inspectionData,
                          finishingApproved: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Flooring tiles level, paint sheen uniform, doors & windows sliding smoothly.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Inspector Audit Notes & Observations
                </label>
                <textarea
                  rows={3}
                  value={inspectionData.remarks}
                  onChange={(e) => setInspectionData({ ...inspectionData, remarks: e.target.value })}
                  placeholder="Record final pre-possession inspection notes, certifications, and compliance..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveSection('finalInspection')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Inspection Draft</span>
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleCompleteSection('finalInspection')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Complete Final Inspection</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SNAG LIST CLOSURE */}
          {activeTab === 'snagClosure' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Snag List Closure & De-Snagging</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rectification of all quality snags and issuance of the official Zero-Snag Certificate.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    record.snagClosure?.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    Status: {record.snagClosure?.status || 'inProgress'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Snags Identified
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={snagData.totalSnagsIdentified}
                    onChange={(e) =>
                      setSnagData({
                        ...snagData,
                        totalSnagsIdentified: Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    className="w-full text-base font-bold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                  <label className="block text-xs font-bold text-emerald-800 mb-1">
                    Snags Rectified & Verified
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={snagData.snagsRectified}
                    onChange={(e) =>
                      setSnagData({
                        ...snagData,
                        snagsRectified: Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    className="w-full text-base font-bold text-emerald-700 px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4">
                  <label className="block text-xs font-bold text-amber-800 mb-1">
                    Pending Snag Backlog
                  </label>
                  <div className="text-2xl font-black text-amber-700 px-3 py-2">
                    {Math.max(0, snagData.totalSnagsIdentified - snagData.snagsRectified)}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Zero-Snag Certificate</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Certifies that zero open punch-list items remain before customer key handover.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700">Issued & Sealed</label>
                  <input
                    type="checkbox"
                    checked={snagData.zeroSnagCertificateIssued}
                    onChange={(e) =>
                      setSnagData({
                        ...snagData,
                        zeroSnagCertificateIssued: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    De-Snagging Supervisor / Engineer
                  </label>
                  <input
                    type="text"
                    value={snagData.deSnaggingEngineer}
                    onChange={(e) => setSnagData({ ...snagData, deSnaggingEngineer: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Closure Remarks & Warranty Scope
                  </label>
                  <input
                    type="text"
                    value={snagData.remarks}
                    onChange={(e) => setSnagData({ ...snagData, remarks: e.target.value })}
                    placeholder="e.g. Minor paint touch-ups completed; clear for handover"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveSection('snagClosure')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Snag Status</span>
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleCompleteSection('snagClosure')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Issue Zero-Snag Sign-Off</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: DEEP CLEANING */}
          {activeTab === 'deepCleaning' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Deep Cleaning & Detailing Register</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Area-by-area cleaning verification including floor scrub, glass polishing, and acid wash.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    record.deepCleaning?.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    Status: {record.deepCleaning?.status || 'inProgress'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Specialized Cleaning Contractor
                  </label>
                  <input
                    type="text"
                    value={cleaningData.deepCleaningContractor}
                    onChange={(e) => setCleaningData({ ...cleaningData, deepCleaningContractor: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cleaning Sign-Off Date
                  </label>
                  <input
                    type="date"
                    value={cleaningData.signOffDate}
                    onChange={(e) => setCleaningData({ ...cleaningData, signOffDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Cleaning Areas Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Area Cleaning Breakdown ({cleaningAreas.filter((a) => a.status === 'completed').length} / {cleaningAreas.length} Completed)
                  </h4>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                  {cleaningAreas.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Sparkles className={`w-4 h-4 ${item.status === 'completed' ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{item.area}</p>
                          <p className="text-[10px] text-slate-400">
                            Inspected by {item.inspectedBy || 'Supervisor'}
                            {item.cleanedAt && ` • ${new Date(item.cleanedAt).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateAreaStatus(idx, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer ${
                          item.status === 'completed'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : item.status === 'inProgress'
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-slate-50 border-slate-300 text-slate-600'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="inProgress">In Progress</option>
                        <option value="completed">Completed & Verified</option>
                      </select>
                    </div>
                  ))}
                </div>

                {/* Add Area */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    placeholder="Add custom room or common area..."
                    className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddArea}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Area</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cleaning Quality Remarks
                </label>
                <textarea
                  rows={2}
                  value={cleaningData.remarks}
                  onChange={(e) => setCleaningData({ ...cleaningData, remarks: e.target.value })}
                  placeholder="Record cleaning certification notes..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveSection('deepCleaning')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Cleaning Progress</span>
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleCompleteSection('deepCleaning')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Complete Deep Cleaning</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMER HANDOVER & POSSESSION */}
          {activeTab === 'customerHandover' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Customer Key Handover & Possession Clearance</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official key dispatch, possession letter sign-off, and utility meter benchmark capture.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    record.customerHandover?.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    Status: {record.customerHandover?.status || 'inProgress'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer / Allottee Name
                  </label>
                  <input
                    type="text"
                    value={handoverData.customerName}
                    onChange={(e) => setHandoverData({ ...handoverData, customerName: e.target.value })}
                    placeholder="e.g. Mr. Rajesh Sharma & Family"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unit / Villa / Apartment Number
                  </label>
                  <input
                    type="text"
                    value={handoverData.unitNumber}
                    onChange={(e) => setHandoverData({ ...handoverData, unitNumber: e.target.value })}
                    placeholder="e.g. Flat 402, Block A / Villa 12"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Handover Milestones Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl border transition-all ${
                  handoverData.possessionLetterIssued
                    ? 'bg-emerald-50/50 border-emerald-300'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Possession Letter</span>
                    <input
                      type="checkbox"
                      checked={handoverData.possessionLetterIssued}
                      onChange={(e) =>
                        setHandoverData({
                          ...handoverData,
                          possessionLetterIssued: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Official legal possession document signed by developer & buyer.
                  </p>
                </div>

                <div className={`p-4 rounded-xl border transition-all ${
                  handoverData.keysHandedOver
                    ? 'bg-emerald-50/50 border-emerald-300'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Keys Handed Over</span>
                    <input
                      type="checkbox"
                      checked={handoverData.keysHandedOver}
                      onChange={(e) =>
                        setHandoverData({
                          ...handoverData,
                          keysHandedOver: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Master key set, mailbox keys, and access cards handed to client.
                  </p>
                </div>

                <div className={`p-4 rounded-xl border transition-all ${
                  handoverData.welcomeKitHanded
                    ? 'bg-emerald-50/50 border-emerald-300'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Welcome Kit & Manual</span>
                    <input
                      type="checkbox"
                      checked={handoverData.welcomeKitHanded}
                      onChange={(e) =>
                        setHandoverData({
                          ...handoverData,
                          welcomeKitHanded: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Maintenance manuals, warranty cards, and resident directory.
                  </p>
                </div>
              </div>

              {/* Utility Meter Readings & Satisfaction */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Electricity Meter Reading
                  </label>
                  <input
                    type="text"
                    value={handoverData.electricityMeter}
                    onChange={(e) => setHandoverData({ ...handoverData, electricityMeter: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Water Meter Reading
                  </label>
                  <input
                    type="text"
                    value={handoverData.waterMeter}
                    onChange={(e) => setHandoverData({ ...handoverData, waterMeter: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer Satisfaction Rating
                  </label>
                  <div className="flex items-center gap-1.5 pt-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setHandoverData({ ...handoverData, satisfactionRating: star })}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= handoverData.satisfactionRating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">
                      {handoverData.satisfactionRating} / 5 Stars
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Feedback & Handover Remarks
                </label>
                <textarea
                  rows={2}
                  value={handoverData.remarks}
                  onChange={(e) => setHandoverData({ ...handoverData, remarks: e.target.value })}
                  placeholder="Record customer experience comments, possession ceremony notes..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveSection('customerHandover')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Handover Progress</span>
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleCompleteSection('customerHandover')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Execute Customer Possession</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Approval Bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Governance Gate:
            </span>
            {record.isApproved ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Stage 12 Certified & Approved (Unlocked Stage 13 After-Sales)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Clock className="w-3.5 h-3.5" />
                Approval Status: {record.status}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!record.isApproved && record.status !== 'approvalPending' && (
              <button
                type="button"
                disabled={saving}
                onClick={handleRequestApproval}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-900 cursor-pointer shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Final Approval</span>
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
                  <span>Approve & Advance</span>
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
  );
}
