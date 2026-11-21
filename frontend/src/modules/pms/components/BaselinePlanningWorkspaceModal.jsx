import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Users,
  Calendar,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Send,
  Lock,
  Unlock,
  Building,
  Save,
  Check,
  Award,
} from 'lucide-react';
import { pmsBaselineApi } from '../../../api/pmsBaselineApi';

const SECTIONS = [
  { key: 'plannedMaterial', title: '1. Material Schedule', icon: Package },
  { key: 'plannedLabour', title: '2. Labour Gangs', icon: Users },
  { key: 'plannedTimeline', title: '3. Milestone Schedule', icon: Calendar },
  { key: 'plannedCashflow', title: '4. Projected Cashflow', icon: TrendingDown },
];

function formatCurrency(val) {
  if (!val || isNaN(val)) return '₹0';
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

export default function BaselinePlanningWorkspaceModal({ baselineId, onClose, onRefresh }) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const [baseline, setBaseline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plannedMaterial');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Materials State
  const [materialItems, setMaterialItems] = useState([]);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    category: 'general',
    unit: 'Bags',
    plannedQuantity: '',
    unitRate: '',
    remarks: '',
  });

  // 2. Labour State
  const [labourItems, setLabourItems] = useState([]);
  const [newLabour, setNewLabour] = useState({
    trade: '',
    headcount: 5,
    ratePerDay: 750,
    plannedManDays: 500,
    remarks: '',
  });

  // 3. Timeline State
  const [timelineForm, setTimelineForm] = useState({
    plannedStartDate: '',
    plannedCompletionDate: '',
    totalDurationDays: 365,
    remarks: '',
  });
  const [milestones, setMilestones] = useState([]);

  // 4. Cashflow State
  const [cashflowItems, setCashflowItems] = useState([]);
  const [newCashflow, setNewCashflow] = useState({
    monthLabel: '',
    targetMilestone: '',
    materialOutflow: '',
    labourOutflow: '',
    contractorOutflow: '',
    miscOutflow: '',
  });

  // Baseline lock form
  const [lockNote, setLockNote] = useState('');

  useEffect(() => {
    if (baselineId) loadBaseline();
  }, [baselineId]);

  const loadBaseline = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await pmsBaselineApi.getBaselineById(baselineId);
      if (res?.success) {
        const data = res.data;
        setBaseline(data);

        // Populate Materials
        if (data.plannedMaterial?.items) {
          setMaterialItems(data.plannedMaterial.items);
        }

        // Populate Labour
        if (data.plannedLabour?.items) {
          setLabourItems(data.plannedLabour.items);
        }

        // Populate Timeline
        if (data.plannedTimeline) {
          setTimelineForm({
            plannedStartDate: data.plannedTimeline.plannedStartDate
              ? data.plannedTimeline.plannedStartDate.split('T')[0]
              : '',
            plannedCompletionDate: data.plannedTimeline.plannedCompletionDate
              ? data.plannedTimeline.plannedCompletionDate.split('T')[0]
              : '',
            totalDurationDays: data.plannedTimeline.totalDurationDays || 365,
            remarks: data.plannedTimeline.remarks || '',
          });
          setMilestones(data.plannedTimeline.milestones || []);
        }

        // Populate Cashflow
        if (data.plannedCashflow?.items) {
          setCashflowItems(data.plannedCashflow.items);
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load baseline planning record');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, isErr = false) => {
    if (isErr) {
      setErrorMsg(msg);
      setSuccessMsg('');
    } else {
      setSuccessMsg(msg);
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const isFrozen = baseline?.baselineLock?.isLocked;

  // Material Handlers
  const handleUpdateMaterialItem = (index, field, value) => {
    setMaterialItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddMaterial = (e) => {
    e.preventDefault();
    if (!newMaterial.name.trim() || !newMaterial.plannedQuantity || !newMaterial.unitRate) {
      showNotification('Material name, planned quantity, and rate are required', true);
      return;
    }
    const cost = Number(newMaterial.plannedQuantity) * Number(newMaterial.unitRate);
    setMaterialItems((prev) => [
      ...prev,
      {
        name: newMaterial.name,
        category: newMaterial.category,
        unit: newMaterial.unit,
        plannedQuantity: Number(newMaterial.plannedQuantity) || 0,
        unitRate: Number(newMaterial.unitRate) || 0,
        totalEstimatedCost: cost,
        remarks: newMaterial.remarks,
      },
    ]);
    setNewMaterial({
      name: '',
      category: 'general',
      unit: 'Bags',
      plannedQuantity: '',
      unitRate: '',
      remarks: '',
    });
  };

  const handleSaveMaterials = async (complete = false) => {
    setSaving(true);
    try {
      const res = await pmsBaselineApi.updateSection(baselineId, 'plannedMaterial', {
        items: materialItems,
      });
      if (res?.success) {
        if (complete) {
          const compRes = await pmsBaselineApi.completeSection(baselineId, 'plannedMaterial');
          setBaseline(compRes.data);
          showNotification('Planned material schedule completed');
          setActiveTab('plannedLabour');
        } else {
          setBaseline(res.data);
          showNotification('Planned material draft saved');
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save materials', true);
    } finally {
      setSaving(false);
    }
  };

  // Labour Handlers
  const handleUpdateLabourItem = (index, field, value) => {
    setLabourItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddLabour = (e) => {
    e.preventDefault();
    if (!newLabour.trade.trim() || !newLabour.ratePerDay || !newLabour.plannedManDays) {
      showNotification('Trade name, day rate, and planned man-days are required', true);
      return;
    }
    const cost = Number(newLabour.plannedManDays) * Number(newLabour.ratePerDay);
    setLabourItems((prev) => [
      ...prev,
      {
        trade: newLabour.trade,
        headcount: Number(newLabour.headcount) || 1,
        ratePerDay: Number(newLabour.ratePerDay) || 0,
        plannedManDays: Number(newLabour.plannedManDays) || 0,
        totalEstimatedCost: cost,
        remarks: newLabour.remarks,
      },
    ]);
    setNewLabour({
      trade: '',
      headcount: 5,
      ratePerDay: 750,
      plannedManDays: 500,
      remarks: '',
    });
  };

  const handleSaveLabour = async (complete = false) => {
    setSaving(true);
    try {
      const res = await pmsBaselineApi.updateSection(baselineId, 'plannedLabour', {
        items: labourItems,
      });
      if (res?.success) {
        if (complete) {
          const compRes = await pmsBaselineApi.completeSection(baselineId, 'plannedLabour');
          setBaseline(compRes.data);
          showNotification('Planned labour schedule completed');
          setActiveTab('plannedTimeline');
        } else {
          setBaseline(res.data);
          showNotification('Planned labour draft saved');
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save labour schedule', true);
    } finally {
      setSaving(false);
    }
  };

  // Timeline Handlers
  const handleUpdateMilestone = (index, field, value) => {
    setMilestones((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSaveTimeline = async (complete = false) => {
    setSaving(true);
    try {
      const payload = {
        plannedStartDate: timelineForm.plannedStartDate || null,
        plannedCompletionDate: timelineForm.plannedCompletionDate || null,
        totalDurationDays: Number(timelineForm.totalDurationDays) || 365,
        milestones,
        remarks: timelineForm.remarks,
      };

      const res = await pmsBaselineApi.updateSection(baselineId, 'plannedTimeline', payload);
      if (res?.success) {
        if (complete) {
          const compRes = await pmsBaselineApi.completeSection(baselineId, 'plannedTimeline');
          setBaseline(compRes.data);
          showNotification('Timeline milestone schedule completed');
          setActiveTab('plannedCashflow');
        } else {
          setBaseline(res.data);
          showNotification('Timeline draft saved');
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save timeline', true);
    } finally {
      setSaving(false);
    }
  };

  // Cashflow Handlers
  const handleUpdateCashflowItem = (index, field, value) => {
    setCashflowItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddCashflow = (e) => {
    e.preventDefault();
    if (!newCashflow.monthLabel.trim()) {
      showNotification('Month tranche label is required', true);
      return;
    }
    const mat = Number(newCashflow.materialOutflow) || 0;
    const lab = Number(newCashflow.labourOutflow) || 0;
    const con = Number(newCashflow.contractorOutflow) || 0;
    const mis = Number(newCashflow.miscOutflow) || 0;
    setCashflowItems((prev) => [
      ...prev,
      {
        monthLabel: newCashflow.monthLabel,
        targetMilestone: newCashflow.targetMilestone,
        materialOutflow: mat,
        labourOutflow: lab,
        contractorOutflow: con,
        miscOutflow: mis,
        totalOutflow: mat + lab + con + mis,
      },
    ]);
    setNewCashflow({
      monthLabel: '',
      targetMilestone: '',
      materialOutflow: '',
      labourOutflow: '',
      contractorOutflow: '',
      miscOutflow: '',
    });
  };

  const handleSaveCashflow = async (complete = false) => {
    setSaving(true);
    try {
      const res = await pmsBaselineApi.updateSection(baselineId, 'plannedCashflow', {
        items: cashflowItems,
      });
      if (res?.success) {
        if (complete) {
          const compRes = await pmsBaselineApi.completeSection(baselineId, 'plannedCashflow');
          setBaseline(compRes.data);
          showNotification('Projected cashflow schedule completed');
        } else {
          setBaseline(res.data);
          showNotification('Projected cashflow saved');
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save cashflow', true);
    } finally {
      setSaving(false);
    }
  };

  // Baseline Lock Handlers
  const handleRequestLock = async () => {
    setSaving(true);
    try {
      const res = await pmsBaselineApi.requestBaselineLock(baselineId, { note: lockNote });
      if (res?.success) {
        setBaseline(res.data);
        showNotification('Submitted for executive baseline freeze review');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to submit lock request', true);
    } finally {
      setSaving(false);
    }
  };

  const handleLockBaseline = async (decision) => {
    setSaving(true);
    try {
      const res = await pmsBaselineApi.lockBaseline(baselineId, {
        decision,
        note: lockNote || (decision === 'approved' ? 'Baseline officially frozen and locked' : 'Returned for revision'),
      });
      if (res?.success) {
        setBaseline(res.data);
        showNotification(
          decision === 'approved'
            ? 'Baseline Frozen & Locked! Project advanced to Stage 7 (Execution)'
            : 'Baseline returned for revision'
        );
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Baseline lock decision failed', true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-hidden animate-in fade-in duration-150">
        <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading Stage 6 Baseline Planning...</p>
        </div>
      </div>,
      document.body
    );
  }

  const allSectionsComplete = SECTIONS.every((s) => baseline?.[s.key]?.status === 'completed');

  const totalMatCostPreview = materialItems.reduce(
    (acc, m) => acc + (Number(m.plannedQuantity) || 0) * (Number(m.unitRate) || 0),
    0
  );
  const totalLabCostPreview = labourItems.reduce(
    (acc, l) => acc + (Number(l.plannedManDays) || 0) * (Number(l.ratePerDay) || 0),
    0
  );
  const totalBaselinePreview = Math.max(
    totalMatCostPreview + totalLabCostPreview,
    baseline?.baselineLock?.totalBaselineBudget || 0
  );

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] max-h-[95vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-400/30">
                {baseline?.code || 'BSL-000000'}
              </span>
              <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                Stage 6: Baseline Planning & Governance Lock
              </span>
              {isFrozen && (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <Lock className="w-3 h-3" />
                  <span>BASELINE FROZEN</span>
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              {baseline?.project?.name || 'Baseline Master Workspace'}
            </h2>
            <div className="text-xs text-slate-300 mt-0.5 flex items-center gap-3">
              <span>Materials: <strong className="text-white">{formatCurrency(totalMatCostPreview)}</strong></span>
              <span>•</span>
              <span>Labour: <strong className="text-white">{formatCurrency(totalLabCostPreview)}</strong></span>
              <span>•</span>
              <span>Total Baseline: <strong className="text-emerald-300">{formatCurrency(totalBaselinePreview)}</strong></span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-xs font-medium text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 4-Step Rail Tab Selector */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isCompleted = baseline?.[sec.key]?.status === 'completed';
            const isActive = activeTab === sec.key;
            return (
              <button
                key={sec.key}
                onClick={() => setActiveTab(sec.key)}
                className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-brand-600 text-brand-700 bg-white shadow-xs rounded-t-md'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                <span>{sec.title}</span>
                {isCompleted && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: PLANNED MATERIAL */}
          {activeTab === 'plannedMaterial' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Planned Bill of Materials (BOM)</h3>
                  <p className="text-xs text-slate-500">Lock estimated procurement quantities and benchmark unit costs for primary materials.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    Total Material: <span className="text-brand-700">{formatCurrency(totalMatCostPreview)}</span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    baseline?.plannedMaterial?.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    Status: {baseline?.plannedMaterial?.status === 'completed' ? 'Completed' : 'Draft / In Progress'}
                  </span>
                </div>
              </div>

              {/* Material Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Material Name</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3">Planned Qty</th>
                      <th className="py-2.5 px-3">Unit Rate (₹)</th>
                      <th className="py-2.5 px-3">Total Estimated (₹)</th>
                      <th className="py-2.5 px-3">Remarks / Spec</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {materialItems.map((item, idx) => {
                      const cost = (Number(item.plannedQuantity) || 0) * (Number(item.unitRate) || 0);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 font-semibold text-slate-900">{item.name}</td>
                          <td className="py-2 px-3 uppercase text-[11px] font-mono text-slate-600">{item.unit}</td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              disabled={isFrozen}
                              value={item.plannedQuantity}
                              onChange={(e) => handleUpdateMaterialItem(idx, 'plannedQuantity', Number(e.target.value) || 0)}
                              className="w-24 text-xs rounded border border-slate-300 p-1 text-right disabled:bg-slate-100 font-semibold"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              disabled={isFrozen}
                              value={item.unitRate}
                              onChange={(e) => handleUpdateMaterialItem(idx, 'unitRate', Number(e.target.value) || 0)}
                              className="w-24 text-xs rounded border border-slate-300 p-1 text-right disabled:bg-slate-100"
                            />
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900">{formatCurrency(cost)}</td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              disabled={isFrozen}
                              value={item.remarks || ''}
                              onChange={(e) => handleUpdateMaterialItem(idx, 'remarks', e.target.value)}
                              placeholder="brand / grade..."
                              className="w-full text-xs rounded border border-slate-300 p-1 disabled:bg-slate-100"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add Material Row Form */}
              {!isFrozen && (
                <form onSubmit={handleAddMaterial} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Add Material to Baseline</span>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        required
                        placeholder="Material name (e.g. Vitrified Floor Tiles)"
                        value={newMaterial.name}
                        onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                        className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Unit (sqft, MT, Nos)"
                        value={newMaterial.unit}
                        onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                        className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        required
                        placeholder="Quantity"
                        value={newMaterial.plannedQuantity}
                        onChange={(e) => setNewMaterial({ ...newMaterial, plannedQuantity: e.target.value })}
                        className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        required
                        placeholder="Rate (₹)"
                        value={newMaterial.unitRate}
                        onChange={(e) => setNewMaterial({ ...newMaterial, unitRate: e.target.value })}
                        className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                      />
                      <button
                        type="submit"
                        className="py-1.5 px-3 bg-brand-600 text-white rounded text-xs font-semibold hover:bg-brand-700 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {!isFrozen && (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveMaterials(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    disabled={saving || materialItems.length === 0}
                    onClick={() => handleSaveMaterials(true)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Mark Completed</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PLANNED LABOUR */}
          {activeTab === 'plannedLabour' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Planned Labour Gangs & Man-Days</h3>
                  <p className="text-xs text-slate-500">Allocate skilled and unskilled labor headcounts, daily wage rates, and planned man-day volumes.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    Total Labour: <span className="text-brand-700">{formatCurrency(totalLabCostPreview)}</span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    baseline?.plannedLabour?.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    Status: {baseline?.plannedLabour?.status === 'completed' ? 'Completed' : 'Draft / In Progress'}
                  </span>
                </div>
              </div>

              {/* Labour Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Labour Gang / Trade</th>
                      <th className="py-2.5 px-3">Headcount</th>
                      <th className="py-2.5 px-3">Rate/Day (₹)</th>
                      <th className="py-2.5 px-3">Planned Man-Days</th>
                      <th className="py-2.5 px-3">Total Estimated (₹)</th>
                      <th className="py-2.5 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {labourItems.map((item, idx) => {
                      const cost = (Number(item.plannedManDays) || 0) * (Number(item.ratePerDay) || 0);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 font-semibold text-slate-900">{item.trade}</td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              disabled={isFrozen}
                              value={item.headcount}
                              onChange={(e) => handleUpdateLabourItem(idx, 'headcount', Number(e.target.value) || 0)}
                              className="w-16 text-xs rounded border border-slate-300 p-1 text-center disabled:bg-slate-100"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              disabled={isFrozen}
                              value={item.ratePerDay}
                              onChange={(e) => handleUpdateLabourItem(idx, 'ratePerDay', Number(e.target.value) || 0)}
                              className="w-20 text-xs rounded border border-slate-300 p-1 text-right disabled:bg-slate-100"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              disabled={isFrozen}
                              value={item.plannedManDays}
                              onChange={(e) => handleUpdateLabourItem(idx, 'plannedManDays', Number(e.target.value) || 0)}
                              className="w-24 text-xs rounded border border-slate-300 p-1 text-right disabled:bg-slate-100 font-semibold"
                            />
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900">{formatCurrency(cost)}</td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              disabled={isFrozen}
                              value={item.remarks || ''}
                              onChange={(e) => handleUpdateLabourItem(idx, 'remarks', e.target.value)}
                              placeholder="scope or gang notes..."
                              className="w-full text-xs rounded border border-slate-300 p-1 disabled:bg-slate-100"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {!isFrozen && (
                <form onSubmit={handleAddLabour} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Add Trade Gang</span>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        required
                        placeholder="Trade name (e.g. Tile Layers / Painters)"
                        value={newLabour.trade}
                        onChange={(e) => setNewLabour({ ...newLabour, trade: e.target.value })}
                        className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Rate/Day (₹)"
                        value={newLabour.ratePerDay}
                        onChange={(e) => setNewLabour({ ...newLabour, ratePerDay: e.target.value })}
                        className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        required
                        placeholder="Planned Man-Days"
                        value={newLabour.plannedManDays}
                        onChange={(e) => setNewLabour({ ...newLabour, plannedManDays: e.target.value })}
                        className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white font-semibold"
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="w-full py-1.5 px-3 bg-brand-600 text-white rounded text-xs font-semibold hover:bg-brand-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Trade</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {!isFrozen && (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveLabour(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    disabled={saving || labourItems.length === 0}
                    onClick={() => handleSaveLabour(true)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Mark Completed</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PLANNED TIMELINE */}
          {activeTab === 'plannedTimeline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Project Milestone Baseline Schedule</h3>
                  <p className="text-xs text-slate-500">Lock construction execution start/finish dates, phase durations, and critical milestones.</p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  baseline?.plannedTimeline?.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  Status: {baseline?.plannedTimeline?.status === 'completed' ? 'Completed' : 'Draft / In Progress'}
                </span>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Baseline Start Date *</label>
                  <input
                    type="date"
                    disabled={isFrozen}
                    value={timelineForm.plannedStartDate}
                    onChange={(e) => setTimelineForm({ ...timelineForm, plannedStartDate: e.target.value })}
                    className="w-full text-xs rounded border border-slate-300 p-2 bg-white outline-none font-semibold disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Target Completion Date *</label>
                  <input
                    type="date"
                    disabled={isFrozen}
                    value={timelineForm.plannedCompletionDate}
                    onChange={(e) => setTimelineForm({ ...timelineForm, plannedCompletionDate: e.target.value })}
                    className="w-full text-xs rounded border border-slate-300 p-2 bg-white outline-none font-semibold disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Total Duration (Days)</label>
                  <input
                    type="number"
                    disabled={isFrozen}
                    value={timelineForm.totalDurationDays}
                    onChange={(e) => setTimelineForm({ ...timelineForm, totalDurationDays: e.target.value })}
                    className="w-full text-xs rounded border border-slate-300 p-2 bg-white outline-none disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* Milestones Schedule Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Milestone Phase</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3">Weightage (%)</th>
                      <th className="py-2.5 px-3">Deliverables & Scope</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {milestones.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 font-semibold text-slate-900">{m.name}</td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            disabled={isFrozen}
                            value={m.durationDays}
                            onChange={(e) => handleUpdateMilestone(idx, 'durationDays', Number(e.target.value) || 0)}
                            className="w-20 text-xs rounded border border-slate-300 p-1 text-center disabled:bg-slate-100"
                          />{' '}
                          days
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            disabled={isFrozen}
                            value={m.weightagePercent}
                            onChange={(e) => handleUpdateMilestone(idx, 'weightagePercent', Number(e.target.value) || 0)}
                            className="w-16 text-xs rounded border border-slate-300 p-1 text-center disabled:bg-slate-100 font-semibold"
                          />{' '}
                          %
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            disabled={isFrozen}
                            value={m.remarks || ''}
                            onChange={(e) => handleUpdateMilestone(idx, 'remarks', e.target.value)}
                            placeholder="deliverable notes..."
                            className="w-full text-xs rounded border border-slate-300 p-1 disabled:bg-slate-100"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!isFrozen && (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveTimeline(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    disabled={saving || !timelineForm.plannedStartDate || !timelineForm.plannedCompletionDate}
                    onClick={() => handleSaveTimeline(true)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Mark Completed</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PLANNED CASHFLOW & LOCK GATE */}
          {activeTab === 'plannedCashflow' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Projected Capital Cashflow Outflow</h3>
                  <p className="text-xs text-slate-500">Plan month-by-month financial disbursement tranches across materials, labor, and contractors.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-300">
                    Total Cashflow: {formatCurrency(cashflowItems.reduce((a, b) => a + (Number(b.totalOutflow) || 0), 0))}
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    baseline?.plannedCashflow?.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    Status: {baseline?.plannedCashflow?.status === 'completed' ? 'Completed' : 'Draft / In Progress'}
                  </span>
                </div>
              </div>

              {/* Cashflow Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Month Tranche</th>
                      <th className="py-2.5 px-3">Milestone Focus</th>
                      <th className="py-2.5 px-3">Material (₹)</th>
                      <th className="py-2.5 px-3">Labour (₹)</th>
                      <th className="py-2.5 px-3">Contractor (₹)</th>
                      <th className="py-2.5 px-3">Total Outflow (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cashflowItems.map((c, idx) => {
                      const totalOut =
                        (Number(c.materialOutflow) || 0) +
                        (Number(c.labourOutflow) || 0) +
                        (Number(c.contractorOutflow) || 0) +
                        (Number(c.miscOutflow) || 0);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 font-semibold text-slate-900">{c.monthLabel}</td>
                          <td className="py-2 px-3 text-slate-600">{c.targetMilestone || '—'}</td>
                          <td className="py-2 px-3">{formatCurrency(c.materialOutflow)}</td>
                          <td className="py-2 px-3">{formatCurrency(c.labourOutflow)}</td>
                          <td className="py-2 px-3">{formatCurrency(c.contractorOutflow)}</td>
                          <td className="py-2 px-3 font-bold text-emerald-800">{formatCurrency(totalOut)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {!isFrozen && (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveCashflow(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    disabled={saving || cashflowItems.length === 0}
                    onClick={() => handleSaveCashflow(true)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Mark Completed</span>
                  </button>
                </div>
              )}

              {/* Baseline Freeze Governance Gate */}
              <div className={`mt-6 p-5 rounded-2xl border-2 ${
                isFrozen
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-dashed border-brand-200 bg-brand-50/40'
              } space-y-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isFrozen ? (
                      <Lock className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Unlock className="w-5 h-5 text-amber-600" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {isFrozen ? 'Baseline Officially Frozen & Locked' : 'Stage 6 Baseline Governance Freeze Gate'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {isFrozen
                          ? 'Project scope and cost baselines are permanently locked. Post-lock alterations require a formal Change Order.'
                          : 'Requires all 4 baseline planning schedules (Material, Labour, Timeline, Cashflow) to be completed.'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    isFrozen
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : baseline?.status === 'baselineReview'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isFrozen ? 'Locked & Frozen' : baseline?.status === 'baselineReview' ? 'Under Review' : 'Open Baseline'}
                  </span>
                </div>

                {isFrozen ? (
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs text-slate-700 space-y-1">
                    <div>Locked by: <strong className="text-slate-900">{baseline?.baselineLock?.lockedBy?.name || 'Managing Director'}</strong></div>
                    <div>Locked at: <strong>{new Date(baseline?.baselineLock?.lockedAt).toLocaleString()}</strong></div>
                    <div>Sanction Notes: <em>{baseline?.baselineLock?.lockNotes || 'Executive baseline freeze sanction granted.'}</em></div>
                    <div className="text-emerald-700 font-bold mt-1">Project has officially advanced to Stage 7 (Execution)!</div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Baseline Review / Lock Authorization Note</label>
                      <textarea
                        rows={2}
                        value={lockNote}
                        onChange={(e) => setLockNote(e.target.value)}
                        placeholder="Enter executive review notes, budget sanction authorization, or freeze conditions..."
                        className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <span className="text-[11px] text-slate-500">
                        {allSectionsComplete
                          ? 'All 4 baseline schedules completed. Ready for executive baseline freeze.'
                          : 'Complete all 4 sections to enable formal baseline lock.'}
                      </span>

                      <div className="flex items-center gap-2">
                        {baseline?.status !== 'baselineReview' && (
                          <button
                            type="button"
                            disabled={saving || !allSectionsComplete}
                            onClick={handleRequestLock}
                            className="px-4 py-2 text-xs font-semibold text-brand-700 bg-brand-100 hover:bg-brand-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Request Review
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleLockBaseline('rejected')}
                          className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Reject
                        </button>

                        <button
                          type="button"
                          disabled={saving || !allSectionsComplete}
                          onClick={() => handleLockBaseline('approved')}
                          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Freeze & Lock Baseline</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Last updated: {baseline?.updatedAt ? new Date(baseline.updatedAt).toLocaleString() : '—'}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            Close Workspace
          </button>
        </div>
      </div>
    </div>
  , document.body);
}