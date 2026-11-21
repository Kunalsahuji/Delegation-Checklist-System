import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  IndianRupee,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { pmsPlotApi } from '../../../api/pmsPlotApi';
import { useToast } from '../../../context/ToastContext';

export default function FeasibilityDrawer({ isOpen, onClose, plot, onUpdated }) {
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);
  const [deciding, setDeciding] = useState(false);

  // Form State
  const [costs, setCosts] = useState({
    landCost: '',
    developmentCost: '',
    approvalCost: '',
    financeCost: '',
    otherCost: '',
  });

  const [projections, setProjections] = useState({
    expectedRevenue: '',
    paybackMonths: 18,
  });

  const [verdict, setVerdict] = useState('pending');
  const [conditions, setConditions] = useState('');
  const [feasibilityId, setFeasibilityId] = useState(null);

  useEffect(() => {
    if (plot) {
      const f = plot.feasibility;
      if (f) {
        setFeasibilityId(f._id || null);
        setCosts({
          landCost: f.costs?.landCost ? f.costs.landCost / 10000000 : '',
          developmentCost: f.costs?.developmentCost ? f.costs.developmentCost / 10000000 : '',
          approvalCost: f.costs?.approvalCost ? f.costs.approvalCost / 10000000 : '',
          financeCost: f.costs?.financeCost ? f.costs.financeCost / 10000000 : '',
          otherCost: f.costs?.otherCost ? f.costs.otherCost / 10000000 : '',
        });
        setProjections({
          expectedRevenue: f.projections?.expectedRevenue ? f.projections.expectedRevenue / 10000000 : '',
          paybackMonths: f.projections?.paybackMonths || 18,
        });
        setVerdict(f.verdict || 'pending');
        setConditions(f.conditions || '');
      } else {
        setFeasibilityId(null);
        setCosts({
          landCost: plot.expectedTotalPrice ? (plot.expectedTotalPrice / 10000000).toFixed(2) : '',
          developmentCost: '',
          approvalCost: '',
          financeCost: '',
          otherCost: '',
        });
        setProjections({
          expectedRevenue: '',
          paybackMonths: 18,
        });
        setVerdict('pending');
        setConditions('');
      }
    }
  }, [plot, isOpen]);

  if (!isOpen || !plot) return null;

  // Real-time calculation in Crores
  const land = Number(costs.landCost) || 0;
  const dev = Number(costs.developmentCost) || 0;
  const apprv = Number(costs.approvalCost) || 0;
  const fin = Number(costs.financeCost) || 0;
  const oth = Number(costs.otherCost) || 0;
  const totalCost = land + dev + apprv + fin + oth;

  const rev = Number(projections.expectedRevenue) || 0;
  const profit = rev - totalCost;
  const marginPct = rev > 0 ? ((profit / rev) * 100).toFixed(1) : 0;
  const roiPct = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(1) : 0;

  const handleSaveCalculation = async () => {
    try {
      setSaving(true);
      const payload = {
        costs: {
          landCost: land * 10000000,
          developmentCost: dev * 10000000,
          approvalCost: apprv * 10000000,
          financeCost: fin * 10000000,
          otherCost: oth * 10000000,
        },
        projections: {
          expectedRevenue: rev * 10000000,
          paybackMonths: Number(projections.paybackMonths) || 18,
        },
        verdict,
        conditions,
      };

      const res = await pmsPlotApi.saveFeasibility(plot._id, payload);
      if (res.success) {
        showSuccess('Financial feasibility calculations saved');
        if (res.data?._id) setFeasibilityId(res.data._id);
        onUpdated();
      }
    } catch (err) {
      showError(err.message || 'Failed to save feasibility');
    } finally {
      setSaving(false);
    }
  };

  const handleDecide = async (decisionVerdict) => {
    try {
      setDeciding(true);
      // Save first if not created
      const payload = {
        costs: {
          landCost: land * 10000000,
          developmentCost: dev * 10000000,
          approvalCost: apprv * 10000000,
          financeCost: fin * 10000000,
          otherCost: oth * 10000000,
        },
        projections: {
          expectedRevenue: rev * 10000000,
          paybackMonths: Number(projections.paybackMonths) || 18,
        },
        verdict: decisionVerdict,
        conditions,
      };

      const saveRes = await pmsPlotApi.saveFeasibility(plot._id, payload);
      const fId = saveRes.data?._id || feasibilityId;

      if (fId) {
        await pmsPlotApi.decideFeasibility(fId, {
          verdict: decisionVerdict,
          conditions,
        });
        showSuccess(
          decisionVerdict === 'notFeasible'
            ? 'Plot marked as Not Feasible (Rejected)'
            : 'Feasibility Approved! Stage 1 synced and plot package ready for Legal Verification.'
        );
        onUpdated();
        onClose();
      }
    } catch (err) {
      showError(err.message || 'Failed to finalize feasibility decision');
    } finally {
      setDeciding(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/75 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/60">
                  {plot.code}
                </span>
                <h2 className="text-base font-bold text-slate-900 truncate max-w-xs">{plot.title}</h2>
              </div>
              <p className="text-xs text-slate-500">
                Financial Feasibility Engine • Chained Stage 1 Output
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Plot Overview Card */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block">Project</span>
              <span className="font-bold text-slate-800 truncate block">
                {plot.project?.name || 'Associated Project'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Survey Number</span>
              <span className="font-mono font-semibold text-slate-800">{plot.surveyNumber || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Area</span>
              <span className="font-semibold text-slate-800">
                {plot.area?.value?.toLocaleString()} {plot.area?.unit}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Current Status</span>
              <span className="font-bold uppercase text-[10px] text-emerald-700">{plot.status}</span>
            </div>
          </div>

          {/* Section 1: Cost Inputs */}
          <div>
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-slate-500" />
                <span>1. Capital & Development Cost Breakdown (₹ Cr)</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-700">
                Total: ₹{totalCost.toFixed(2)} Cr
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Land Acquisition Cost (₹ Cr)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costs.landCost}
                  onChange={(e) => setCosts({ ...costs, landCost: e.target.value })}
                  placeholder="e.g. 17.50"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Civil & Infrastructure (₹ Cr)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costs.developmentCost}
                  onChange={(e) => setCosts({ ...costs, developmentCost: e.target.value })}
                  placeholder="e.g. 4.50"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Approvals & Sanctions (₹ Cr)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costs.approvalCost}
                  onChange={(e) => setCosts({ ...costs, approvalCost: e.target.value })}
                  placeholder="e.g. 0.65"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Finance & Interest Cost (₹ Cr)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costs.financeCost}
                  onChange={(e) => setCosts({ ...costs, financeCost: e.target.value })}
                  placeholder="e.g. 0.80"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Projections & Real-Time Ratios */}
          <div>
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. Revenue Projections & Financial Returns</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expected Gross Revenue (₹ Cr)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={projections.expectedRevenue}
                  onChange={(e) => setProjections({ ...projections, expectedRevenue: e.target.value })}
                  placeholder="e.g. 31.00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-semibold text-emerald-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payback Horizon (Months)</label>
                <input
                  type="number"
                  min="1"
                  value={projections.paybackMonths}
                  onChange={(e) => setProjections({ ...projections, paybackMonths: e.target.value })}
                  placeholder="18"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Metrics Display Grid */}
            <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-brand-50/50 rounded-xl border border-brand-200/60">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Net Profit</span>
                <span
                  className={`text-sm font-bold ${
                    profit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  ₹{profit.toFixed(2)} Cr
                </span>
              </div>
              <div className="text-center border-x border-brand-200/60">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Profit Margin</span>
                <span className="text-sm font-bold text-brand-700">{marginPct}%</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">ROI Returns</span>
                <span className="text-sm font-bold text-purple-700">{roiPct}%</span>
              </div>
            </div>
          </div>

          {/* Section 3: Verdict & Approval Gate Conditions */}
          <div>
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                <span>3. Acquisition Verdict & Conditions</span>
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Feasibility Verdict</label>
                <select
                  value={verdict}
                  onChange={(e) => setVerdict(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-brand-500 font-medium"
                >
                  <option value="pending">Pending Evaluation</option>
                  <option value="feasible">Feasible (Clear Acquisition Path)</option>
                  <option value="feasibleWithConditions">Feasible with Conditions</option>
                  <option value="notFeasible">Not Feasible (Drop Deal)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Conditions / Risk Mitigation Notes
                </label>
                <textarea
                  rows={2}
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  placeholder="e.g. Land acquisition conditional on road width clearance and title search report..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSaveCalculation}
            disabled={saving || deciding}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-100 font-semibold transition-colors cursor-pointer text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDecide('notFeasible')}
              disabled={deciding || saving}
              className="inline-flex items-center gap-1 px-3 py-2 border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg font-semibold transition-colors cursor-pointer text-xs"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject Deal</span>
            </button>
            <button
              type="button"
              onClick={() => handleDecide('feasible')}
              disabled={deciding || saving || profit <= 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors cursor-pointer text-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{deciding ? 'Approving...' : 'Approve Plot Package'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
