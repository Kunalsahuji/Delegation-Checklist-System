import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  PieChart,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Send,
  Building,
  Save,
  Check,
  ShieldCheck,
  IndianRupee,
  Layers,
  FileCheck2,
  TrendingUp,
} from 'lucide-react';
import { pmsFinanceApi } from '../../../api/pmsFinanceApi';

const SECTIONS = [
  { key: 'budgetVsActual', title: '1. Budget vs Actual', icon: FileSpreadsheet },
  { key: 'vendorPayments', title: '2. Vendor Invoices', icon: Receipt },
  { key: 'contractorPayments', title: '3. Contractor RA Bills', icon: CreditCard },
  { key: 'costAndProfit', title: '4. Project P&L & Profit', icon: PieChart },
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

export default function FinanceWorkspaceModal({ recordId, onClose, onRefresh }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('budgetVsActual');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Budget vs Actual State
  const [bvaData, setBvaData] = useState({
    budgetedRevenue: 0,
    actualRevenueCollected: 0,
    budgetedExpenditure: 0,
    actualExpenditure: 0,
  });

  // 2. Vendor Payments State
  const [invoices, setInvoices] = useState([]);
  const [newInvoice, setNewInvoice] = useState({
    invoiceNumber: '',
    poNumber: '',
    vendorName: '',
    grossAmount: '',
    gstAmount: '',
    tdsAmount: '',
    retentionAmount: 0,
    paymentMode: 'bankTransfer',
    status: 'Pending',
  });

  // 3. Contractor RA Bills State
  const [raBills, setRaBills] = useState([]);
  const [newRaBill, setNewRaBill] = useState({
    billNumber: '',
    contractorName: 'Apex Civil Infra & RCC Contractors',
    trade: 'Civil, RCC & Footings',
    workOrderRef: '',
    billPeriod: '',
    currentBilled: '',
    retentionDeduction: '',
    advanceRecovery: 0,
    engineerCertifier: 'Er. Sandeep Rathore',
    paymentStatus: 'Draft',
  });

  // 4. Cost and Profit State
  const [pnlData, setPnlData] = useState({
    landCost: 0,
    developmentCost: 0,
    approvalsCost: 0,
    procurementCost: 0,
    labourCost: 0,
    overheadsAndMisc: 0,
    projectedRevenue: 0,
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
      const res = await pmsFinanceApi.getRecordById(recordId);
      const data = res?.data || res;
      setRecord(data);
      if (data?.budgetVsActual) {
        setBvaData({
          budgetedRevenue: data.budgetVsActual.budgetedRevenue || 0,
          actualRevenueCollected: data.budgetVsActual.actualRevenueCollected || 0,
          budgetedExpenditure: data.budgetVsActual.budgetedExpenditure || 0,
          actualExpenditure: data.budgetVsActual.actualExpenditure || 0,
        });
      }
      if (data?.vendorPayments?.invoices) setInvoices(data.vendorPayments.invoices);
      if (data?.contractorPayments?.raBills) setRaBills(data.contractorPayments.raBills);
      if (data?.costAndProfit) {
        setPnlData({
          landCost: data.costAndProfit.landCost || 0,
          developmentCost: data.costAndProfit.developmentCost || 0,
          approvalsCost: data.costAndProfit.approvalsCost || 0,
          procurementCost: data.costAndProfit.procurementCost || 0,
          labourCost: data.costAndProfit.labourCost || 0,
          overheadsAndMisc: data.costAndProfit.overheadsAndMisc || 0,
          projectedRevenue: data.costAndProfit.projectedRevenue || 0,
        });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load record');
    } finally {
      setLoading(false);
    }
  };

  // Save Budget vs Actual
  const handleSaveBva = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await pmsFinanceApi.updateSection(record._id, 'budgetVsActual', bvaData);
      const data = res?.data || res;
      setRecord(data);
      setSuccessMsg('Budget vs Actual metrics updated');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update Budget vs Actual');
    } finally {
      setSaving(false);
    }
  };

  // Add Vendor Invoice
  const handleAddInvoice = async (e) => {
    e.preventDefault();
    if (!newInvoice.invoiceNumber.trim() || !newInvoice.vendorName.trim() || !newInvoice.grossAmount) {
      setErrorMsg('Invoice Number, Vendor Name, and Gross Amount are required');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const gross = Number(newInvoice.grossAmount);
      const gst = Number(newInvoice.gstAmount || 0);
      const tds = Number(newInvoice.tdsAmount || 0);
      const ret = Number(newInvoice.retentionAmount || 0);
      const netPayable = gross + gst - tds - ret;

      const updatedList = [
        ...invoices,
        {
          ...newInvoice,
          grossAmount: gross,
          gstAmount: gst,
          tdsAmount: tds,
          retentionAmount: ret,
          netPayable,
          invoiceDate: new Date(),
        },
      ];
      const res = await pmsFinanceApi.updateSection(record._id, 'vendorPayments', {
        invoices: updatedList,
      });
      const data = res?.data || res;
      setRecord(data);
      setInvoices(data?.vendorPayments?.invoices || updatedList);
      setNewInvoice({
        invoiceNumber: '',
        poNumber: '',
        vendorName: '',
        grossAmount: '',
        gstAmount: '',
        tdsAmount: '',
        retentionAmount: 0,
        paymentMode: 'bankTransfer',
        status: 'Pending',
      });
      setSuccessMsg('Vendor invoice added to ledger');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to add invoice');
    } finally {
      setSaving(false);
    }
  };

  // Add Contractor RA Bill
  const handleAddRaBill = async (e) => {
    e.preventDefault();
    if (!newRaBill.billNumber.trim() || !newRaBill.contractorName.trim() || !newRaBill.currentBilled) {
      setErrorMsg('Bill Number, Contractor Name, and Current Billed Value are required');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const curr = Number(newRaBill.currentBilled);
      const ret = Number(newRaBill.retentionDeduction || 0);
      const adv = Number(newRaBill.advanceRecovery || 0);
      const netPayable = curr - ret - adv;

      const updatedList = [
        ...raBills,
        {
          ...newRaBill,
          currentBilled: curr,
          retentionDeduction: ret,
          advanceRecovery: adv,
          netCertifiedPayable: netPayable,
          certifiedWorkValue: curr,
        },
      ];
      const res = await pmsFinanceApi.updateSection(record._id, 'contractorPayments', {
        raBills: updatedList,
      });
      const data = res?.data || res;
      setRecord(data);
      setRaBills(data?.contractorPayments?.raBills || updatedList);
      setNewRaBill({
        billNumber: '',
        contractorName: 'Apex Civil Infra & RCC Contractors',
        trade: 'Civil, RCC & Footings',
        workOrderRef: '',
        billPeriod: '',
        currentBilled: '',
        retentionDeduction: '',
        advanceRecovery: 0,
        engineerCertifier: 'Er. Sandeep Rathore',
        paymentStatus: 'Draft',
      });
      setSuccessMsg('Contractor RA bill created');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to add RA bill');
    } finally {
      setSaving(false);
    }
  };

  // Save Cost and Profit Breakdown
  const handleSavePnl = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await pmsFinanceApi.updateSection(record._id, 'costAndProfit', pnlData);
      const data = res?.data || res;
      setRecord(data);
      setSuccessMsg('P&L cost and profit breakdown updated');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update P&L breakdown');
    } finally {
      setSaving(false);
    }
  };

  // Complete Section
  const handleCompleteSection = async (sectionKey) => {
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await pmsFinanceApi.completeSection(record._id, sectionKey, 'Reconciled and certified by Financial Controller');
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
      const res = await pmsFinanceApi.requestApproval(record._id);
      const data = res?.data || res;
      setRecord(data);
      setSuccessMsg('Submitted for Final Finance Sign-off Review');
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
      const res = await pmsFinanceApi.decideApproval(record._id, {
        decision,
        reason: approvalNote || (decision === 'approved' ? 'Stage 11 Finance & Cost certified and approved' : 'Reconciliation revisions requested'),
      });
      const data = res?.data || res;
      setRecord(data);
      setSuccessMsg(`Stage 11 Finance ${decision.toUpperCase()} successfully!`);
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <IndianRupee className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold tracking-tight">
                  Stage 11 • Finance Management & Contractor Billing
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-emerald-500/30 text-emerald-100 border border-emerald-300/30">
                  {record?.code || 'FIN'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                    record?.status === 'approved'
                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'
                      : record?.status === 'approvalPending'
                      ? 'bg-blue-500/30 text-blue-200 border border-blue-400/30'
                      : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'
                  }`}
                >
                  {record?.status || 'activeAccounting'}
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                Project: {record?.project?.name} ({record?.project?.code}) • Stage Order: {record?.project?.stageOrder || 11}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {record?.status === 'approved' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-100 text-xs font-medium rounded-lg border border-emerald-400/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                Ledger Certified
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
            <p className="text-slate-500 font-medium">Disbursements Paid</p>
            <p className="text-base font-bold text-emerald-700 mt-0.5">{formatCurrency(record?.totalDisbursements || 0)}</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <p className="text-slate-500 font-medium">Pending Payouts</p>
            <p className="text-base font-bold text-amber-700 mt-0.5">{formatCurrency(record?.pendingDisbursements || 0)}</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <p className="text-slate-500 font-medium">RA Certified Value</p>
            <p className="text-base font-bold text-slate-800 mt-0.5">{formatCurrency(record?.totalRaCertifiedAmount || 0)}</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <p className="text-slate-500 font-medium">Net Project Profit</p>
            <p className="text-base font-bold text-blue-700 mt-0.5">{formatCurrency(record?.costAndProfit?.netProjectProfit || 0)}</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <p className="text-slate-500 font-medium">Profit Margin %</p>
            <p className="text-base font-bold text-emerald-700 mt-0.5">{record?.costAndProfit?.profitMarginPercent || 0}%</p>
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
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
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
              <Clock className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs font-medium">Loading Finance Workspace...</p>
            </div>
          ) : (
            <div>
              {/* TAB 1: BUDGET VS ACTUAL */}
              {activeTab === 'budgetVsActual' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Budget vs Actual Revenue & Capital Inflow</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Track gross revenue targets, customer collections, and committed development expenditure.
                      </p>
                    </div>
                    {record?.status !== 'approved' && (
                      <button
                        onClick={() => handleCompleteSection('budgetVsActual')}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark Budget Complete
                      </button>
                    )}
                  </div>

                  <form
                    onSubmit={handleSaveBva}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4"
                  >
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Revenue & Expense Ledger
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Budgeted Gross Sales Revenue (₹)</label>
                        <input
                          type="number"
                          value={bvaData.budgetedRevenue}
                          onChange={(e) => setBvaData({ ...bvaData, budgetedRevenue: e.target.value })}
                          className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Actual Revenue Realized / Collected (₹)</label>
                        <input
                          type="number"
                          value={bvaData.actualRevenueCollected}
                          onChange={(e) => setBvaData({ ...bvaData, actualRevenueCollected: e.target.value })}
                          className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Budgeted Total Expenditure (₹)</label>
                        <input
                          type="number"
                          value={bvaData.budgetedExpenditure}
                          onChange={(e) => setBvaData({ ...bvaData, budgetedExpenditure: e.target.value })}
                          className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Actual Total Expenditure Incurred (₹)</label>
                        <input
                          type="number"
                          value={bvaData.actualExpenditure}
                          onChange={(e) => setBvaData({ ...bvaData, actualExpenditure: e.target.value })}
                          className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Budget Analysis'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: VENDOR PAYMENTS */}
              {activeTab === 'vendorPayments' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Vendor Invoices & Payment Register</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Track material supplier bills, GST, TDS withholdings, and bank settlement proofs.
                      </p>
                    </div>
                    {record?.status !== 'approved' && (
                      <button
                        onClick={() => handleCompleteSection('vendorPayments')}
                        disabled={saving || invoices.length === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark Vendor Payments Complete
                      </button>
                    )}
                  </div>

                  {/* Add Invoice Form */}
                  {record?.status !== 'approved' && (
                    <form
                      onSubmit={handleAddInvoice}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
                    >
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-600" /> Enter Vendor Invoice
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Invoice Number</label>
                          <input
                            type="text"
                            placeholder="INV-001"
                            value={newInvoice.invoiceNumber}
                            onChange={(e) => setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">PO Number</label>
                          <input
                            type="text"
                            placeholder="PO-001"
                            value={newInvoice.poNumber}
                            onChange={(e) => setNewInvoice({ ...newInvoice, poNumber: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Vendor Name</label>
                          <input
                            type="text"
                            placeholder="Ultratech / Tata Steel"
                            value={newInvoice.vendorName}
                            onChange={(e) => setNewInvoice({ ...newInvoice, vendorName: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Gross Bill ₹</label>
                          <input
                            type="number"
                            placeholder="Gross amount"
                            value={newInvoice.grossAmount}
                            onChange={(e) => setNewInvoice({ ...newInvoice, grossAmount: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">GST Amount ₹</label>
                          <input
                            type="number"
                            placeholder="18% GST"
                            value={newInvoice.gstAmount}
                            onChange={(e) => setNewInvoice({ ...newInvoice, gstAmount: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">TDS Deduction (2%) ₹</label>
                          <input
                            type="number"
                            placeholder="TDS amount"
                            value={newInvoice.tdsAmount}
                            onChange={(e) => setNewInvoice({ ...newInvoice, tdsAmount: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Payment Status</label>
                          <select
                            value={newInvoice.status}
                            onChange={(e) => setNewInvoice({ ...newInvoice, status: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Verified">Verified</option>
                            <option value="Approved">Approved</option>
                            <option value="Paid">Paid</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Add Vendor Invoice'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Invoices Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <th className="py-2.5 px-4">Invoice & PO</th>
                          <th className="py-2.5 px-4">Vendor</th>
                          <th className="py-2.5 px-4 text-right">Gross Amount</th>
                          <th className="py-2.5 px-4 text-right">GST / TDS</th>
                          <th className="py-2.5 px-4 text-right">Net Payable</th>
                          <th className="py-2.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoices.map((inv, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition">
                            <td className="py-2.5 px-4">
                              <span className="font-bold text-slate-800 block">{inv.invoiceNumber}</span>
                              <span className="text-[11px] text-slate-500">{inv.poNumber}</span>
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-slate-700">{inv.vendorName}</td>
                            <td className="py-2.5 px-4 text-right text-slate-700">{formatCurrency(inv.grossAmount)}</td>
                            <td className="py-2.5 px-4 text-right text-slate-500 text-[11px]">
                              +{formatCurrency(inv.gstAmount)} / -{formatCurrency(inv.tdsAmount)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatCurrency(inv.netPayable)}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  inv.status === 'Paid'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: CONTRACTOR RA BILLS */}
              {activeTab === 'contractorPayments' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Contractor Running Account (RA) Billing</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Process engineer-certified progress billings, retention reserves, and subcontractor disbursements.
                      </p>
                    </div>
                    {record?.status !== 'approved' && (
                      <button
                        onClick={() => handleCompleteSection('contractorPayments')}
                        disabled={saving || raBills.length === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark RA Billing Complete
                      </button>
                    )}
                  </div>

                  {/* Add RA Bill Form */}
                  {record?.status !== 'approved' && (
                    <form
                      onSubmit={handleAddRaBill}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
                    >
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-600" /> Log Running Account (RA) Bill
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Bill Number</label>
                          <input
                            type="text"
                            placeholder="e.g. RA-03"
                            value={newRaBill.billNumber}
                            onChange={(e) => setNewRaBill({ ...newRaBill, billNumber: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Contractor Name</label>
                          <input
                            type="text"
                            value={newRaBill.contractorName}
                            onChange={(e) => setNewRaBill({ ...newRaBill, contractorName: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Trade / Work Package</label>
                          <input
                            type="text"
                            value={newRaBill.trade}
                            onChange={(e) => setNewRaBill({ ...newRaBill, trade: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Certified Work Value (₹)</label>
                          <input
                            type="number"
                            placeholder="Current certified"
                            value={newRaBill.currentBilled}
                            onChange={(e) => setNewRaBill({ ...newRaBill, currentBilled: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Retention Deduction (5%) ₹</label>
                          <input
                            type="number"
                            placeholder="Retention deposit"
                            value={newRaBill.retentionDeduction}
                            onChange={(e) => setNewRaBill({ ...newRaBill, retentionDeduction: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Advance Recovery ₹</label>
                          <input
                            type="number"
                            placeholder="Mobilize advance recovery"
                            value={newRaBill.advanceRecovery}
                            onChange={(e) => setNewRaBill({ ...newRaBill, advanceRecovery: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Payment Status</label>
                          <select
                            value={newRaBill.paymentStatus}
                            onChange={(e) => setNewRaBill({ ...newRaBill, paymentStatus: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="Draft">Draft</option>
                            <option value="Certified">Certified</option>
                            <option value="PaymentApproved">Payment Approved</option>
                            <option value="Settled">Settled</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Add RA Bill'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* RA Bills Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <th className="py-2.5 px-4">Bill No & Trade</th>
                          <th className="py-2.5 px-4">Contractor</th>
                          <th className="py-2.5 px-4 text-right">Certified Value</th>
                          <th className="py-2.5 px-4 text-right">Deductions (Ret / Adv)</th>
                          <th className="py-2.5 px-4 text-right">Net Payable</th>
                          <th className="py-2.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {raBills.map((b, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition">
                            <td className="py-2.5 px-4">
                              <span className="font-bold text-slate-800 block">{b.billNumber}</span>
                              <span className="text-[11px] text-slate-500">{b.trade}</span>
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-slate-700">{b.contractorName}</td>
                            <td className="py-2.5 px-4 text-right text-slate-700">{formatCurrency(b.certifiedWorkValue)}</td>
                            <td className="py-2.5 px-4 text-right text-slate-500 text-[11px]">
                              -{formatCurrency(b.retentionDeduction)} / -{formatCurrency(b.advanceRecovery)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatCurrency(b.netCertifiedPayable)}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  b.paymentStatus === 'Settled'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}
                              >
                                {b.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: COST AND PROFIT */}
              {activeTab === 'costAndProfit' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Project P&L and Profitability Statement</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Consolidated capitalized cost of project, sales realizations, and net margin return.
                      </p>
                    </div>
                    {record?.status !== 'approved' && (
                      <button
                        onClick={() => handleCompleteSection('costAndProfit')}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark P&L Complete
                      </button>
                    )}
                  </div>

                  <form
                    onSubmit={handleSavePnl}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Land Acquisition Cost (₹)</label>
                        <input
                          type="number"
                          value={pnlData.landCost}
                          onChange={(e) => setPnlData({ ...pnlData, landCost: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Site Infrastructure & Dev (₹)</label>
                        <input
                          type="number"
                          value={pnlData.developmentCost}
                          onChange={(e) => setPnlData({ ...pnlData, developmentCost: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Regulatory Approvals & Fees (₹)</label>
                        <input
                          type="number"
                          value={pnlData.approvalsCost}
                          onChange={(e) => setPnlData({ ...pnlData, approvalsCost: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Materials & Procurement (₹)</label>
                        <input
                          type="number"
                          value={pnlData.procurementCost}
                          onChange={(e) => setPnlData({ ...pnlData, procurementCost: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Contractor & Labour Payouts (₹)</label>
                        <input
                          type="number"
                          value={pnlData.labourCost}
                          onChange={(e) => setPnlData({ ...pnlData, labourCost: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Projected Gross Revenue (₹)</label>
                        <input
                          type="number"
                          value={pnlData.projectedRevenue}
                          onChange={(e) => setPnlData({ ...pnlData, projectedRevenue: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Recalculate Profit Margin'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Decision & Sign-off Bar */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">
              Stage 11 Status: <strong className="text-slate-800 uppercase">{record?.status}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {record?.status === 'activeAccounting' && (
              <button
                onClick={handleRequestApproval}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                Submit for Finance Review
              </button>
            )}

            {record?.status === 'approvalPending' && (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Finance approval notes..."
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
                  Approve Stage 11
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
