import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Users,
  HardHat,
  Package,
  Camera,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Send,
  Building,
  Save,
  Check,
  ShieldCheck,
  Activity,
  Layers,
  Thermometer,
  CloudSun,
  Flame,
  BadgeCheck,
} from 'lucide-react';
import { pmsConstructionApi } from '../../../api/pmsConstructionApi';

const SECTIONS = [
  { key: 'dailyProgress', title: '1. Daily Progress (DPR)', icon: Calendar },
  { key: 'labourTracking', title: '2. Labour & Deployment', icon: Users },
  { key: 'materialConsumption', title: '3. Material Consumption', icon: Package },
  { key: 'qualitySitePhotos', title: '4. Quality & Site Photos', icon: Camera },
];

function formatCurrency(val) {
  if (!val || isNaN(val)) return '₹0';
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

export default function ConstructionWorkspaceModal({ recordId, onClose, onRefresh }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dailyProgress');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. DPR State
  const [dprLogs, setDprLogs] = useState([]);
  const [newDpr, setNewDpr] = useState({
    dprNumber: '',
    date: new Date().toISOString().split('T')[0],
    shift: 'Day Shift',
    weather: 'Clear',
    temperature: '32°C',
    workHours: 8,
    siteEngineer: 'Er. Sandeep Rathore',
    plannedActivities: '',
    completedActivities: '',
    delaysOrBlockers: 'None',
    siteSafetyIncidents: 0,
  });

  // 2. Labour State
  const [labourEntries, setLabourEntries] = useState([]);
  const [newLabour, setNewLabour] = useState({
    contractorName: 'Apex Civil Infra & RCC Contractors',
    trade: 'Civil & Masonry',
    headCount: 8,
    hoursPerWorker: 8,
    dailyWageRate: 850,
    supervisor: 'Harish Chander',
    verified: true,
  });

  // 3. Material Consumption State
  const [consumptionEntries, setConsumptionEntries] = useState([]);
  const [newConsumption, setNewConsumption] = useState({
    materialName: 'OPC 53 Grade Cement',
    category: 'cement',
    unit: 'Bags',
    quantityConsumed: 50,
    unitRate: 380,
    locationOrElement: 'First Floor Slab Concreting',
    stockLedgerRef: 'STK-PRC-001',
    verifiedBy: 'Er. Sandeep Rathore',
  });

  // 4. Quality & Photos State
  const [inspections, setInspections] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [newInspection, setNewInspection] = useState({
    elementOrLocation: 'Column C1-C6 Formwork Alignment',
    stage: 'Plumb & Diagonal Check',
    checkedBy: 'Er. Sandeep Rathore',
    verdict: 'Passed',
    remedialAction: 'N/A - Plumb line deviation within 2mm allowable tolerance.',
    signOffEngineer: 'Er. Sandeep Rathore',
  });
  const [newPhoto, setNewPhoto] = useState({
    title: 'Reinforcement Cage & Spacer Blocks',
    category: 'RCC Structural Work',
    locationTag: 'Footing Grid B-3',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=800&q=80',
    capturedBy: 'Er. Sandeep Rathore',
    notes: 'Cover blocks installed at 1.0m c/c as per structural design.',
  });

  // Approval form
  const [approvalNote, setApprovalNote] = useState('');

  useEffect(() => {
    if (recordId) loadRecord();
  }, [recordId]);

  const loadRecord = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await pmsConstructionApi.getRecordById(recordId);
      const data = res?.data || res;
      setRecord(data);
      if (data?.dailyProgress?.dprLogs) setDprLogs(data.dailyProgress.dprLogs);
      if (data?.labourTracking?.labourEntries) setLabourEntries(data.labourTracking.labourEntries);
      if (data?.materialConsumption?.consumptionEntries) setConsumptionEntries(data.materialConsumption.consumptionEntries);
      if (data?.qualitySitePhotos?.qualityInspections) setInspections(data.qualitySitePhotos.qualityInspections);
      if (data?.qualitySitePhotos?.sitePhotos) setPhotos(data.qualitySitePhotos.sitePhotos);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load record');
    } finally {
      setLoading(false);
    }
  };

  // Add DPR Log
  const handleAddDpr = async (e) => {
    e.preventDefault();
    if (!newDpr.dprNumber.trim() || !newDpr.plannedActivities.trim() || !newDpr.completedActivities.trim()) {
      setErrorMsg('DPR Number, Planned Activities, and Completed Activities are required');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const updatedList = [
        ...dprLogs,
        {
          ...newDpr,
          dprNumber: newDpr.dprNumber.trim(),
          workHours: Number(newDpr.workHours || 8),
          siteSafetyIncidents: Number(newDpr.siteSafetyIncidents || 0),
          status: 'verified',
        },
      ];
      const res = await pmsConstructionApi.updateSection(record._id, 'dailyProgress', {
        dprLogs: updatedList,
      });
      const data = res?.data || res;
      setRecord(data);
      setDprLogs(data?.dailyProgress?.dprLogs || updatedList);
      setNewDpr({
        dprNumber: '',
        date: new Date().toISOString().split('T')[0],
        shift: 'Day Shift',
        weather: 'Clear',
        temperature: '32°C',
        workHours: 8,
        siteEngineer: 'Er. Sandeep Rathore',
        plannedActivities: '',
        completedActivities: '',
        delaysOrBlockers: 'None',
        siteSafetyIncidents: 0,
      });
      setSuccessMsg('Daily Progress Report (DPR) saved successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to add DPR');
    } finally {
      setSaving(false);
    }
  };

  // Add Labour Entry
  const handleAddLabour = async (e) => {
    e.preventDefault();
    if (!newLabour.contractorName.trim()) {
      setErrorMsg('Contractor name is required');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const headCount = Number(newLabour.headCount || 1);
      const hoursPerWorker = Number(newLabour.hoursPerWorker || 8);
      const dailyWageRate = Number(newLabour.dailyWageRate || 0);
      const updatedList = [
        ...labourEntries,
        {
          ...newLabour,
          headCount,
          hoursPerWorker,
          dailyWageRate,
          totalManHours: headCount * hoursPerWorker,
          totalLabourCost: headCount * dailyWageRate,
          date: new Date(),
        },
      ];
      const res = await pmsConstructionApi.updateSection(record._id, 'labourTracking', {
        labourEntries: updatedList,
      });
      const data = res?.data || res;
      setRecord(data);
      setLabourEntries(data?.labourTracking?.labourEntries || updatedList);
      setSuccessMsg('Labour deployment logged successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to add labour entry');
    } finally {
      setSaving(false);
    }
  };

  // Add Material Consumption Entry
  const handleAddConsumption = async (e) => {
    e.preventDefault();
    if (!newConsumption.materialName.trim() || !newConsumption.quantityConsumed) {
      setErrorMsg('Material name and quantity are required');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const qty = Number(newConsumption.quantityConsumed || 0);
      const rate = Number(newConsumption.unitRate || 0);
      const updatedList = [
        ...consumptionEntries,
        {
          ...newConsumption,
          quantityConsumed: qty,
          unitRate: rate,
          totalCost: qty * rate,
          date: new Date(),
        },
      ];
      const res = await pmsConstructionApi.updateSection(record._id, 'materialConsumption', {
        consumptionEntries: updatedList,
      });
      const data = res?.data || res;
      setRecord(data);
      setConsumptionEntries(data?.materialConsumption?.consumptionEntries || updatedList);
      setSuccessMsg('Material consumption recorded successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to record consumption');
    } finally {
      setSaving(false);
    }
  };

  // Add Quality Inspection
  const handleAddInspection = async (e) => {
    e.preventDefault();
    if (!newInspection.elementOrLocation.trim()) {
      setErrorMsg('Element or Location is required');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const updatedInspections = [
        ...inspections,
        {
          ...newInspection,
          inspectionDate: new Date(),
        },
      ];
      const res = await pmsConstructionApi.updateSection(record._id, 'qualitySitePhotos', {
        qualityInspections: updatedInspections,
        sitePhotos: photos,
      });
      const data = res?.data || res;
      setRecord(data);
      setInspections(data?.qualitySitePhotos?.qualityInspections || updatedInspections);
      setSuccessMsg('Quality check added successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to add inspection');
    } finally {
      setSaving(false);
    }
  };

  // Add Site Photo
  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!newPhoto.title.trim()) {
      setErrorMsg('Photo title is required');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const updatedPhotos = [
        ...photos,
        {
          ...newPhoto,
          date: new Date(),
        },
      ];
      const res = await pmsConstructionApi.updateSection(record._id, 'qualitySitePhotos', {
        qualityInspections: inspections,
        sitePhotos: updatedPhotos,
      });
      const data = res?.data || res;
      setRecord(data);
      setPhotos(data?.qualitySitePhotos?.sitePhotos || updatedPhotos);
      setSuccessMsg('Site photo attached successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to attach photo');
    } finally {
      setSaving(false);
    }
  };

  // Complete Section
  const handleCompleteSection = async (sectionKey) => {
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await pmsConstructionApi.completeSection(record._id, sectionKey, 'Section certified by Site In-charge');
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
      const res = await pmsConstructionApi.requestApproval(record._id);
      const data = res?.data || res;
      setRecord(data);
      setSuccessMsg('Submitted for Construction Stage Review');
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
      const res = await pmsConstructionApi.decideApproval(record._id, {
        decision,
        reason: approvalNote || (decision === 'approved' ? 'Stage 8 Construction certified to specification' : 'Revisions requested'),
      });
      const data = res?.data || res;
      setRecord(data);
      setSuccessMsg(`Stage 8 Construction ${decision.toUpperCase()} successfully!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to apply decision');
    } finally {
      setSaving(false);
    }
  };

  if (!recordId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[92vh] max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-orange-800 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <HardHat className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold tracking-tight">
                  Stage 8 • Construction Execution Workspace
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-amber-500/30 text-amber-100 border border-amber-300/30">
                  {record?.code || 'CEX'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                    record?.status === 'approved'
                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'
                      : record?.status === 'reviewPending'
                      ? 'bg-blue-500/30 text-blue-200 border border-blue-400/30'
                      : 'bg-amber-500/30 text-amber-200 border border-amber-400/30'
                  }`}
                >
                  {record?.status || 'inProgress'}
                </span>
              </div>
              <p className="text-xs text-amber-100/90 font-medium mt-0.5">
                Project: {record?.project?.name} ({record?.project?.code}) • Location: {record?.project?.location || 'Jaipur'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {record?.status === 'approved' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-100 text-xs font-medium rounded-lg border border-emerald-400/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                Stage 8 Certified
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
            <p className="text-slate-500 font-medium">Daily Logs (DPR)</p>
            <p className="text-base font-bold text-slate-800 mt-0.5">{dprLogs.length} Reports</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <p className="text-slate-500 font-medium">Total Man Hours</p>
            <p className="text-base font-bold text-slate-800 mt-0.5">{record?.totalManHours || 0} hrs</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <p className="text-slate-500 font-medium">Labour Expense</p>
            <p className="text-base font-bold text-amber-700 mt-0.5">{formatCurrency(record?.totalLabourCost || 0)}</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <p className="text-slate-500 font-medium">Material Consumed</p>
            <p className="text-base font-bold text-blue-700 mt-0.5">{formatCurrency(record?.totalMaterialCost || 0)}</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <p className="text-slate-500 font-medium">Quality Pass Rate</p>
            <p className="text-base font-bold text-emerald-700 mt-0.5">{record?.overallPassRate || 100}%</p>
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
                    ? 'border-amber-600 text-amber-700 bg-amber-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
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
              <Clock className="w-8 h-8 animate-spin text-amber-600 mb-2" />
              <p className="text-xs font-medium">Loading Construction Workspace...</p>
            </div>
          ) : (
            <div>
              {/* TAB 1: DAILY PROGRESS (DPR) */}
              {activeTab === 'dailyProgress' && (
                <div className="space-y-6">
                  {/* Top action / Complete Section */}
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Daily Progress Reports (DPR Logs)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Track daily shifts, weather conditions, planned milestones, and completed work.
                      </p>
                    </div>
                    {record?.status !== 'approved' && (
                      <button
                        onClick={() => handleCompleteSection('dailyProgress')}
                        disabled={saving || dprLogs.length === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark DPR Complete
                      </button>
                    )}
                  </div>

                  {/* Add DPR Form */}
                  {record?.status !== 'approved' && (
                    <form
                      onSubmit={handleAddDpr}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
                    >
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Plus className="w-4 h-4 text-amber-600" /> Log Daily Progress (DPR)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">DPR Number</label>
                          <input
                            type="text"
                            placeholder="e.g. DPR-2026-003"
                            value={newDpr.dprNumber}
                            onChange={(e) => setNewDpr({ ...newDpr, dprNumber: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Shift</label>
                          <select
                            value={newDpr.shift}
                            onChange={(e) => setNewDpr({ ...newDpr, shift: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="Day Shift">Day Shift</option>
                            <option value="Night Shift">Night Shift</option>
                            <option value="Overtime">Overtime</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Weather & Temp</label>
                          <div className="flex gap-2">
                            <select
                              value={newDpr.weather}
                              onChange={(e) => setNewDpr({ ...newDpr, weather: e.target.value })}
                              className="w-1/2 mt-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="Clear">Clear</option>
                              <option value="Sunny">Sunny</option>
                              <option value="Cloudy">Cloudy</option>
                              <option value="Rainy">Rainy</option>
                              <option value="Windy">Windy</option>
                            </select>
                            <input
                              type="text"
                              value={newDpr.temperature}
                              onChange={(e) => setNewDpr({ ...newDpr, temperature: e.target.value })}
                              className="w-1/2 mt-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              placeholder="32°C"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Site Engineer</label>
                          <input
                            type="text"
                            value={newDpr.siteEngineer}
                            onChange={(e) => setNewDpr({ ...newDpr, siteEngineer: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Planned Activities</label>
                          <textarea
                            rows={2}
                            placeholder="Activities scheduled for this shift..."
                            value={newDpr.plannedActivities}
                            onChange={(e) => setNewDpr({ ...newDpr, plannedActivities: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Completed Work & Deliverables</label>
                          <textarea
                            rows={2}
                            placeholder="Actual work finished on site..."
                            value={newDpr.completedActivities}
                            onChange={(e) => setNewDpr({ ...newDpr, completedActivities: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Add DPR Entry'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* DPR Logs List */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">DPR History ({dprLogs.length})</span>
                    </div>
                    {dprLogs.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No Daily Progress Reports logged yet. Submit the form above to log shift execution.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {dprLogs.map((dpr, idx) => (
                          <div key={idx} className="p-4 hover:bg-slate-50/80 transition">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-800">{dpr.dprNumber}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  {dpr.shift}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                  {dpr.weather} • {dpr.temperature}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium">
                                Engineer: <span className="text-slate-700 font-semibold">{dpr.siteEngineer}</span> •{' '}
                                {new Date(dpr.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-2">
                              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                  Planned Work
                                </span>
                                <p className="text-slate-700 mt-0.5 font-medium">{dpr.plannedActivities}</p>
                              </div>
                              <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                                  Actual Executed Work
                                </span>
                                <p className="text-slate-800 mt-0.5 font-medium">{dpr.completedActivities}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: LABOUR TRACKING */}
              {activeTab === 'labourTracking' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Labour Deployment & Gang Attendance</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Record daily worker headcounts, trades, man-hours, and wage commitments.
                      </p>
                    </div>
                    {record?.status !== 'approved' && (
                      <button
                        onClick={() => handleCompleteSection('labourTracking')}
                        disabled={saving || labourEntries.length === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark Labour Complete
                      </button>
                    )}
                  </div>

                  {/* Add Labour Form */}
                  {record?.status !== 'approved' && (
                    <form
                      onSubmit={handleAddLabour}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
                    >
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Plus className="w-4 h-4 text-amber-600" /> Log Gang Deployment
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Contractor Name</label>
                          <input
                            type="text"
                            value={newLabour.contractorName}
                            onChange={(e) => setNewLabour({ ...newLabour, contractorName: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Trade</label>
                          <select
                            value={newLabour.trade}
                            onChange={(e) => setNewLabour({ ...newLabour, trade: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="Civil & Masonry">Civil & Masonry</option>
                            <option value="Shuttering & Formwork">Shuttering & Formwork</option>
                            <option value="Bar Bending & Steel">Bar Bending & Steel</option>
                            <option value="Concreting & Pouring">Concreting & Pouring</option>
                            <option value="Plumbing & Drainage">Plumbing & Drainage</option>
                            <option value="Electrical Conduit & Wiring">Electrical Conduit & Wiring</option>
                            <option value="Plastering & Rendering">Plastering & Rendering</option>
                            <option value="Painting & Finishing">Painting & Finishing</option>
                            <option value="General Unskilled Labour">General Unskilled Labour</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Head Count & Wage</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="1"
                              placeholder="Heads"
                              value={newLabour.headCount}
                              onChange={(e) => setNewLabour({ ...newLabour, headCount: e.target.value })}
                              className="w-1/2 mt-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              required
                            />
                            <input
                              type="number"
                              min="0"
                              placeholder="₹/day"
                              value={newLabour.dailyWageRate}
                              onChange={(e) => setNewLabour({ ...newLabour, dailyWageRate: e.target.value })}
                              className="w-1/2 mt-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Supervisor</label>
                          <input
                            type="text"
                            value={newLabour.supervisor}
                            onChange={(e) => setNewLabour({ ...newLabour, supervisor: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Add Labour Gang'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Labour Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <th className="py-2.5 px-4">Contractor / Gang</th>
                          <th className="py-2.5 px-4">Trade</th>
                          <th className="py-2.5 px-4 text-center">Head Count</th>
                          <th className="py-2.5 px-4 text-center">Total Man Hours</th>
                          <th className="py-2.5 px-4 text-right">Daily Rate</th>
                          <th className="py-2.5 px-4 text-right">Total Cost</th>
                          <th className="py-2.5 px-4">Supervisor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {labourEntries.map((l, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition">
                            <td className="py-2.5 px-4 font-semibold text-slate-800">{l.contractorName}</td>
                            <td className="py-2.5 px-4 text-slate-600">{l.trade}</td>
                            <td className="py-2.5 px-4 text-center font-bold text-slate-800">{l.headCount}</td>
                            <td className="py-2.5 px-4 text-center text-slate-600">{l.totalManHours} hrs</td>
                            <td className="py-2.5 px-4 text-right text-slate-600">₹{l.dailyWageRate}/day</td>
                            <td className="py-2.5 px-4 text-right font-bold text-amber-700">{formatCurrency(l.totalLabourCost)}</td>
                            <td className="py-2.5 px-4 text-slate-600">{l.supervisor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: MATERIAL CONSUMPTION */}
              {activeTab === 'materialConsumption' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Daily Material Consumption Log</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Track raw materials drawn from site godowns against structural components.
                      </p>
                    </div>
                    {record?.status !== 'approved' && (
                      <button
                        onClick={() => handleCompleteSection('materialConsumption')}
                        disabled={saving || consumptionEntries.length === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark Consumption Complete
                      </button>
                    )}
                  </div>

                  {/* Add Consumption Form */}
                  {record?.status !== 'approved' && (
                    <form
                      onSubmit={handleAddConsumption}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
                    >
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Plus className="w-4 h-4 text-amber-600" /> Record Material Usage
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Material Name</label>
                          <input
                            type="text"
                            value={newConsumption.materialName}
                            onChange={(e) => setNewConsumption({ ...newConsumption, materialName: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Category & Unit</label>
                          <div className="flex gap-2">
                            <select
                              value={newConsumption.category}
                              onChange={(e) => setNewConsumption({ ...newConsumption, category: e.target.value })}
                              className="w-1/2 mt-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="cement">Cement</option>
                              <option value="steel">Steel</option>
                              <option value="sand">Sand</option>
                              <option value="aggregate">Aggregate</option>
                              <option value="bricks_blocks">Bricks/Blocks</option>
                              <option value="plumbing">Plumbing</option>
                              <option value="electrical">Electrical</option>
                              <option value="general">General</option>
                            </select>
                            <input
                              type="text"
                              value={newConsumption.unit}
                              onChange={(e) => setNewConsumption({ ...newConsumption, unit: e.target.value })}
                              className="w-1/2 mt-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              placeholder="Bags/MT"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Qty & Unit Rate</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="Qty"
                              value={newConsumption.quantityConsumed}
                              onChange={(e) => setNewConsumption({ ...newConsumption, quantityConsumed: e.target.value })}
                              className="w-1/2 mt-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              required
                            />
                            <input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="₹/unit"
                              value={newConsumption.unitRate}
                              onChange={(e) => setNewConsumption({ ...newConsumption, unitRate: e.target.value })}
                              className="w-1/2 mt-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Location / Element</label>
                          <input
                            type="text"
                            value={newConsumption.locationOrElement}
                            onChange={(e) => setNewConsumption({ ...newConsumption, locationOrElement: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            placeholder="e.g. Footing CF-01"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Add Consumption'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Material Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <th className="py-2.5 px-4">Material Name</th>
                          <th className="py-2.5 px-4">Category</th>
                          <th className="py-2.5 px-4 text-center">Consumed Qty</th>
                          <th className="py-2.5 px-4 text-right">Unit Rate</th>
                          <th className="py-2.5 px-4 text-right">Total Cost</th>
                          <th className="py-2.5 px-4">Location / Structural Element</th>
                          <th className="py-2.5 px-4">Verified By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {consumptionEntries.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition">
                            <td className="py-2.5 px-4 font-semibold text-slate-800">{m.materialName}</td>
                            <td className="py-2.5 px-4 text-slate-600 capitalize">{m.category}</td>
                            <td className="py-2.5 px-4 text-center font-bold text-slate-800">
                              {m.quantityConsumed} {m.unit}
                            </td>
                            <td className="py-2.5 px-4 text-right text-slate-600">₹{m.unitRate}</td>
                            <td className="py-2.5 px-4 text-right font-bold text-blue-700">{formatCurrency(m.totalCost)}</td>
                            <td className="py-2.5 px-4 text-slate-600">{m.locationOrElement}</td>
                            <td className="py-2.5 px-4 text-slate-600">{m.verifiedBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: QUALITY & SITE PHOTOS */}
              {activeTab === 'qualitySitePhotos' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Quality Inspections & Site Photos</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Document structural quality checks, slump tests, and visual proof of progress.
                      </p>
                    </div>
                    {record?.status !== 'approved' && (
                      <button
                        onClick={() => handleCompleteSection('qualitySitePhotos')}
                        disabled={saving || inspections.length === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark Quality Complete
                      </button>
                    )}
                  </div>

                  {/* Add Quality Inspection Form */}
                  {record?.status !== 'approved' && (
                    <form
                      onSubmit={handleAddInspection}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
                    >
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Plus className="w-4 h-4 text-amber-600" /> Log Quality Inspection
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Element / Location</label>
                          <input
                            type="text"
                            value={newInspection.elementOrLocation}
                            onChange={(e) => setNewInspection({ ...newInspection, elementOrLocation: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Inspection Stage</label>
                          <input
                            type="text"
                            value={newInspection.stage}
                            onChange={(e) => setNewInspection({ ...newInspection, stage: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Verdict</label>
                          <select
                            value={newInspection.verdict}
                            onChange={(e) => setNewInspection({ ...newInspection, verdict: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="Passed">Passed</option>
                            <option value="Conditional Pass">Conditional Pass</option>
                            <option value="Rectification Required">Rectification Required</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Checked By</label>
                          <input
                            type="text"
                            value={newInspection.checkedBy}
                            onChange={(e) => setNewInspection({ ...newInspection, checkedBy: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Remarks / Remedial Actions</label>
                        <input
                          type="text"
                          value={newInspection.remedialAction}
                          onChange={(e) => setNewInspection({ ...newInspection, remedialAction: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Add Inspection'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Quality Inspection Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <th className="py-2.5 px-4">Location / Component</th>
                          <th className="py-2.5 px-4">Inspection Stage</th>
                          <th className="py-2.5 px-4 text-center">Verdict</th>
                          <th className="py-2.5 px-4">Remedial Action / Observations</th>
                          <th className="py-2.5 px-4">Inspected By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {inspections.map((q, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition">
                            <td className="py-2.5 px-4 font-semibold text-slate-800">{q.elementOrLocation}</td>
                            <td className="py-2.5 px-4 text-slate-600">{q.stage}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  q.verdict === 'Passed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : q.verdict === 'Conditional Pass'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {q.verdict}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">{q.remedialAction}</td>
                            <td className="py-2.5 px-4 text-slate-600">{q.checkedBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Site Photos Gallery */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Camera className="w-4 h-4 text-amber-600" /> Site Progress Photos ({photos.length})
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {photos.map((p, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs group">
                          <div className="h-40 bg-slate-100 overflow-hidden relative">
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs">
                              {p.category}
                            </span>
                          </div>
                          <div className="p-3">
                            <p className="text-xs font-bold text-slate-800 line-clamp-1">{p.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Tag: {p.locationTag}</p>
                            <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{p.notes}</p>
                          </div>
                        </div>
                      ))}
                    </div>
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
              Stage 8 Status: <strong className="text-slate-800 uppercase">{record?.status}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {record?.status === 'inProgress' && (
              <button
                onClick={handleRequestApproval}
                disabled={saving || dprLogs.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                Submit for PM Review
              </button>
            )}

            {record?.status === 'reviewPending' && (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Approval certification note..."
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
                  Approve Stage 8
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
  );
}
