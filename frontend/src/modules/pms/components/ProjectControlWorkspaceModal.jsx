import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingDown,
  TrendingUp,
  Clock,
  Calendar,
  Layers,
  IndianRupee,
  Activity,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  Building,
  Save,
  Check,
  ShieldCheck,
  Boxes,
  Users,
  Target,
} from 'lucide-react';
import { pmsControlApi } from '../../../api/pmsControlApi';

const SECTIONS = [
  { key: 'materialVariance', title: '1. Material Variance', icon: Boxes },
  { key: 'labourVariance', title: '2. Labour Variance', icon: Users },
  { key: 'timeVariance', title: '3. Schedule & Time Variance', icon: Calendar },
  { key: 'costVariance', title: '4. Cost Variance & CPI/SPI', icon: Target },
];

function formatCurrency(val) {
  if (!val || isNaN(val)) return '₹0';
  const num = Number(val);
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  return `${sign}₹${abs.toLocaleString('en-IN')}`;
}

export default function ProjectControlWorkspaceModal({ recordId, onClose, onRefresh }) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('materialVariance');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Material Variance State
  const [materials, setMaterials] = useState([]);
  const [newMaterial, setNewMaterial] = useState({
    materialName: '',
    category: 'cement',
    unit: 'Bags',
    baselineQty: '',
    actualQty: '',
    baselineRate: '',
    actualRate: '',
    remarks: '',
  });

  // 2. Labour Variance State
  const [labourItems, setLabourItems] = useState([]);
  const [newLabour, setNewLabour] = useState({
    trade: 'Civil & Masonry Gang',
    contractorName: 'Apex Civil Infra & RCC Contractors',
    baselineManHours: '',
    actualManHours: '',
    baselineRate: '',
    actualRate: '',
    remarks: '',
  });

  // 3. Time Milestones State
  const [milestones, setMilestones] = useState([]);
  const [newMilestone, setNewMilestone] = useState({
    milestoneName: '',
    baselineStart: '',
    baselineEnd: '',
    actualStart: '',
    actualEnd: '',
    varianceDays: 0,
    status: 'On Schedule',
    criticalPathImpact: false,
    mitigationAction: '',
  });

  // 4. Cost Variance State
  const [costData, setCostData] = useState({
    baselineBudgetTotal: 0,
    actualCostToDate: 0,
    mitigationPlan: '',
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
      const res = await pmsControlApi.getRecordById(recordId);
      const data = res?.data || res;
      setRecord(data);
      if (data?.materialVariance?.items) setMaterials(data.materialVariance.items);
      if (data?.labourVariance?.items) setLabourItems(data.labourVariance.items);
      if (data?.timeVariance?.milestones) setMilestones(data.timeVariance.milestones);
      if (data?.costVariance) {
        setCostData({
          baselineBudgetTotal: data.costVariance.baselineBudgetTotal || 0,
          actualCostToDate: data.costVariance.actualCostToDate || 0,
          mitigationPlan: data.costVariance.mitigationPlan || '',
        });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load record');
    } finally {
      setLoading(false);
    }
  };

  // Add Material Variance Item
  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!newMaterial.materialName.trim() || !newMaterial.baselineQty || !newMaterial.actualQty) {
      setErrorMsg('Material Name, Baseline Quantity, and Actual Quantity are required');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const updatedList = [
        ...materials,
        {
          ...newMaterial,
          baselineQty: Number(newMaterial.baselineQty),
          actualQty: Number(newMaterial.actualQty),
          baselineRate: Number(newMaterial.baselineRate || 0),
          actualRate: Number(newMaterial.actualRate || 0),
        },
      ];
      const res = await pmsControlApi.updateSection(record._id, 'materialVariance', {
        items: updatedList,
      });
      const data = res?.data || res;
      setRecord(data);
      setMaterials(data?.materialVariance?.items || updatedList);
      setNewMaterial({
        materialName: '',
        category: 'cement',
        unit: 'Bags',
        baselineQty: '',
        actualQty: '',
        baselineRate: '',
        actualRate: '',
        remarks: '',
      });
      setSuccessMsg('Material variance item added successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to add material');
    } finally {
      setSaving(false);
    }
  };

  // Add Labour Variance Item
  const handleAddLabour = async (e) => {
    e.preventDefault();
    if (!newLabour.trade.trim() || !newLabour.baselineManHours || !newLabour.actualManHours) {
      setErrorMsg('Trade, Baseline Man-Hours, and Actual Man-Hours are required');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const updatedList = [
        ...labourItems,
        {
          ...newLabour,
          baselineManHours: Number(newLabour.baselineManHours),
          actualManHours: Number(newLabour.actualManHours),
          baselineRate: Number(newLabour.baselineRate || 0),
          actualRate: Number(newLabour.actualRate || 0),
        },
      ];
      const res = await pmsControlApi.updateSection(record._id, 'labourVariance', {
        items: updatedList,
      });
      const data = res?.data || res;
      setRecord(data);
      setLabourItems(data?.labourVariance?.items || updatedList);
      setNewLabour({
        trade: 'Civil & Masonry Gang',
        contractorName: 'Apex Civil Infra & RCC Contractors',
        baselineManHours: '',
        actualManHours: '',
        baselineRate: '',
        actualRate: '',
        remarks: '',
      });
      setSuccessMsg('Labour variance item added successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to add labour');
    } finally {
      setSaving(false);
    }
  };

  // Add Time Milestone
  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestone.milestoneName.trim()) {
      setErrorMsg('Milestone Name is required');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const updatedList = [
        ...milestones,
        {
          ...newMilestone,
          varianceDays: Number(newMilestone.varianceDays || 0),
        },
      ];
      const res = await pmsControlApi.updateSection(record._id, 'timeVariance', {
        milestones: updatedList,
      });
      const data = res?.data || res;
      setRecord(data);
      setMilestones(data?.timeVariance?.milestones || updatedList);
      setNewMilestone({
        milestoneName: '',
        baselineStart: '',
        baselineEnd: '',
        actualStart: '',
        actualEnd: '',
        varianceDays: 0,
        status: 'On Schedule',
        criticalPathImpact: false,
        mitigationAction: '',
      });
      setSuccessMsg('Schedule milestone logged');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to add milestone');
    } finally {
      setSaving(false);
    }
  };

  // Save Cost Variance Data
  const handleSaveCost = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await pmsControlApi.updateSection(record._id, 'costVariance', {
        baselineBudgetTotal: costData.baselineBudgetTotal,
        actualCostToDate: costData.actualCostToDate,
        mitigationPlan: costData.mitigationPlan,
      });
      const data = res?.data || res;
      setRecord(data);
      setSuccessMsg('Cost performance indices updated successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update cost data');
    } finally {
      setSaving(false);
    }
  };

  // Complete Section
  const handleCompleteSection = async (sectionKey) => {
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await pmsControlApi.completeSection(record._id, sectionKey, 'Certified by Cost Control Manager');
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
      const res = await pmsControlApi.requestApproval(record._id);
      const data = res?.data || res;
      setRecord(data);
      setSuccessMsg('Submitted for Project Variance Sign-off Review');
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
      const res = await pmsControlApi.decideApproval(record._id, {
        decision,
        reason: approvalNote || (decision === 'approved' ? 'Stage 10 Variance & Cost Control certified and approved' : 'Revisions requested'),
      });
      const data = res?.data || res;
      setRecord(data);
      setSuccessMsg(`Stage 10 Variance & Control ${decision.toUpperCase()} successfully!`);
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
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Stage 10 • Project Control, Variance & Tracking
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {record.code}
                </span>
                <span className="text-xs font-semibold text-indigo-600">
                  • {record.status?.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Project: <span className="font-medium text-slate-700">{record.project?.name || "Project"}</span> ({record.project?.code}) • Stage Order: {record.stageOrder || 7}
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
            <p className="text-slate-500 font-medium">Cost Perf. (CPI)</p>
            <p className={`text-base font-bold mt-0.5 ${record?.cpi >= 1 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {record?.cpi || 1.0}
            </p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <p className="text-slate-500 font-medium">Schedule (SPI)</p>
            <p className="text-base font-bold text-indigo-700 mt-0.5">{record?.spi || 1.0}</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <p className="text-slate-500 font-medium">Material Variance</p>
            <p className={`text-base font-bold mt-0.5 ${record?.materialVariance?.netMaterialVariance <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(record?.materialVariance?.netMaterialVariance || 0)}
            </p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <p className="text-slate-500 font-medium">Labour Variance</p>
            <p className={`text-base font-bold mt-0.5 ${record?.labourVariance?.netLabourVariance <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(record?.labourVariance?.netLabourVariance || 0)}
            </p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <p className="text-slate-500 font-medium">Total Cost Variance</p>
            <p className={`text-base font-bold mt-0.5 ${record?.overallCostVariance <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(record?.overallCostVariance || 0)}
            </p>
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
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
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
              <Clock className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
              <p className="text-xs font-medium">Loading Project Control Workspace...</p>
            </div>
          ) : (
            <div>
              {/* TAB 1: MATERIAL VARIANCE */}
              {activeTab === 'materialVariance' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Planned vs Actual Material Variance</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Track quantity consumed, purchasing rate deviations, and net cost impacts against baseline.
                      </p>
                    </div>
                    {record?.status !== 'approved' && (
                      <button
                        onClick={() => handleCompleteSection('materialVariance')}
                        disabled={saving || materials.length === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark Material Variance Complete
                      </button>
                    )}
                  </div>

                  {/* Add Material Variance Form */}
                  {record?.status !== 'approved' && (
                    <form
                      onSubmit={handleAddMaterial}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
                    >
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Plus className="w-4 h-4 text-indigo-600" /> Add Material Tracking Item
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Material Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Fe 550D TMT Steel"
                            value={newMaterial.materialName}
                            onChange={(e) => setNewMaterial({ ...newMaterial, materialName: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Unit</label>
                          <input
                            type="text"
                            placeholder="Bags/MT"
                            value={newMaterial.unit}
                            onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Qty (Baseline / Actual)</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Planned"
                              value={newMaterial.baselineQty}
                              onChange={(e) => setNewMaterial({ ...newMaterial, baselineQty: e.target.value })}
                              className="w-1/2 mt-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              required
                            />
                            <input
                              type="number"
                              placeholder="Actual"
                              value={newMaterial.actualQty}
                              onChange={(e) => setNewMaterial({ ...newMaterial, actualQty: e.target.value })}
                              className="w-1/2 mt-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Rate ₹ (Baseline / Actual)</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Plan Rate"
                              value={newMaterial.baselineRate}
                              onChange={(e) => setNewMaterial({ ...newMaterial, baselineRate: e.target.value })}
                              className="w-1/2 mt-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <input
                              type="number"
                              placeholder="Actual Rate"
                              value={newMaterial.actualRate}
                              onChange={(e) => setNewMaterial({ ...newMaterial, actualRate: e.target.value })}
                              className="w-1/2 mt-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Variance Reason / Observations</label>
                        <input
                          type="text"
                          placeholder="e.g. Rate inflation +2.5% negotiated on quarterly purchase contract"
                          value={newMaterial.remarks}
                          onChange={(e) => setNewMaterial({ ...newMaterial, remarks: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Add Material Item'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Materials Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <th className="py-2.5 px-4">Material Name</th>
                          <th className="py-2.5 px-4 text-center">Baseline vs Actual Qty</th>
                          <th className="py-2.5 px-4 text-center">Rate ₹ (Plan / Act)</th>
                          <th className="py-2.5 px-4 text-right">Baseline Cost</th>
                          <th className="py-2.5 px-4 text-right">Actual Cost</th>
                          <th className="py-2.5 px-4 text-right">Variance (₹)</th>
                          <th className="py-2.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {materials.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition">
                            <td className="py-2.5 px-4">
                              <span className="font-bold text-slate-800 block">{m.materialName}</span>
                              <span className="text-[11px] text-slate-500">{m.remarks}</span>
                            </td>
                            <td className="py-2.5 px-4 text-center text-slate-600">
                              {m.baselineQty} / <span className="font-bold text-slate-800">{m.actualQty}</span> {m.unit}
                            </td>
                            <td className="py-2.5 px-4 text-center text-slate-600 font-mono">
                              ₹{m.baselineRate} / ₹{m.actualRate}
                            </td>
                            <td className="py-2.5 px-4 text-right text-slate-600">{formatCurrency(m.baselineCost)}</td>
                            <td className="py-2.5 px-4 text-right font-semibold text-slate-800">{formatCurrency(m.actualCost)}</td>
                            <td
                              className={`py-2.5 px-4 text-right font-bold ${
                                m.costVariance <= 0 ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {formatCurrency(m.costVariance)}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  m.varianceType === 'Favorable'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : m.varianceType === 'Adverse'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {m.varianceType}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: LABOUR VARIANCE */}
              {activeTab === 'labourVariance' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Planned vs Actual Labour Variance</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Track man-hours efficiency, gang productivity, and labour wage variances against plan.
                      </p>
                    </div>
                    {record?.status !== 'approved' && (
                      <button
                        onClick={() => handleCompleteSection('labourVariance')}
                        disabled={saving || labourItems.length === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark Labour Variance Complete
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
                        <Plus className="w-4 h-4 text-indigo-600" /> Log Gang Labour Variance
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Trade</label>
                          <input
                            type="text"
                            value={newLabour.trade}
                            onChange={(e) => setNewLabour({ ...newLabour, trade: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Contractor Name</label>
                          <input
                            type="text"
                            value={newLabour.contractorName}
                            onChange={(e) => setNewLabour({ ...newLabour, contractorName: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Man-Hours (Plan / Act)</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Plan Hours"
                              value={newLabour.baselineManHours}
                              onChange={(e) => setNewLabour({ ...newLabour, baselineManHours: e.target.value })}
                              className="w-1/2 mt-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              required
                            />
                            <input
                              type="number"
                              placeholder="Act Hours"
                              value={newLabour.actualManHours}
                              onChange={(e) => setNewLabour({ ...newLabour, actualManHours: e.target.value })}
                              className="w-1/2 mt-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Hourly Rate ₹ (Plan / Act)</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Plan Rate"
                              value={newLabour.baselineRate}
                              onChange={(e) => setNewLabour({ ...newLabour, baselineRate: e.target.value })}
                              className="w-1/2 mt-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <input
                              type="number"
                              placeholder="Act Rate"
                              value={newLabour.actualRate}
                              onChange={(e) => setNewLabour({ ...newLabour, actualRate: e.target.value })}
                              className="w-1/2 mt-1 px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Add Labour Item'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Labour Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <th className="py-2.5 px-4">Trade & Contractor</th>
                          <th className="py-2.5 px-4 text-center">Man-Hours (Plan / Act)</th>
                          <th className="py-2.5 px-4 text-center">Hourly Rate (₹)</th>
                          <th className="py-2.5 px-4 text-right">Baseline Cost</th>
                          <th className="py-2.5 px-4 text-right">Actual Cost</th>
                          <th className="py-2.5 px-4 text-right">Variance (₹)</th>
                          <th className="py-2.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {labourItems.map((l, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition">
                            <td className="py-2.5 px-4">
                              <span className="font-bold text-slate-800 block">{l.trade}</span>
                              <span className="text-[11px] text-slate-500">{l.contractorName}</span>
                            </td>
                            <td className="py-2.5 px-4 text-center text-slate-600">
                              {l.baselineManHours} / <span className="font-bold text-slate-800">{l.actualManHours}</span> hrs
                            </td>
                            <td className="py-2.5 px-4 text-center text-slate-600 font-mono">
                              ₹{l.baselineRate} / ₹{l.actualRate}
                            </td>
                            <td className="py-2.5 px-4 text-right text-slate-600">{formatCurrency(l.baselineCost)}</td>
                            <td className="py-2.5 px-4 text-right font-semibold text-slate-800">{formatCurrency(l.actualCost)}</td>
                            <td
                              className={`py-2.5 px-4 text-right font-bold ${
                                l.costVariance <= 0 ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {formatCurrency(l.costVariance)}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  l.varianceType === 'Favorable'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : l.varianceType === 'Adverse'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {l.varianceType}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: TIME & SCHEDULE VARIANCE */}
              {activeTab === 'timeVariance' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Schedule & Milestone Timeline Variance</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Track planned start/finish dates, slippage in days, critical path flags, and mitigation actions.
                      </p>
                    </div>
                    {record?.status !== 'approved' && (
                      <button
                        onClick={() => handleCompleteSection('timeVariance')}
                        disabled={saving || milestones.length === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark Schedule Complete
                      </button>
                    )}
                  </div>

                  {/* Add Milestone Form */}
                  {record?.status !== 'approved' && (
                    <form
                      onSubmit={handleAddMilestone}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
                    >
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Plus className="w-4 h-4 text-indigo-600" /> Log Milestone Schedule Health
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                          <label className="text-[11px] font-semibold text-slate-600">Milestone Name</label>
                          <input
                            type="text"
                            placeholder="e.g. RCC Column Footings & Substructure"
                            value={newMilestone.milestoneName}
                            onChange={(e) => setNewMilestone({ ...newMilestone, milestoneName: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Variance (Days)</label>
                          <input
                            type="number"
                            placeholder="+2 (Delay) or -2 (Ahead)"
                            value={newMilestone.varianceDays}
                            onChange={(e) => setNewMilestone({ ...newMilestone, varianceDays: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Schedule Health</label>
                          <select
                            value={newMilestone.status}
                            onChange={(e) => setNewMilestone({ ...newMilestone, status: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="On Schedule">On Schedule</option>
                            <option value="Ahead">Ahead</option>
                            <option value="Minor Delay (<15 days)">Minor Delay (&lt;15 days)</option>
                            <option value="Critical Delay (>15 days)">Critical Delay (&gt;15 days)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Mitigation Strategy / Fast-track Action</label>
                        <input
                          type="text"
                          placeholder="Action taken to recover schedule slippage..."
                          value={newMilestone.mitigationAction}
                          onChange={(e) => setNewMilestone({ ...newMilestone, mitigationAction: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Add Schedule Milestone'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Milestones Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <th className="py-2.5 px-4">Milestone</th>
                          <th className="py-2.5 px-4 text-center">Variance (Days)</th>
                          <th className="py-2.5 px-4 text-center">Health Status</th>
                          <th className="py-2.5 px-4">Mitigation Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {milestones.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition">
                            <td className="py-2.5 px-4 font-bold text-slate-800">{m.milestoneName}</td>
                            <td className="py-2.5 px-4 text-center font-bold text-slate-800">
                              {m.varianceDays > 0 ? `+${m.varianceDays}` : m.varianceDays} Days
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  m.status === 'On Schedule' || m.status === 'Ahead'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {m.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">{m.mitigationAction}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: COST VARIANCE & PERFORMANCE INDICES */}
              {activeTab === 'costVariance' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Cost Governance & Performance Indices</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Track Cost Performance Index (CPI), Schedule Performance Index (SPI), and Estimate At Completion.
                      </p>
                    </div>
                    {record?.status !== 'approved' && (
                      <button
                        onClick={() => handleCompleteSection('costVariance')}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark Cost Variance Complete
                      </button>
                    )}
                  </div>

                  {/* Performance Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Cost Performance Index (CPI)
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className={`text-2xl font-black ${record?.cpi >= 1 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {record?.cpi || 1.0}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {record?.cpi >= 1 ? 'Under Budget / Efficient' : 'Cost Slippage'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Formula: Baseline Budget / Actual Cost To Date. Value &gt;= 1.0 indicates cost efficiency.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Schedule Performance Index (SPI)
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black text-indigo-700">{record?.spi || 1.0}</span>
                        <span className="text-xs font-semibold text-slate-500">On Track</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Earned schedule timeline health against locked baseline milestones.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Estimate At Completion (EAC)
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black text-slate-900">
                          {formatCurrency(record?.costVariance?.estimateAtCompletion || record?.costVariance?.actualCostToDate || 0)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Projected total expenditure to finish project based on current burn rate.
                      </p>
                    </div>
                  </div>

                  {/* Edit Cost Form */}
                  {record?.status !== 'approved' && (
                    <form
                      onSubmit={handleSaveCost}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
                    >
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-600" /> Financial Governance Input
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Total Baseline Budget (₹)</label>
                          <input
                            type="number"
                            value={costData.baselineBudgetTotal}
                            onChange={(e) => setCostData({ ...costData, baselineBudgetTotal: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Actual Cost To Date (₹)</label>
                          <input
                            type="number"
                            value={costData.actualCostToDate}
                            onChange={(e) => setCostData({ ...costData, actualCostToDate: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Mitigation & Corrective Directives</label>
                        <textarea
                          rows={2}
                          value={costData.mitigationPlan}
                          onChange={(e) => setCostData({ ...costData, mitigationPlan: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Action plan to control budget overrun..."
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Recalculate Indices'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Decision & Sign-off Bar */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">
              Stage 10 Status: <strong className="text-slate-800 uppercase">{record?.status}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {record?.status === 'monitoring' && (
              <button
                onClick={handleRequestApproval}
                disabled={saving}
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
                  placeholder="Variance approval remarks..."
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
                  Approve Stage 10
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