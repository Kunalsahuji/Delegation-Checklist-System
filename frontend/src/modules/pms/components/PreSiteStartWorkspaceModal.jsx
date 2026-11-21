import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  BadgePercent,
  FileSignature,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Send,
  Building,
  Save,
  Check,
  Zap,
  Droplets,
  Warehouse,
  Shield,
  Phone,
  Mail,
} from 'lucide-react';
import { pmsPreSiteApi } from '../../../api/pmsPreSiteApi';

const SECTIONS = [
  { key: 'contractorSelection', title: '1. Contractor Selection', icon: UserCheck },
  { key: 'rateFinalization', title: '2. Rate Finalization', icon: BadgePercent },
  { key: 'workOrder', title: '3. WO / Agreement', icon: FileSignature },
  { key: 'siteSetup', title: '4. Site Mobilization', icon: Truck },
];

function formatCurrency(val) {
  if (!val || isNaN(val)) return '₹0';
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

export default function PreSiteStartWorkspaceModal({ recordId, onClose, onRefresh }) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contractorSelection');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Contractor Selection State
  const [contractorForm, setContractorForm] = useState({
    contractorName: '',
    companyName: '',
    trade: 'general',
    contactPerson: '',
    phone: '',
    email: '',
    gstNumber: '',
    panNumber: '',
    selectionDate: '',
    experienceYears: 5,
    remarks: '',
  });

  // 2. Rate Finalization State
  const [contractType, setContractType] = useState('itemRate');
  const [rateItems, setRateItems] = useState([]);
  const [newRateItem, setNewRateItem] = useState({
    itemDescription: '',
    unit: 'cum',
    tenderRate: '',
    agreedRate: '',
    remarks: '',
  });

  // 3. Work Order State
  const [woForm, setWoForm] = useState({
    workOrderNumber: '',
    issueDate: '',
    contractValue: '',
    advanceAmount: '',
    retentionPercent: 5,
    completionMonths: 12,
    paymentTerms: '',
    remarks: '',
  });

  // 4. Site Setup State
  const [siteSetupForm, setSiteSetupForm] = useState({
    siteEngineerName: '',
    siteEngineerContact: '',
    waterReady: false,
    waterNotes: '',
    powerReady: false,
    powerNotes: '',
    barricadeReady: false,
    barricadeNotes: '',
    officeReady: false,
    officeNotes: '',
    godownReady: false,
    godownNotes: '',
    setupTargetDate: '',
    setupCompletedDate: '',
    remarks: '',
  });

  // Management approval form
  const [approvalNote, setApprovalNote] = useState('');

  useEffect(() => {
    if (recordId) loadRecord();
  }, [recordId]);

  const loadRecord = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await pmsPreSiteApi.getRecordById(recordId);
      if (res?.success) {
        const data = res.data;
        setRecord(data);

        // Populate Contractor
        if (data.contractorSelection) {
          setContractorForm({
            contractorName: data.contractorSelection.contractorName || '',
            companyName: data.contractorSelection.companyName || '',
            trade: data.contractorSelection.trade || 'general',
            contactPerson: data.contractorSelection.contactPerson || '',
            phone: data.contractorSelection.phone || '',
            email: data.contractorSelection.email || '',
            gstNumber: data.contractorSelection.gstNumber || '',
            panNumber: data.contractorSelection.panNumber || '',
            selectionDate: data.contractorSelection.selectionDate ? data.contractorSelection.selectionDate.split('T')[0] : '',
            experienceYears: data.contractorSelection.experienceYears || 5,
            remarks: data.contractorSelection.remarks || '',
          });
        }

        // Populate Rates
        if (data.rateFinalization) {
          setContractType(data.rateFinalization.contractType || 'itemRate');
          setRateItems(data.rateFinalization.items || []);
        }

        // Populate Work Order
        if (data.workOrder) {
          setWoForm({
            workOrderNumber: data.workOrder.workOrderNumber || '',
            issueDate: data.workOrder.issueDate ? data.workOrder.issueDate.split('T')[0] : '',
            contractValue: data.workOrder.contractValue || '',
            advanceAmount: data.workOrder.advanceAmount || '',
            retentionPercent: data.workOrder.retentionPercent ?? 5,
            completionMonths: data.workOrder.completionMonths || 12,
            paymentTerms: data.workOrder.paymentTerms || '',
            remarks: data.workOrder.remarks || '',
          });
        }

        // Populate Site Setup
        if (data.siteSetup) {
          setSiteSetupForm({
            siteEngineerName: data.siteSetup.siteEngineerName || '',
            siteEngineerContact: data.siteSetup.siteEngineerContact || '',
            waterReady: Boolean(data.siteSetup.waterConnection?.ready),
            waterNotes: data.siteSetup.waterConnection?.notes || '',
            powerReady: Boolean(data.siteSetup.powerConnection?.ready),
            powerNotes: data.siteSetup.powerConnection?.notes || '',
            barricadeReady: Boolean(data.siteSetup.barricading?.ready),
            barricadeNotes: data.siteSetup.barricading?.notes || '',
            officeReady: Boolean(data.siteSetup.siteOffice?.ready),
            officeNotes: data.siteSetup.siteOffice?.notes || '',
            godownReady: Boolean(data.siteSetup.storageGodown?.ready),
            godownNotes: data.siteSetup.storageGodown?.notes || '',
            setupTargetDate: data.siteSetup.setupTargetDate ? data.siteSetup.setupTargetDate.split('T')[0] : '',
            setupCompletedDate: data.siteSetup.setupCompletedDate ? data.siteSetup.setupCompletedDate.split('T')[0] : '',
            remarks: data.siteSetup.remarks || '',
          });
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load pre-site record');
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

  // Section Save Handlers
  const handleSaveContractor = async (complete = false) => {
    setSaving(true);
    try {
      const payload = {
        contractorName: contractorForm.contractorName,
        companyName: contractorForm.companyName,
        trade: contractorForm.trade,
        contactPerson: contractorForm.contactPerson,
        phone: contractorForm.phone,
        email: contractorForm.email,
        gstNumber: contractorForm.gstNumber,
        panNumber: contractorForm.panNumber,
        selectionDate: contractorForm.selectionDate || null,
        experienceYears: Number(contractorForm.experienceYears) || 0,
        remarks: contractorForm.remarks,
      };

      const res = await pmsPreSiteApi.updateSection(recordId, 'contractorSelection', payload);
      if (res?.success) {
        if (complete) {
          const compRes = await pmsPreSiteApi.completeSection(recordId, 'contractorSelection');
          setRecord(compRes.data);
          showNotification('Contractor selection finalized');
          setActiveTab('rateFinalization');
        } else {
          setRecord(res.data);
          showNotification('Contractor details saved');
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save contractor details', true);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRateItem = (index, field, value) => {
    setRateItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddRateItem = (e) => {
    e.preventDefault();
    if (!newRateItem.itemDescription.trim() || !newRateItem.agreedRate) {
      showNotification('Item description and agreed rate are required', true);
      return;
    }
    setRateItems((prev) => [
      ...prev,
      {
        itemDescription: newRateItem.itemDescription,
        unit: newRateItem.unit,
        tenderRate: Number(newRateItem.tenderRate) || 0,
        agreedRate: Number(newRateItem.agreedRate) || 0,
        remarks: newRateItem.remarks,
      },
    ]);
    setNewRateItem({
      itemDescription: '',
      unit: 'cum',
      tenderRate: '',
      agreedRate: '',
      remarks: '',
    });
  };

  const handleSaveRates = async (complete = false) => {
    setSaving(true);
    try {
      const payload = {
        contractType,
        items: rateItems,
      };

      const res = await pmsPreSiteApi.updateSection(recordId, 'rateFinalization', payload);
      if (res?.success) {
        if (complete) {
          const compRes = await pmsPreSiteApi.completeSection(recordId, 'rateFinalization');
          setRecord(compRes.data);
          showNotification('Rate schedule completed');
          setActiveTab('workOrder');
        } else {
          setRecord(res.data);
          showNotification('Rate schedule saved');
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save rate schedule', true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWorkOrder = async (complete = false) => {
    setSaving(true);
    try {
      const payload = {
        workOrderNumber: woForm.workOrderNumber,
        issueDate: woForm.issueDate || null,
        contractValue: Number(woForm.contractValue) || 0,
        advanceAmount: Number(woForm.advanceAmount) || 0,
        retentionPercent: Number(woForm.retentionPercent) || 5,
        completionMonths: Number(woForm.completionMonths) || 12,
        paymentTerms: woForm.paymentTerms,
        remarks: woForm.remarks,
      };

      const res = await pmsPreSiteApi.updateSection(recordId, 'workOrder', payload);
      if (res?.success) {
        if (complete) {
          const compRes = await pmsPreSiteApi.completeSection(recordId, 'workOrder');
          setRecord(compRes.data);
          showNotification('Work order agreement finalized');
          setActiveTab('siteSetup');
        } else {
          setRecord(res.data);
          showNotification('Work order saved');
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save work order', true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSiteSetup = async (complete = false) => {
    setSaving(true);
    try {
      const payload = {
        siteEngineerName: siteSetupForm.siteEngineerName,
        siteEngineerContact: siteSetupForm.siteEngineerContact,
        waterConnection: { ready: siteSetupForm.waterReady, notes: siteSetupForm.waterNotes },
        powerConnection: { ready: siteSetupForm.powerReady, notes: siteSetupForm.powerNotes },
        barricading: { ready: siteSetupForm.barricadeReady, notes: siteSetupForm.barricadeNotes },
        siteOffice: { ready: siteSetupForm.officeReady, notes: siteSetupForm.officeNotes },
        storageGodown: { ready: siteSetupForm.godownReady, notes: siteSetupForm.godownNotes },
        setupTargetDate: siteSetupForm.setupTargetDate || null,
        setupCompletedDate: siteSetupForm.setupCompletedDate || null,
        remarks: siteSetupForm.remarks,
      };

      const res = await pmsPreSiteApi.updateSection(recordId, 'siteSetup', payload);
      if (res?.success) {
        if (complete) {
          const compRes = await pmsPreSiteApi.completeSection(recordId, 'siteSetup');
          setRecord(compRes.data);
          showNotification('Site setup and mobilization marked completed');
        } else {
          setRecord(res.data);
          showNotification('Site mobilization details saved');
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save site setup', true);
    } finally {
      setSaving(false);
    }
  };

  const handleRequestApproval = async () => {
    setSaving(true);
    try {
      const res = await pmsPreSiteApi.requestApproval(recordId, { note: approvalNote });
      if (res?.success) {
        setRecord(res.data);
        showNotification('Submitted for management sign-off');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to submit approval request', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDecideApproval = async (decision) => {
    setSaving(true);
    try {
      const res = await pmsPreSiteApi.decideApproval(recordId, {
        decision,
        note: approvalNote || (decision === 'approved' ? 'Site mobilization and WO approved' : 'Returned for renegotiation'),
      });
      if (res?.success) {
        setRecord(res.data);
        showNotification(`Stage 5 ${decision === 'approved' ? 'Approved & Advanced to Stage 6' : 'Rejected'}`);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Approval decision failed', true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-hidden animate-in fade-in duration-150">
        <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading Stage 5 Pre-Site Workspace...</p>
        </div>
      </div>
    );
  }

  const allSectionsComplete = SECTIONS.every((s) => record?.[s.key]?.status === 'completed');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] max-h-[95vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-400/30">
                {record?.code || 'PSS-000000'}
              </span>
              <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                Stage 5: Pre-Site Start & Contractor Selection
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              {record?.project?.name || 'Pre-Site Start Workspace'}
            </h2>
            <div className="text-xs text-slate-300 mt-0.5 flex items-center gap-3">
              <span>Contractor: <strong className="text-white">{record?.contractorSelection?.contractorName || 'Pending Selection'}</strong></span>
              <span>•</span>
              <span>Work Order Value: <strong className="text-emerald-300">{formatCurrency(record?.workOrder?.contractValue || woForm.contractValue)}</strong></span>
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
            const isCompleted = record?.[sec.key]?.status === 'completed';
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
          {/* TAB 1: CONTRACTOR SELECTION */}
          {activeTab === 'contractorSelection' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Contractor & Vendor Selection</h3>
                  <p className="text-xs text-slate-500">Record selected civil infrastructure partner, company credentials, and primary points of contact.</p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  record?.contractorSelection?.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  Status: {record?.contractorSelection?.status === 'completed' ? 'Completed' : 'Draft / In Progress'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Contractor / Agency Name *</label>
                  <input
                    type="text"
                    required
                    value={contractorForm.contractorName}
                    onChange={(e) => setContractorForm({ ...contractorForm, contractorName: e.target.value })}
                    placeholder="e.g. Shree Balaji Infra Projects"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Trade Specialization</label>
                  <select
                    value={contractorForm.trade}
                    onChange={(e) => setContractorForm({ ...contractorForm, trade: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none capitalize bg-white"
                  >
                    <option value="civil">Civil & Structural</option>
                    <option value="infrastructure">Infrastructure & Roads</option>
                    <option value="earthwork">Earthwork & Excavation</option>
                    <option value="electrical">Electrical & Substation</option>
                    <option value="plumbing">Plumbing & Drainage</option>
                    <option value="general">General Construction</option>
                    <option value="landscaping">Horticulture & Landscape</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Selection / Award Date</label>
                  <input
                    type="date"
                    value={contractorForm.selectionDate}
                    onChange={(e) => setContractorForm({ ...contractorForm, selectionDate: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Primary Contact Person</label>
                  <input
                    type="text"
                    value={contractorForm.contactPerson}
                    onChange={(e) => setContractorForm({ ...contractorForm, contactPerson: e.target.value })}
                    placeholder="e.g. Er. Mahendra Choudhary"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    value={contractorForm.phone}
                    onChange={(e) => setContractorForm({ ...contractorForm, phone: e.target.value })}
                    placeholder="+91 98290 12345"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={contractorForm.email}
                    onChange={(e) => setContractorForm({ ...contractorForm, email: e.target.value })}
                    placeholder="contracts@agency.in"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={contractorForm.gstNumber}
                    onChange={(e) => setContractorForm({ ...contractorForm, gstNumber: e.target.value.toUpperCase() })}
                    placeholder="08AABCB1234F1Z8"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={contractorForm.panNumber}
                    onChange={(e) => setContractorForm({ ...contractorForm, panNumber: e.target.value.toUpperCase() })}
                    placeholder="AABCB1234F"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Years of Relevant Experience</label>
                  <input
                    type="number"
                    min="0"
                    value={contractorForm.experienceYears}
                    onChange={(e) => setContractorForm({ ...contractorForm, experienceYears: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Selection Committee Remarks & Notes</label>
                <textarea
                  rows={2}
                  value={contractorForm.remarks}
                  onChange={(e) => setContractorForm({ ...contractorForm, remarks: e.target.value })}
                  placeholder="Evaluation of track record, past projects completed in region, and capacity..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveContractor(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveContractor(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Complete Contractor Selection</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: RATE FINALIZATION */}
          {activeTab === 'rateFinalization' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Rate Schedule & Unit Rate Finalization</h3>
                  <p className="text-xs text-slate-500">Negotiate and bind unit execution rates against CPWD / tender benchmark schedules.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    Negotiated Savings: {formatCurrency(record?.rateFinalization?.negotiatedSavings || 0)}
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    record?.rateFinalization?.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    Status: {record?.rateFinalization?.status === 'completed' ? 'Completed' : 'Draft / In Progress'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="text-xs font-semibold text-slate-700">Contract Engagement Type:</label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  className="text-xs rounded border border-slate-300 p-1.5 bg-white font-medium"
                >
                  <option value="itemRate">Item Rate Contract (Unit Schedule)</option>
                  <option value="lumpSum">Lump Sum Fixed Price</option>
                  <option value="percentageRate">Percentage Rate (Above/Below DSR)</option>
                  <option value="turnkey">Turnkey EPC Agreement</option>
                </select>
              </div>

              {/* Rate Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3">Tender Rate (₹)</th>
                      <th className="py-2.5 px-3">Agreed Rate (₹)</th>
                      <th className="py-2.5 px-3">Variance</th>
                      <th className="py-2.5 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rateItems.map((item, idx) => {
                      const diff = (Number(item.tenderRate) || 0) - (Number(item.agreedRate) || 0);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 font-semibold text-slate-800">{item.itemDescription}</td>
                          <td className="py-2 px-3 uppercase text-[11px] font-mono">{item.unit}</td>
                          <td className="py-2 px-3 text-slate-600">
                            <input
                              type="number"
                              value={item.tenderRate}
                              onChange={(e) => handleUpdateRateItem(idx, 'tenderRate', Number(e.target.value) || 0)}
                              className="w-24 text-xs rounded border border-slate-300 p-1 text-right"
                            />
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900">
                            <input
                              type="number"
                              value={item.agreedRate}
                              onChange={(e) => handleUpdateRateItem(idx, 'agreedRate', Number(e.target.value) || 0)}
                              className="w-24 text-xs rounded border border-emerald-300 p-1 text-right bg-emerald-50/40 text-emerald-800 font-bold"
                            />
                          </td>
                          <td className="py-2 px-3 text-[11px]">
                            {diff > 0 ? (
                              <span className="text-emerald-700 font-bold">-₹{diff} (Saved)</span>
                            ) : diff < 0 ? (
                              <span className="text-rose-700 font-bold">+₹{Math.abs(diff)} (Over)</span>
                            ) : (
                              <span className="text-slate-400">At tender</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.remarks || ''}
                              onChange={(e) => handleUpdateRateItem(idx, 'remarks', e.target.value)}
                              placeholder="e.g. Inclusive of lead/lift"
                              className="w-full text-xs rounded border border-slate-300 p-1"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add Custom Rate Item */}
              <form onSubmit={handleAddRateItem} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Add Item to Schedule</span>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Item description (e.g. Kerb stones laying)"
                      value={newRateItem.itemDescription}
                      onChange={(e) => setNewRateItem({ ...newRateItem, itemDescription: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Unit (rmt, cum, sqm)"
                      value={newRateItem.unit}
                      onChange={(e) => setNewRateItem({ ...newRateItem, unit: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      required
                      placeholder="Agreed Rate (₹)"
                      value={newRateItem.agreedRate}
                      onChange={(e) => setNewRateItem({ ...newRateItem, agreedRate: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="w-full py-1.5 px-3 bg-brand-600 text-white rounded text-xs font-semibold hover:bg-brand-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item</span>
                    </button>
                  </div>
                </div>
              </form>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveRates(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={saving || rateItems.length === 0}
                  onClick={() => handleSaveRates(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Complete Rate Finalization</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: WORK ORDER / AGREEMENT */}
          {activeTab === 'workOrder' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Work Order (WO) & Commercial Contract</h3>
                  <p className="text-xs text-slate-500">Formally issue and bind commercial contract value, advance terms, and completion schedule.</p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  record?.workOrder?.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  Status: {record?.workOrder?.status === 'completed' ? 'Completed' : 'Draft / In Progress'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Work Order Number *</label>
                  <input
                    type="text"
                    required
                    value={woForm.workOrderNumber}
                    onChange={(e) => setWoForm({ ...woForm, workOrderNumber: e.target.value })}
                    placeholder="e.g. WO-PRJ-2026-001"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date of Issuance</label>
                  <input
                    type="date"
                    value={woForm.issueDate}
                    onChange={(e) => setWoForm({ ...woForm, issueDate: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Contract Duration (Months)</label>
                  <input
                    type="number"
                    min="1"
                    value={woForm.completionMonths}
                    onChange={(e) => setWoForm({ ...woForm, completionMonths: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Total Contract Value (₹) *</label>
                  <input
                    type="number"
                    required
                    value={woForm.contractValue}
                    onChange={(e) => setWoForm({ ...woForm, contractValue: e.target.value })}
                    placeholder="e.g. 25000000"
                    className="w-full text-xs rounded-lg border border-emerald-300 p-2 outline-none font-bold text-emerald-800 bg-emerald-50/30"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Formatted: <strong className="text-emerald-700">{formatCurrency(woForm.contractValue)}</strong>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mobilization Advance (₹)</label>
                  <input
                    type="number"
                    value={woForm.advanceAmount}
                    onChange={(e) => setWoForm({ ...woForm, advanceAmount: e.target.value })}
                    placeholder="e.g. 1250000"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none font-semibold"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Advance: <strong className="text-slate-700">{formatCurrency(woForm.advanceAmount)}</strong>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Security Retention (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={woForm.retentionPercent}
                    onChange={(e) => setWoForm({ ...woForm, retentionPercent: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">Deducted from every RA bill</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Payment Milestones & Commercial Terms</label>
                <textarea
                  rows={2}
                  value={woForm.paymentTerms}
                  onChange={(e) => setWoForm({ ...woForm, paymentTerms: e.target.value })}
                  placeholder="e.g. Running account bills certified every 30 days with 5% security retention released post DLP."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveWorkOrder(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={saving || !woForm.workOrderNumber || !(Number(woForm.contractValue) > 0)}
                  onClick={() => handleSaveWorkOrder(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Complete Work Order</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: SITE MOBILIZATION */}
          {activeTab === 'siteSetup' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Site Mobilization & Pre-Start Infrastructure</h3>
                  <p className="text-xs text-slate-500">Designate site engineer, energize water and power utilities, and verify perimeter security.</p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  record?.siteSetup?.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  Status: {record?.siteSetup?.status === 'completed' ? 'Completed' : 'Draft / In Progress'}
                </span>
              </div>

              {/* Site Engineer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Designated Site Engineer *</label>
                  <input
                    type="text"
                    required
                    value={siteSetupForm.siteEngineerName}
                    onChange={(e) => setSiteSetupForm({ ...siteSetupForm, siteEngineerName: e.target.value })}
                    placeholder="e.g. Er. Rajesh Singhal"
                    className="w-full text-xs rounded border border-slate-300 p-2 bg-white outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Engineer Contact Number</label>
                  <input
                    type="text"
                    value={siteSetupForm.siteEngineerContact}
                    onChange={(e) => setSiteSetupForm({ ...siteSetupForm, siteEngineerContact: e.target.value })}
                    placeholder="+91 94140 12345"
                    className="w-full text-xs rounded border border-slate-300 p-2 bg-white outline-none"
                  />
                </div>
              </div>

              {/* Mobilization Facilities Checklist */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Site Utilities & Readiness Checklist</span>

                {/* Facility 1: Water */}
                <div className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Droplets className="w-4 h-4 text-cyan-600 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Water Supply Connection</div>
                      <div className="text-[11px] text-slate-400">Deep borewell, tanker tank, or local pipeline connection</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Notes (e.g. 7.5 HP borewell commissioned)"
                      value={siteSetupForm.waterNotes}
                      onChange={(e) => setSiteSetupForm({ ...siteSetupForm, waterNotes: e.target.value })}
                      className="text-xs rounded border border-slate-300 p-1.5 w-64 bg-slate-50"
                    />
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={siteSetupForm.waterReady}
                        onChange={(e) => setSiteSetupForm({ ...siteSetupForm, waterReady: e.target.checked })}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span>Ready</span>
                    </label>
                  </div>
                </div>

                {/* Facility 2: Power */}
                <div className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Electricity Connection</div>
                      <div className="text-[11px] text-slate-400">Temporary construction meter or diesel generator set</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Notes (e.g. 25 KVA temporary connection)"
                      value={siteSetupForm.powerNotes}
                      onChange={(e) => setSiteSetupForm({ ...siteSetupForm, powerNotes: e.target.value })}
                      className="text-xs rounded border border-slate-300 p-1.5 w-64 bg-slate-50"
                    />
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={siteSetupForm.powerReady}
                        onChange={(e) => setSiteSetupForm({ ...siteSetupForm, powerReady: e.target.checked })}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span>Ready</span>
                    </label>
                  </div>
                </div>

                {/* Facility 3: Barricading */}
                <div className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-brand-600 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Perimeter Barricading</div>
                      <div className="text-[11px] text-slate-400">Perimeter GI tin fencing and safety hazard warning boards</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Notes (e.g. 8ft tin sheet fencing installed)"
                      value={siteSetupForm.barricadeNotes}
                      onChange={(e) => setSiteSetupForm({ ...siteSetupForm, barricadeNotes: e.target.value })}
                      className="text-xs rounded border border-slate-300 p-1.5 w-64 bg-slate-50"
                    />
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={siteSetupForm.barricadeReady}
                        onChange={(e) => setSiteSetupForm({ ...siteSetupForm, barricadeReady: e.target.checked })}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span>Ready</span>
                    </label>
                  </div>
                </div>

                {/* Facility 4: Site Office & Cement Godown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-slate-800">Site Office Portacabin</div>
                        <div className="text-[11px] text-slate-400">Drawing table, internet & records</div>
                      </div>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={siteSetupForm.officeReady}
                        onChange={(e) => setSiteSetupForm({ ...siteSetupForm, officeReady: e.target.checked })}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span>Ready</span>
                    </label>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-slate-800">Cement Godown & Steel Yard</div>
                        <div className="text-[11px] text-slate-400">Moisture-proof storage structure</div>
                      </div>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={siteSetupForm.godownReady}
                        onChange={(e) => setSiteSetupForm({ ...siteSetupForm, godownReady: e.target.checked })}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span>Ready</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveSiteSetup(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={saving || !siteSetupForm.siteEngineerName}
                  onClick={() => handleSaveSiteSetup(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Complete Site Mobilization</span>
                </button>
              </div>

              {/* Management Approval Gate Box */}
              <div className="mt-6 p-5 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Stage 5 Management Sign-Off Gate</h4>
                      <p className="text-[11px] text-slate-500">Requires Contractor Selection, Rate Finalization, Work Order, and Site Setup to be completed.</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    record?.managementApproval?.decision === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : record?.managementApproval?.decision === 'rejected'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : record?.status === 'managementApproval'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {record?.managementApproval?.decision || (record?.status === 'managementApproval' ? 'Under Review' : 'Pending Sections')}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Approval Remark</label>
                  <textarea
                    rows={2}
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    placeholder="Enter management review observations or authorization notes..."
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-500">
                    {allSectionsComplete
                      ? 'All 4 pre-site sections completed. Ready for formal management sign-off.'
                      : 'Complete all 4 sections to enable formal management sanction.'}
                  </span>

                  <div className="flex items-center gap-2">
                    {record?.status !== 'managementApproval' && record?.managementApproval?.decision !== 'approved' && (
                      <button
                        type="button"
                        disabled={saving || !allSectionsComplete}
                        onClick={handleRequestApproval}
                        className="px-4 py-2 text-xs font-semibold text-brand-700 bg-brand-100 hover:bg-brand-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Request Review
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={saving || record?.managementApproval?.decision === 'approved'}
                      onClick={() => handleDecideApproval('rejected')}
                      className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Reject
                    </button>

                    <button
                      type="button"
                      disabled={saving || !allSectionsComplete || record?.managementApproval?.decision === 'approved'}
                      onClick={() => handleDecideApproval('approved')}
                      className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Approve & Advance to Stage 6</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Last updated: {record?.updatedAt ? new Date(record.updatedAt).toLocaleString() : '—'}
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