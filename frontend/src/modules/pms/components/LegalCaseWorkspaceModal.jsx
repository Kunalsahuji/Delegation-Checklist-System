import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import {
  X,
  Scale,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  FileText,
  UserCheck,
  Briefcase,
  AlertCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Award,
  Stamp,
} from 'lucide-react';
import { pmsLegalApi } from '../../../api/pmsLegalApi';

const SECTIONS = [
  { key: 'titleVerification', title: '1. Title Verification', icon: Scale },
  { key: 'encumbranceCheck', title: '2. Encumbrance Check', icon: ShieldCheck },
  { key: 'documentVerification', title: '3. Document Completeness', icon: FileCheck2 },
  { key: 'legalOpinion', title: '4. Legal Opinion & Gate', icon: Stamp },
];

export default function LegalCaseWorkspaceModal({ caseId, onClose, onRefresh }) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const [legalCase, setLegalCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('titleVerification');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Decision Gate state
  const [decision, setDecision] = useState('');
  const [decisionNote, setDecisionNote] = useState('');
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    if (caseId) loadCase();
  }, [caseId]);

  const loadCase = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await pmsLegalApi.getLegalCaseById(caseId);
      if (res?.success) {
        setLegalCase(res.data);
        // Default tab to current incomplete section
        if (res.data.status === 'titleVerification') setActiveTab('titleVerification');
        else if (res.data.status === 'encumbranceCheck') setActiveTab('encumbranceCheck');
        else if (res.data.status === 'documentVerification') setActiveTab('documentVerification');
        else setActiveTab('legalOpinion');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load legal case details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItemStatus = async (sectionKey, itemKey, newStatus) => {
    const section = legalCase[sectionKey];
    const updatedItems = (section.items || []).map((item) =>
      item.key === itemKey ? { ...item, status: newStatus } : item
    );

    try {
      const res = await pmsLegalApi.updateSection(caseId, sectionKey, { items: updatedItems });
      if (res?.success) {
        setLegalCase(res.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update item finding');
    }
  };

  const handleUpdateItemAnswer = async (itemKey, answer) => {
    const updatedItems = (legalCase.documentVerification?.items || []).map((item) =>
      item.key === itemKey ? { ...item, answer, remarks: answer === 'yes' ? '' : item.remarks } : item
    );

    try {
      const res = await pmsLegalApi.updateSection(caseId, 'documentVerification', { items: updatedItems });
      if (res?.success) {
        setLegalCase(res.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update document availability');
    }
  };

  const handleUpdateItemRemarks = async (sectionKey, itemKey, remarks) => {
    const section = legalCase[sectionKey];
    const updatedItems = (section.items || []).map((item) =>
      item.key === itemKey ? { ...item, remarks } : item
    );

    try {
      const res = await pmsLegalApi.updateSection(caseId, sectionKey, { items: updatedItems });
      if (res?.success) {
        setLegalCase(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteSection = async (sectionKey) => {
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await pmsLegalApi.completeSection(caseId, sectionKey);
      if (res?.success) {
        setSuccessMsg(`Section "${sectionKey}" marked completed successfully.`);
        await loadCase();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Could not complete section. Ensure all items are satisfied.');
    } finally {
      setSaving(false);
    }
  };

  const handleDecide = async (selectedDecision) => {
    setDeciding(true);
    setErrorMsg('');
    try {
      const res = await pmsLegalApi.decide(caseId, {
        decision: selectedDecision,
        note: decisionNote,
      });
      if (res?.success) {
        setSuccessMsg(`Legal case ${selectedDecision.toUpperCase()} successfully.`);
        await loadCase();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Decision submission failed');
    } finally {
      setDeciding(false);
    }
  };

  if (!caseId) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-6xl h-[92vh] max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  {legalCase?.code || 'Loading...'}
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  {legalCase?.plot?.title || 'Land Plot Legal Verification'}
                </span>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${
                    legalCase?.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : legalCase?.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {legalCase?.status || 'Loading'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Project:{' '}
                <span className="font-medium text-slate-700">{legalCase?.project?.name || '---'}</span> •
                Survey No:{' '}
                <span className="font-medium text-slate-700">
                  {legalCase?.plot?.surveyNumber || 'Unassigned'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Risk Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                legalCase?.risk?.level === 'high'
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : legalCase?.risk?.level === 'medium'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Risk: {(legalCase?.risk?.level || 'Low').toUpperCase()}</span>
              <span className="opacity-70">({legalCase?.risk?.score || 0}/100)</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4-Section Stepper Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6 overflow-x-auto">
          {SECTIONS.map((sec) => {
            const isCompleted = legalCase?.[sec.key]?.status === 'completed';
            const isActive = activeTab === sec.key;
            const Icon = sec.icon;

            return (
              <button
                key={sec.key}
                onClick={() => setActiveTab(sec.key)}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
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
            <div className="p-12 text-center text-slate-500 text-sm">Loading legal case data...</div>
          ) : (
            <>
              {/* SECTION 1: TITLE VERIFICATION */}
              {activeTab === 'titleVerification' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        Title Verification Checklist
                      </h3>
                      <p className="text-xs text-slate-500">
                        Verify revenue ownership, 30-year chain of title, and Jamabandi mutation records.
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        legalCase?.titleVerification?.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Status: {legalCase?.titleVerification?.status || 'pending'}
                    </span>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="py-2.5 px-4 font-semibold">Verification Parameter</th>
                          <th className="py-2.5 px-4 font-semibold">Finding</th>
                          <th className="py-2.5 px-4 font-semibold">Remarks / Revenue Reference</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(legalCase?.titleVerification?.items || []).map((item) => (
                          <tr key={item.key} className="hover:bg-slate-50/60">
                            <td className="py-3 px-4 font-medium text-slate-800">{item.label}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                {['verified', 'rejected', 'na'].map((st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() =>
                                      handleUpdateItemStatus('titleVerification', item.key, st)
                                    }
                                    className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                                      item.status === st
                                        ? st === 'verified'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                  >
                                    {st.toUpperCase()}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                defaultValue={item.remarks}
                                onBlur={(e) =>
                                  handleUpdateItemRemarks('titleVerification', item.key, e.target.value)
                                }
                                placeholder="Enter inspection remarks or deed number..."
                                className="w-full text-xs px-2.5 py-1 rounded border border-slate-200 focus:outline-none focus:border-indigo-500"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {legalCase?.titleVerification?.status !== 'completed' && (
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => handleCompleteSection('titleVerification')}
                        disabled={saving}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete Title Verification</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 2: ENCUMBRANCE CHECK */}
              {activeTab === 'encumbranceCheck' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        Encumbrance & Legal Disputes Check
                      </h3>
                      <p className="text-xs text-slate-500">
                        Sub-Registrar encumbrance certificate, pending bank mortgages, litigation, and acquisitions.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-600">Risk Level:</span>
                      <select
                        value={legalCase?.encumbranceCheck?.riskLevel || 'low'}
                        onChange={async (e) => {
                          const res = await pmsLegalApi.updateSection(caseId, 'encumbranceCheck', {
                            riskLevel: e.target.value,
                          });
                          if (res?.success) setLegalCase(res.data);
                        }}
                        className="text-xs font-semibold px-2.5 py-1 rounded border border-slate-300 bg-white text-slate-700"
                      >
                        <option value="low">Low Risk</option>
                        <option value="medium">Medium Risk</option>
                        <option value="high">High Risk</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="py-2.5 px-4 font-semibold">Encumbrance Item</th>
                          <th className="py-2.5 px-4 font-semibold">Assessment</th>
                          <th className="py-2.5 px-4 font-semibold">Remarks & Certificates</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(legalCase?.encumbranceCheck?.items || []).map((item) => (
                          <tr key={item.key} className="hover:bg-slate-50/60">
                            <td className="py-3 px-4 font-medium text-slate-800">{item.label}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                {['clear', 'issueFound', 'na'].map((st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() =>
                                      handleUpdateItemStatus('encumbranceCheck', item.key, st)
                                    }
                                    className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                                      item.status === st
                                        ? st === 'clear'
                                          ? 'bg-emerald-600 text-white border-emerald-600'
                                          : st === 'issueFound'
                                          ? 'bg-rose-600 text-white border-rose-600'
                                          : 'bg-slate-700 text-white border-slate-700'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                  >
                                    {st === 'clear' ? 'CLEAR' : st === 'issueFound' ? 'ISSUE FOUND' : 'N/A'}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                defaultValue={item.remarks}
                                onBlur={(e) =>
                                  handleUpdateItemRemarks('encumbranceCheck', item.key, e.target.value)
                                }
                                placeholder="Certificate dates, case numbers, or NOC details..."
                                className="w-full text-xs px-2.5 py-1 rounded border border-slate-200 focus:outline-none focus:border-indigo-500"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {legalCase?.encumbranceCheck?.status !== 'completed' && (
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => handleCompleteSection('encumbranceCheck')}
                        disabled={saving}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete Encumbrance Check</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 3: DOCUMENT VERIFICATION */}
              {activeTab === 'documentVerification' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        Document Completeness Repository
                      </h3>
                      <p className="text-xs text-slate-500">
                        Confirm physical or digital custody of title documents. Single Yes/No per document.
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        legalCase?.documentVerification?.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Status: {legalCase?.documentVerification?.status || 'pending'}
                    </span>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="py-2.5 px-4 font-semibold">Document Name</th>
                          <th className="py-2.5 px-4 font-semibold">Available in Custody?</th>
                          <th className="py-2.5 px-4 font-semibold">Reason / Custody Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(legalCase?.documentVerification?.items || []).map((item) => (
                          <tr key={item.key} className="hover:bg-slate-50/60">
                            <td className="py-3 px-4 font-medium text-slate-800">{item.label}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemAnswer(item.key, 'yes')}
                                  className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
                                    item.answer === 'yes'
                                      ? 'bg-emerald-600 text-white border-emerald-600'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  YES
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemAnswer(item.key, 'no')}
                                  className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
                                    item.answer === 'no'
                                      ? 'bg-rose-600 text-white border-rose-600'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  NO
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                defaultValue={item.remarks}
                                onBlur={(e) =>
                                  handleUpdateItemRemarks('documentVerification', item.key, e.target.value)
                                }
                                placeholder={
                                  item.answer === 'no'
                                    ? 'Mandatory reason why document is unavailable...'
                                    : 'Original received / certified copy details'
                                }
                                className={`w-full text-xs px-2.5 py-1 rounded border focus:outline-none ${
                                  item.answer === 'no' && !item.remarks
                                    ? 'border-rose-300 bg-rose-50/30'
                                    : 'border-slate-200 focus:border-indigo-500'
                                }`}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {legalCase?.documentVerification?.status !== 'completed' && (
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => handleCompleteSection('documentVerification')}
                        disabled={saving}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete Document Verification</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 4: LEGAL OPINION & DECISION GATE */}
              {activeTab === 'legalOpinion' && (
                <div className="space-y-6">
                  {/* Advocate Form */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                          Advocate Title Opinion & Recommendation
                        </h3>
                        <p className="text-xs text-slate-500">
                          Formal legal search report and binding title opinion by assigned counsel.
                        </p>
                      </div>
                      <span className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-medium">
                        Counsel: {legalCase?.lawyer?.name || 'In-House Legal Team'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Counsel Recommendation
                        </label>
                        <select
                          value={legalCase?.legalOpinion?.recommendation || 'proceed'}
                          onChange={async (e) => {
                            const res = await pmsLegalApi.updateSection(caseId, 'legalOpinion', {
                              recommendation: e.target.value,
                            });
                            if (res?.success) setLegalCase(res.data);
                          }}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="proceed">Proceed (Title is Clean & Marketable)</option>
                          <option value="proceedWithConditions">Proceed With Conditions</option>
                          <option value="doNotProceed">Do Not Proceed (Title Defective / Disputed)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Risk Category
                        </label>
                        <select
                          value={legalCase?.legalOpinion?.riskCategory || 'low'}
                          onChange={async (e) => {
                            const res = await pmsLegalApi.updateSection(caseId, 'legalOpinion', {
                              riskCategory: e.target.value,
                            });
                            if (res?.success) setLegalCase(res.data);
                          }}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="low">Low Risk</option>
                          <option value="medium">Medium Risk</option>
                          <option value="high">High Risk</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Detailed Legal Search Opinion
                      </label>
                      <textarea
                        rows={3}
                        defaultValue={legalCase?.legalOpinion?.opinion || ''}
                        onBlur={async (e) => {
                          const res = await pmsLegalApi.updateSection(caseId, 'legalOpinion', {
                            opinion: e.target.value,
                          });
                          if (res?.success) setLegalCase(res.data);
                        }}
                        placeholder="Detail the 30-year search findings, mutation authenticity, and any conditions for sale deed registry..."
                        className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Digital Signature (Typed Full Name)
                        </label>
                        <input
                          type="text"
                          defaultValue={legalCase?.legalOpinion?.signature || ''}
                          onBlur={async (e) => {
                            const res = await pmsLegalApi.updateSection(caseId, 'legalOpinion', {
                              signature: e.target.value,
                            });
                            if (res?.success) setLegalCase(res.data);
                          }}
                          placeholder="Adv. First Last"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 font-serif italic"
                        />
                      </div>
                      <div className="flex items-end justify-end">
                        {legalCase?.legalOpinion?.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleCompleteSection('legalOpinion')}
                            disabled={saving}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                          >
                            <Stamp className="w-4 h-4" />
                            <span>Sign & Complete Opinion</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PM / Management Decision Gate */}
                  <div className="bg-slate-900 text-white rounded-xl p-5 shadow-lg space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-400" />
                        <h4 className="text-sm font-semibold">Stage 2 Approval Gate (Management)</h4>
                      </div>
                      <span className="text-xs text-slate-400">
                        Approving marks Stage 2 completed and advances project to Stage 3 (Land Purchase)
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Decision Note / Justification
                      </label>
                      <textarea
                        rows={2}
                        value={decisionNote}
                        onChange={(e) => setDecisionNote(e.target.value)}
                        placeholder="Required justification if approving a high risk case or recording reasons for rejection/clarification..."
                        className="w-full text-xs p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDecide('approved')}
                          disabled={deciding || legalCase?.status === 'approved'}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve Title & Advance to Stage 3</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDecide('clarificationNeeded')}
                          disabled={deciding}
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow flex items-center gap-1.5"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <span>Request Clarification</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDecide('rejected')}
                          disabled={deciding}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow flex items-center gap-1.5"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject Case</span>
                        </button>
                      </div>

                      {legalCase?.approval?.decision && (
                        <div className="text-xs text-right">
                          <p className="text-slate-400">
                            Last Decision:{' '}
                            <span className="font-semibold text-emerald-400 uppercase">
                              {legalCase.approval.decision}
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-500">
                            By {legalCase.approval?.decidedBy?.name || 'Administrator'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  , document.body);
}