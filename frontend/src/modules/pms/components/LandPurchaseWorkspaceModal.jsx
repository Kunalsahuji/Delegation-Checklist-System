import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  BadgeDollarSign,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  Landmark,
  FileCheck,
  Stamp,
  Award,
  ArrowRight,
  TrendingUp,
  User,
  Plus,
  Send,
} from 'lucide-react';
import { pmsPurchaseApi } from '../../../api/pmsPurchaseApi';

const SECTIONS = [
  { key: 'negotiation', title: '1. Price Negotiation', icon: BadgeDollarSign },
  { key: 'priceApproval', title: '2. Price Sanction', icon: Award },
  { key: 'tokenPayment', title: '3. Token Advance', icon: Landmark },
  { key: 'saleAgreement', title: '4. Sale Agreement', icon: FileText },
  { key: 'registry', title: '5. Sub-Registrar Deed', icon: Stamp },
  { key: 'mutation', title: '6. Revenue Mutation', icon: FileCheck },
];

function formatCurrency(val) {
  if (!val || isNaN(val)) return '₹0';
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

export default function LandPurchaseWorkspaceModal({ purchaseId, onClose, onRefresh }) {
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('negotiation');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Negotiation round state
  const [offeredPrice, setOfferedPrice] = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  const [roundNote, setRoundNote] = useState('');

  // Price Approval state
  const [reqPrice, setReqPrice] = useState('');
  const [approvalNote, setApprovalNote] = useState('');

  useEffect(() => {
    if (purchaseId) loadPurchase();
  }, [purchaseId]);

  const loadPurchase = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await pmsPurchaseApi.getPurchaseById(purchaseId);
      if (res?.success) {
        setPurchase(res.data);
        if (SECTIONS.some((s) => s.key === res.data.status)) {
          setActiveTab(res.data.status);
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load purchase record');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRound = async (e) => {
    e.preventDefault();
    if (!offeredPrice && !counterPrice) {
      setErrorMsg('Enter at least an offered price or counter price');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      const res = await pmsPurchaseApi.updateSection(purchaseId, 'negotiation', {
        round: {
          offeredPrice: offeredPrice ? Number(offeredPrice) : null,
          counterPrice: counterPrice ? Number(counterPrice) : null,
          note: roundNote,
        },
      });
      if (res?.success) {
        setPurchase(res.data);
        setOfferedPrice('');
        setCounterPrice('');
        setRoundNote('');
        setSuccessMsg('Negotiation round recorded');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to record negotiation round');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSectionData = async (sectionKey, patch) => {
    try {
      const res = await pmsPurchaseApi.updateSection(purchaseId, sectionKey, patch);
      if (res?.success) {
        setPurchase(res.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Update failed');
    }
  };

  const handleCompleteSection = async (sectionKey) => {
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await pmsPurchaseApi.completeSection(purchaseId, sectionKey);
      if (res?.success) {
        setSuccessMsg(`Section "${sectionKey}" marked completed.`);
        await loadPurchase();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Section is incomplete. Ensure all required details are recorded.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestApproval = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await pmsPurchaseApi.requestApproval(purchaseId, {
        requestedPrice: Number(reqPrice) || purchase.negotiation?.finalPrice,
        note: approvalNote,
      });
      if (res?.success) {
        setSuccessMsg('Price sent for management approval.');
        await loadPurchase();
        setActiveTab('priceApproval');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Request failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDecidePrice = async (decision) => {
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await pmsPurchaseApi.decidePrice(purchaseId, {
        decision,
        approvedPrice: purchase.priceApproval?.requestedPrice,
        note: approvalNote,
      });
      if (res?.success) {
        setSuccessMsg(`Price decision: ${decision.toUpperCase()}`);
        await loadPurchase();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Price sanction failed');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalComplete = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await pmsPurchaseApi.completePurchase(purchaseId);
      if (res?.success) {
        setSuccessMsg('Land Purchase & Registry complete! Project advanced to Stage 4 (Project Planning).');
        await loadPurchase();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'All 6 sections must be completed before finalizing purchase.');
    } finally {
      setSaving(false);
    }
  };

  if (!purchaseId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
              <BadgeDollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  {purchase?.code || 'Loading...'}
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  {purchase?.plot?.title || 'Land Purchase Transaction'}
                </span>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${
                    purchase?.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {purchase?.status || 'Loading'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Project:{' '}
                <span className="font-medium text-slate-700">{purchase?.project?.name || '---'}</span> •
                Owner:{' '}
                <span className="font-medium text-slate-700">
                  {purchase?.ownerSnapshot?.name || 'Landowner'} ({purchase?.ownerSnapshot?.contact || '---'})
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Cost Pill */}
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Outlay</span>
              <span className="text-sm font-bold text-slate-900">{formatCurrency(purchase?.totalCost)}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 6-Section Stepper Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6 overflow-x-auto">
          {SECTIONS.map((sec) => {
            const isCompleted = purchase?.[sec.key]?.status === 'completed';
            const isActive = activeTab === sec.key;
            const Icon = sec.icon;

            return (
              <button
                key={sec.key}
                onClick={() => setActiveTab(sec.key)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-purple-600 text-purple-600 bg-purple-50/40'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                <span>{sec.title}</span>
                {isCompleted && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">Loading purchase details...</div>
          ) : (
            <>
              {/* SECTION 1: NEGOTIATION */}
              {activeTab === 'negotiation' && (
                <div className="space-y-5">
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                          Price Negotiation & Haggling Log
                        </h3>
                        <p className="text-xs text-slate-500">
                          Record commercial proposals, counter-offers, and settled deal price.
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg">
                        Agreed Price: {formatCurrency(purchase?.negotiation?.finalPrice)}
                      </span>
                    </div>

                    {/* Final Price Input */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Settled Final Price (₹)
                        </label>
                        <input
                          type="number"
                          defaultValue={purchase?.negotiation?.finalPrice || ''}
                          onBlur={(e) =>
                            handleUpdateSectionData('negotiation', {
                              finalPrice: Number(e.target.value),
                            })
                          }
                          placeholder="e.g. 172500000"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Date Terms Settled
                        </label>
                        <input
                          type="date"
                          defaultValue={
                            purchase?.negotiation?.agreedOn
                              ? new Date(purchase.negotiation.agreedOn).toISOString().split('T')[0]
                              : ''
                          }
                          onChange={(e) =>
                            handleUpdateSectionData('negotiation', {
                              agreedOn: e.target.value ? new Date(e.target.value) : null,
                            })
                          }
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* Negotiation History Log */}
                    <div className="border border-slate-100 rounded-lg overflow-hidden">
                      <div className="bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 border-b border-slate-100">
                        Negotiation Rounds History ({(purchase?.negotiation?.rounds || []).length})
                      </div>
                      <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                        {(purchase?.negotiation?.rounds || []).length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">
                            No negotiation rounds logged yet. Add initial round below.
                          </div>
                        ) : (
                          purchase.negotiation.rounds.map((round, idx) => (
                            <div key={idx} className="p-3 text-xs flex items-center justify-between">
                              <div className="space-y-0.5">
                                <div className="font-semibold text-slate-800">
                                  Round {idx + 1}: Offer {formatCurrency(round.offeredPrice)} ↔ Counter{' '}
                                  {formatCurrency(round.counterPrice)}
                                </div>
                                <div className="text-[11px] text-slate-500">{round.note || 'No note'}</div>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {new Date(round.at).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Add Round Form */}
                    <form onSubmit={handleAddRound} className="bg-slate-50 p-3.5 rounded-lg space-y-3">
                      <span className="text-xs font-semibold text-slate-700 block">Record New Round</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="number"
                          value={offeredPrice}
                          onChange={(e) => setOfferedPrice(e.target.value)}
                          placeholder="Our Offer (₹)"
                          className="text-xs px-2.5 py-1.5 rounded border border-slate-200 bg-white"
                        />
                        <input
                          type="number"
                          value={counterPrice}
                          onChange={(e) => setCounterPrice(e.target.value)}
                          placeholder="Owner Counter (₹)"
                          className="text-xs px-2.5 py-1.5 rounded border border-slate-200 bg-white"
                        />
                        <input
                          type="text"
                          value={roundNote}
                          onChange={(e) => setRoundNote(e.target.value)}
                          placeholder="Commercial remark / meeting note"
                          className="text-xs px-2.5 py-1.5 rounded border border-slate-200 bg-white"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded shadow-sm inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Log Round</span>
                      </button>
                    </form>

                    {purchase?.negotiation?.status !== 'completed' && (
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => handleCompleteSection('negotiation')}
                          disabled={saving}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Complete Negotiation</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 2: PRICE APPROVAL */}
              {activeTab === 'priceApproval' && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        Price Sanction & Management Gate
                      </h3>
                      <p className="text-xs text-slate-500">
                        Formal commercial authorisation required prior to issuing token advance.
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold uppercase ${
                        purchase?.priceApproval?.decision === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      Decision: {purchase?.priceApproval?.decision || 'Pending Sanction'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-slate-500 block">Requested Price</span>
                      <span className="text-lg font-bold text-slate-900">
                        {formatCurrency(purchase?.priceApproval?.requestedPrice || purchase?.negotiation?.finalPrice)}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Approved Price</span>
                      <span className="text-lg font-bold text-emerald-600">
                        {formatCurrency(purchase?.priceApproval?.approvedPrice)}
                      </span>
                    </div>
                  </div>

                  {purchase?.priceApproval?.decision !== 'approved' && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <label className="block text-xs font-semibold text-slate-700">
                        Management Sanction Note / Commercial Remarks
                      </label>
                      <textarea
                        rows={2}
                        value={approvalNote}
                        onChange={(e) => setApprovalNote(e.target.value)}
                        placeholder="Sanction note, rate justification, or renegotiation instructions..."
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDecidePrice('approved')}
                          disabled={saving}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Sanction & Approve Price</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecidePrice('rejected')}
                          disabled={saving}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                        >
                          <X className="w-4 h-4" />
                          <span>Send Back for Renegotiation</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 3: TOKEN ADVANCE */}
              {activeTab === 'tokenPayment' && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        Token Advance & Bayana Receipt
                      </h3>
                      <p className="text-xs text-slate-500">
                        Initial earnest money deposit to bind the landowner agreement.
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg">
                      Paid: {formatCurrency(purchase?.tokenPayment?.amount)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Token Amount (₹)
                      </label>
                      <input
                        type="number"
                        defaultValue={purchase?.tokenPayment?.amount || ''}
                        onBlur={(e) =>
                          handleUpdateSectionData('tokenPayment', { amount: Number(e.target.value) })
                        }
                        placeholder="e.g. 1000000"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Payment Date
                      </label>
                      <input
                        type="date"
                        defaultValue={
                          purchase?.tokenPayment?.paidOn
                            ? new Date(purchase.tokenPayment.paidOn).toISOString().split('T')[0]
                            : ''
                        }
                        onChange={(e) =>
                          handleUpdateSectionData('tokenPayment', {
                            paidOn: e.target.value ? new Date(e.target.value) : null,
                          })
                        }
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Payment Mode
                      </label>
                      <select
                        value={purchase?.tokenPayment?.mode || 'bankTransfer'}
                        onChange={(e) =>
                          handleUpdateSectionData('tokenPayment', { mode: e.target.value })
                        }
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="bankTransfer">RTGS / NEFT / IMPS</option>
                        <option value="cheque">Banker's Cheque</option>
                        <option value="dd">Demand Draft</option>
                        <option value="cash">Cash Voucher</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Transaction Reference / UTR
                      </label>
                      <input
                        type="text"
                        defaultValue={purchase?.tokenPayment?.reference || ''}
                        onBlur={(e) =>
                          handleUpdateSectionData('tokenPayment', { reference: e.target.value })
                        }
                        placeholder="UTR or Cheque No."
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Bank & Branch
                      </label>
                      <input
                        type="text"
                        defaultValue={purchase?.tokenPayment?.bank || ''}
                        onBlur={(e) =>
                          handleUpdateSectionData('tokenPayment', { bank: e.target.value })
                        }
                        placeholder="e.g. HDFC Bank Corporate A/c"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Disbursed By (Officer)
                      </label>
                      <input
                        type="text"
                        defaultValue={purchase?.tokenPayment?.paidBy || ''}
                        onBlur={(e) =>
                          handleUpdateSectionData('tokenPayment', { paidBy: e.target.value })
                        }
                        placeholder="Name of payer officer"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                      />
                    </div>
                  </div>

                  {purchase?.tokenPayment?.status !== 'completed' && (
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => handleCompleteSection('tokenPayment')}
                        disabled={saving}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete Token Advance</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 4: SALE AGREEMENT */}
              {activeTab === 'saleAgreement' && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        Formal Sale Agreement (Ikranama)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Bilateral contract of sale, payment schedule milestones, and validity window.
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg">
                      Agreement Value: {formatCurrency(purchase?.saleAgreement?.agreementValue)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Agreement Number
                      </label>
                      <input
                        type="text"
                        defaultValue={purchase?.saleAgreement?.agreementNo || ''}
                        onBlur={(e) =>
                          handleUpdateSectionData('saleAgreement', { agreementNo: e.target.value })
                        }
                        placeholder="e.g. SA-2026/001"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Agreement Date
                      </label>
                      <input
                        type="date"
                        defaultValue={
                          purchase?.saleAgreement?.agreementDate
                            ? new Date(purchase.saleAgreement.agreementDate).toISOString().split('T')[0]
                            : ''
                        }
                        onChange={(e) =>
                          handleUpdateSectionData('saleAgreement', {
                            agreementDate: e.target.value ? new Date(e.target.value) : null,
                          })
                        }
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Contract Value (₹)
                      </label>
                      <input
                        type="number"
                        defaultValue={purchase?.saleAgreement?.agreementValue || ''}
                        onBlur={(e) =>
                          handleUpdateSectionData('saleAgreement', {
                            agreementValue: Number(e.target.value),
                          })
                        }
                        placeholder="e.g. 172500000"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Valid Until (Registry Deadline)
                      </label>
                      <input
                        type="date"
                        defaultValue={
                          purchase?.saleAgreement?.validUntil
                            ? new Date(purchase.saleAgreement.validUntil).toISOString().split('T')[0]
                            : ''
                        }
                        onChange={(e) =>
                          handleUpdateSectionData('saleAgreement', {
                            validUntil: e.target.value ? new Date(e.target.value) : null,
                          })
                        }
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Vetted by Legal Counsel
                      </label>
                      <input
                        type="text"
                        defaultValue={purchase?.saleAgreement?.verifiedBy || ''}
                        onBlur={(e) =>
                          handleUpdateSectionData('saleAgreement', { verifiedBy: e.target.value })
                        }
                        placeholder="Counsel Name"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                      />
                    </div>
                  </div>

                  {purchase?.saleAgreement?.status !== 'completed' && (
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => handleCompleteSection('saleAgreement')}
                        disabled={saving}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete Sale Agreement</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 5: REGISTRY DEED */}
              {activeTab === 'registry' && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        Sub-Registrar Registered Sale Deed
                      </h3>
                      <p className="text-xs text-slate-500">
                        Government registry book entry, stamp duty, and registration charges.
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg">
                      Deed: {purchase?.registry?.registryNo || 'Pending'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Registry Deed Number
                      </label>
                      <input
                        type="text"
                        defaultValue={purchase?.registry?.registryNo || ''}
                        onBlur={(e) =>
                          handleUpdateSectionData('registry', { registryNo: e.target.value })
                        }
                        placeholder="e.g. REG/2026/4412"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Registry Date
                      </label>
                      <input
                        type="date"
                        defaultValue={
                          purchase?.registry?.registryDate
                            ? new Date(purchase.registry.registryDate).toISOString().split('T')[0]
                            : ''
                        }
                        onChange={(e) =>
                          handleUpdateSectionData('registry', {
                            registryDate: e.target.value ? new Date(e.target.value) : null,
                          })
                        }
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Registrar Office Jurisdiction
                      </label>
                      <input
                        type="text"
                        defaultValue={purchase?.registry?.registrarOffice || ''}
                        onBlur={(e) =>
                          handleUpdateSectionData('registry', { registrarOffice: e.target.value })
                        }
                        placeholder="e.g. Sub-Registrar Office II, Jaipur"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Stamp Duty Paid (₹)
                      </label>
                      <input
                        type="number"
                        defaultValue={purchase?.registry?.stampDuty || ''}
                        onBlur={(e) =>
                          handleUpdateSectionData('registry', { stampDuty: Number(e.target.value) })
                        }
                        placeholder="e.g. 10350000"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Registration Fee Paid (₹)
                      </label>
                      <input
                        type="number"
                        defaultValue={purchase?.registry?.registrationFee || ''}
                        onBlur={(e) =>
                          handleUpdateSectionData('registry', {
                            registrationFee: Number(e.target.value),
                          })
                        }
                        placeholder="e.g. 1725000"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  {purchase?.registry?.status !== 'completed' && (
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => handleCompleteSection('registry')}
                        disabled={saving}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete Registry Deed</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 6: REVENUE MUTATION */}
              {activeTab === 'mutation' && (
                <div className="space-y-5">
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                          Tehsil / JDA Revenue Mutation (Dakhil Kharij)
                        </h3>
                        <p className="text-xs text-slate-500">
                          Official transfer of land title in revenue Jamabandi records to developer.
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg">
                        Mutation No: {purchase?.mutation?.mutationNo || 'Pending'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Mutation Order Number
                        </label>
                        <input
                          type="text"
                          defaultValue={purchase?.mutation?.mutationNo || ''}
                          onBlur={(e) =>
                            handleUpdateSectionData('mutation', { mutationNo: e.target.value })
                          }
                          placeholder="e.g. MUT/2026/JDA/88219"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Revenue Authority
                        </label>
                        <input
                          type="text"
                          defaultValue={purchase?.mutation?.authority || ''}
                          onBlur={(e) =>
                            handleUpdateSectionData('mutation', { authority: e.target.value })
                          }
                          placeholder="e.g. Jaipur Development Authority Zone 7"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Date Applied
                        </label>
                        <input
                          type="date"
                          defaultValue={
                            purchase?.mutation?.appliedOn
                              ? new Date(purchase.mutation.appliedOn).toISOString().split('T')[0]
                              : ''
                          }
                          onChange={(e) =>
                            handleUpdateSectionData('mutation', {
                              appliedOn: e.target.value ? new Date(e.target.value) : null,
                            })
                          }
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Date Mutation Order Passed
                        </label>
                        <input
                          type="date"
                          defaultValue={
                            purchase?.mutation?.completedOn
                              ? new Date(purchase.mutation.completedOn).toISOString().split('T')[0]
                              : ''
                          }
                          onChange={(e) =>
                            handleUpdateSectionData('mutation', {
                              completedOn: e.target.value ? new Date(e.target.value) : null,
                            })
                          }
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                        />
                      </div>
                    </div>

                    {purchase?.mutation?.status !== 'completed' && (
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => handleCompleteSection('mutation')}
                          disabled={saving}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Complete Revenue Mutation</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* FINAL STAGE 3 SIGN-OFF BANNER */}
                  <div className="bg-slate-900 text-white rounded-xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>Stage 3 Completion Gate (Advance to Project Planning)</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Clears Stage 3 (Land Purchase & Registry) on the project master rail and advances project to Stage 4.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleFinalComplete}
                      disabled={saving || purchase?.status === 'completed'}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow flex items-center gap-2 shrink-0 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{purchase?.status === 'completed' ? 'Purchase Completed' : 'Finalize Purchase & Advance'}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
