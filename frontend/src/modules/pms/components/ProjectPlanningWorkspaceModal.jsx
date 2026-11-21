import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import {
  X,
  Compass,
  Layout,
  GitFork,
  Trees,
  Home,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Send,
  Building,
  Save,
  Check,
  ArrowRight,
} from 'lucide-react';
import { pmsPlanningApi } from '../../../api/pmsPlanningApi';

const SECTIONS = [
  { key: 'survey', title: '1. Survey & Geo', icon: Compass },
  { key: 'masterLayout', title: '2. Master Layout', icon: Layout },
  { key: 'roadPlanning', title: '3. Roads & Drainage', icon: GitFork },
  { key: 'amenities', title: '4. Amenities & Common', icon: Trees },
  { key: 'plotVillaPlanning', title: '5. Plots & Villas', icon: Home },
  { key: 'budget', title: '6. Dev Budget', icon: Calculator },
];

function formatCurrency(val) {
  if (!val || isNaN(val)) return '₹0';
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

export default function ProjectPlanningWorkspaceModal({ planId, onClose, onRefresh }) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('survey');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Survey State
  const [surveyForm, setSurveyForm] = useState({
    surveyNumber: '',
    surveyDate: '',
    agencyName: '',
    surveyorName: '',
    surveyorContact: '',
    north: '',
    south: '',
    east: '',
    west: '',
    lat: '',
    lng: '',
    surveyedArea: '',
    remarks: '',
  });

  // 2. Master Layout State
  const [layoutForm, setLayoutForm] = useState({
    layoutNumber: '',
    version: 'R1',
    architect: '',
    preparedOn: '',
    totalArea: '',
    saleableArea: '',
    roadArea: '',
    openArea: '',
    utilityArea: '',
    commonArea: '',
    remarks: '',
  });

  // 3. Road State
  const [newRoad, setNewRoad] = useState({
    name: '',
    category: 'internal',
    surface: 'bt',
    widthFt: 30,
    lengthFt: '',
    hasDrainage: true,
    drainageType: 'underground',
    remarks: '',
  });

  // 4. Amenities State
  const [amenityItems, setAmenityItems] = useState([]);

  // 5. Plots & Villas State
  const [newCategory, setNewCategory] = useState({
    name: '',
    kind: 'plot',
    count: '',
    area: '',
    widthFt: '',
    depthFt: '',
    facing: 'east',
    remarks: '',
  });

  // 6. Budget State
  const [budgetForm, setBudgetForm] = useState({
    landDevelopmentCost: '',
    roadsCost: '',
    utilitiesCost: '',
    amenitiesCost: '',
    infrastructureCost: '',
    miscCost: '',
    basis: '',
    preparedBy: '',
    preparedOn: '',
    remarks: '',
  });

  // Management approval form
  const [approvalNote, setApprovalNote] = useState('');

  useEffect(() => {
    if (planId) loadPlan();
  }, [planId]);

  const loadPlan = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await pmsPlanningApi.getPlanById(planId);
      if (res?.success) {
        const data = res.data;
        setPlan(data);

        // Populate Survey
        if (data.survey) {
          setSurveyForm({
            surveyNumber: data.survey.surveyNumber || '',
            surveyDate: data.survey.surveyDate ? data.survey.surveyDate.split('T')[0] : '',
            agencyName: data.survey.agencyName || '',
            surveyorName: data.survey.surveyorName || '',
            surveyorContact: data.survey.surveyorContact || '',
            north: data.survey.boundaries?.north || '',
            south: data.survey.boundaries?.south || '',
            east: data.survey.boundaries?.east || '',
            west: data.survey.boundaries?.west || '',
            lat: data.survey.geo?.lat ?? '',
            lng: data.survey.geo?.lng ?? '',
            surveyedArea: data.survey.surveyedArea || '',
            remarks: data.survey.remarks || '',
          });
        }

        // Populate Layout
        if (data.masterLayout) {
          setLayoutForm({
            layoutNumber: data.masterLayout.layoutNumber || '',
            version: data.masterLayout.version || 'R1',
            architect: data.masterLayout.architect || '',
            preparedOn: data.masterLayout.preparedOn ? data.masterLayout.preparedOn.split('T')[0] : '',
            totalArea: data.masterLayout.totalArea || '',
            saleableArea: data.masterLayout.saleableArea || '',
            roadArea: data.masterLayout.roadArea || '',
            openArea: data.masterLayout.openArea || '',
            utilityArea: data.masterLayout.utilityArea || '',
            commonArea: data.masterLayout.commonArea || '',
            remarks: data.masterLayout.remarks || '',
          });
        }

        // Populate Amenities
        if (data.amenities?.items) {
          setAmenityItems(data.amenities.items);
        }

        // Populate Budget
        if (data.budget) {
          setBudgetForm({
            landDevelopmentCost: data.budget.landDevelopmentCost || '',
            roadsCost: data.budget.roadsCost || '',
            utilitiesCost: data.budget.utilitiesCost || '',
            amenitiesCost: data.budget.amenitiesCost || '',
            infrastructureCost: data.budget.infrastructureCost || '',
            miscCost: data.budget.miscCost || '',
            basis: data.budget.basis || '',
            preparedBy: data.budget.preparedBy || '',
            preparedOn: data.budget.preparedOn ? data.budget.preparedOn.split('T')[0] : '',
            remarks: data.budget.remarks || '',
          });
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load planning record');
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
  const handleSaveSurvey = async (complete = false) => {
    setSaving(true);
    try {
      const payload = {
        surveyNumber: surveyForm.surveyNumber,
        surveyDate: surveyForm.surveyDate || null,
        agencyName: surveyForm.agencyName,
        surveyorName: surveyForm.surveyorName,
        surveyorContact: surveyForm.surveyorContact,
        boundaries: {
          north: surveyForm.north,
          south: surveyForm.south,
          east: surveyForm.east,
          west: surveyForm.west,
        },
        geo: {
          lat: surveyForm.lat !== '' ? Number(surveyForm.lat) : null,
          lng: surveyForm.lng !== '' ? Number(surveyForm.lng) : null,
        },
        surveyedArea: Number(surveyForm.surveyedArea) || 0,
        remarks: surveyForm.remarks,
      };

      const res = await pmsPlanningApi.updateSection(planId, 'survey', payload);
      if (res?.success) {
        if (complete) {
          const compRes = await pmsPlanningApi.completeSection(planId, 'survey');
          setPlan(compRes.data);
          showNotification('Survey marked as completed');
          setActiveTab('masterLayout');
        } else {
          setPlan(res.data);
          showNotification('Survey draft saved');
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save survey', true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLayout = async (complete = false) => {
    setSaving(true);
    try {
      const payload = {
        layoutNumber: layoutForm.layoutNumber,
        version: layoutForm.version,
        architect: layoutForm.architect,
        preparedOn: layoutForm.preparedOn || null,
        totalArea: Number(layoutForm.totalArea) || 0,
        saleableArea: Number(layoutForm.saleableArea) || 0,
        roadArea: Number(layoutForm.roadArea) || 0,
        openArea: Number(layoutForm.openArea) || 0,
        utilityArea: Number(layoutForm.utilityArea) || 0,
        commonArea: Number(layoutForm.commonArea) || 0,
        remarks: layoutForm.remarks,
      };

      const res = await pmsPlanningApi.updateSection(planId, 'masterLayout', payload);
      if (res?.success) {
        if (complete) {
          const compRes = await pmsPlanningApi.completeSection(planId, 'masterLayout');
          setPlan(compRes.data);
          showNotification('Master layout completed');
          setActiveTab('roadPlanning');
        } else {
          setPlan(res.data);
          showNotification('Master layout saved');
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save master layout', true);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRoad = async (e) => {
    e.preventDefault();
    if (!newRoad.name.trim()) {
      showNotification('Road name is required', true);
      return;
    }
    setSaving(true);
    try {
      const currentRoads = plan?.roadPlanning?.roads || [];
      const updatedRoads = [
        ...currentRoads,
        {
          name: newRoad.name,
          category: newRoad.category,
          surface: newRoad.surface,
          widthFt: Number(newRoad.widthFt) || 30,
          lengthFt: Number(newRoad.lengthFt) || 0,
          hasDrainage: Boolean(newRoad.hasDrainage),
          drainageType: newRoad.drainageType,
          remarks: newRoad.remarks,
        },
      ];

      const res = await pmsPlanningApi.updateSection(planId, 'roadPlanning', { roads: updatedRoads });
      if (res?.success) {
        setPlan(res.data);
        setNewRoad({
          name: '',
          category: 'internal',
          surface: 'bt',
          widthFt: 30,
          lengthFt: '',
          hasDrainage: true,
          drainageType: 'underground',
          remarks: '',
        });
        showNotification('Road added to schedule');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to add road', true);
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteRoads = async () => {
    setSaving(true);
    try {
      const res = await pmsPlanningApi.completeSection(planId, 'roadPlanning');
      if (res?.success) {
        setPlan(res.data);
        showNotification('Road network planning completed');
        setActiveTab('amenities');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to complete road planning', true);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAmenity = (index, field, value) => {
    setAmenityItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSaveAmenities = async (complete = false) => {
    setSaving(true);
    try {
      const res = await pmsPlanningApi.updateSection(planId, 'amenities', { items: amenityItems });
      if (res?.success) {
        if (complete) {
          const compRes = await pmsPlanningApi.completeSection(planId, 'amenities');
          setPlan(compRes.data);
          showNotification('Amenities schedule completed');
          setActiveTab('plotVillaPlanning');
        } else {
          setPlan(res.data);
          showNotification('Amenities saved');
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save amenities', true);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim() || !newCategory.count) {
      showNotification('Category name and unit count are required', true);
      return;
    }
    setSaving(true);
    try {
      const currentCats = plan?.plotVillaPlanning?.categories || [];
      const updatedCats = [
        ...currentCats,
        {
          name: newCategory.name,
          kind: newCategory.kind,
          count: Number(newCategory.count) || 0,
          area: Number(newCategory.area) || 0,
          widthFt: Number(newCategory.widthFt) || 0,
          depthFt: Number(newCategory.depthFt) || 0,
          facing: newCategory.facing,
          remarks: newCategory.remarks,
        },
      ];

      const res = await pmsPlanningApi.updateSection(planId, 'plotVillaPlanning', {
        categories: updatedCats,
      });
      if (res?.success) {
        setPlan(res.data);
        setNewCategory({
          name: '',
          kind: 'plot',
          count: '',
          area: '',
          widthFt: '',
          depthFt: '',
          facing: 'east',
          remarks: '',
        });
        showNotification('Unit category added');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to add unit category', true);
    } finally {
      setSaving(false);
    }
  };

  const handleCompletePlotVilla = async () => {
    setSaving(true);
    try {
      const res = await pmsPlanningApi.completeSection(planId, 'plotVillaPlanning');
      if (res?.success) {
        setPlan(res.data);
        showNotification('Plot and villa planning completed');
        setActiveTab('budget');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to complete unit planning', true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBudget = async (complete = false) => {
    setSaving(true);
    try {
      const payload = {
        landDevelopmentCost: Number(budgetForm.landDevelopmentCost) || 0,
        roadsCost: Number(budgetForm.roadsCost) || 0,
        utilitiesCost: Number(budgetForm.utilitiesCost) || 0,
        amenitiesCost: Number(budgetForm.amenitiesCost) || 0,
        infrastructureCost: Number(budgetForm.infrastructureCost) || 0,
        miscCost: Number(budgetForm.miscCost) || 0,
        basis: budgetForm.basis,
        preparedBy: budgetForm.preparedBy,
        preparedOn: budgetForm.preparedOn || null,
        remarks: budgetForm.remarks,
      };

      const res = await pmsPlanningApi.updateSection(planId, 'budget', payload);
      if (res?.success) {
        if (complete) {
          const compRes = await pmsPlanningApi.completeSection(planId, 'budget');
          setPlan(compRes.data);
          showNotification('Development budget completed');
        } else {
          setPlan(res.data);
          showNotification('Development budget saved');
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save budget', true);
    } finally {
      setSaving(false);
    }
  };

  const handleRequestApproval = async () => {
    setSaving(true);
    try {
      const res = await pmsPlanningApi.requestApproval(planId, { note: approvalNote });
      if (res?.success) {
        setPlan(res.data);
        showNotification('Planning submitted for management approval');
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
      const res = await pmsPlanningApi.decideApproval(planId, {
        decision,
        note: approvalNote || (decision === 'approved' ? 'Approved by Project Director' : 'Returned for revision'),
      });
      if (res?.success) {
        setPlan(res.data);
        showNotification(`Planning ${decision === 'approved' ? 'Approved' : 'Rejected'} successfully`);
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
          <p className="text-sm font-medium text-slate-600">Loading Stage 4 Planning Workspace...</p>
        </div>
      </div>,
      document.body
    );
  }

  const allSectionsComplete = SECTIONS.every((s) => plan?.[s.key]?.status === 'completed');
  const totalBudgetPreview = [
    Number(budgetForm.landDevelopmentCost) || 0,
    Number(budgetForm.roadsCost) || 0,
    Number(budgetForm.utilitiesCost) || 0,
    Number(budgetForm.amenitiesCost) || 0,
    Number(budgetForm.infrastructureCost) || 0,
    Number(budgetForm.miscCost) || 0,
  ].reduce((a, b) => a + b, 0);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] max-h-[95vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-400/30">
                {plan?.code || 'PLN-000000'}
              </span>
              <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                Stage 4: Project Planning & Approvals
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              {plan?.project?.name || 'Project Planning Workspace'}
            </h2>
            <div className="text-xs text-slate-300 mt-0.5 flex items-center gap-3">
              <span>Type: <strong className="text-white capitalize">{plan?.projectType}</strong></span>
              <span>•</span>
              <span>Total Dev Budget: <strong className="text-emerald-300">{formatCurrency(plan?.budget?.totalEstimatedCost || totalBudgetPreview)}</strong></span>
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

        {/* 6-Step Rail Tab Selector */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isCompleted = plan?.[sec.key]?.status === 'completed';
            const isActive = activeTab === sec.key;
            return (
              <button
                key={sec.key}
                onClick={() => setActiveTab(sec.key)}
                className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
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
          {/* TAB 1: SURVEY & GEO */}
          {activeTab === 'survey' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Land Boundary Survey & Topography</h3>
                  <p className="text-xs text-slate-500">Capture certified surveyor coordinates, land boundaries, and total surveyed acreage.</p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  plan?.survey?.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  Status: {plan?.survey?.status === 'completed' ? 'Completed' : 'Draft / In Progress'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Survey / Khasra No.</label>
                  <input
                    type="text"
                    value={surveyForm.surveyNumber}
                    onChange={(e) => setSurveyForm({ ...surveyForm, surveyNumber: e.target.value })}
                    placeholder="e.g. KH-482/1, 482/2"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Survey Date</label>
                  <input
                    type="date"
                    value={surveyForm.surveyDate}
                    onChange={(e) => setSurveyForm({ ...surveyForm, surveyDate: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Surveyed Area ({plan?.areaUnit || 'sqyd'})</label>
                  <input
                    type="number"
                    value={surveyForm.surveyedArea}
                    onChange={(e) => setSurveyForm({ ...surveyForm, surveyedArea: e.target.value })}
                    placeholder="e.g. 50000"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Survey Agency</label>
                  <input
                    type="text"
                    value={surveyForm.agencyName}
                    onChange={(e) => setSurveyForm({ ...surveyForm, agencyName: e.target.value })}
                    placeholder="e.g. Apex Geo Consultants"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Surveyor Name</label>
                  <input
                    type="text"
                    value={surveyForm.surveyorName}
                    onChange={(e) => setSurveyForm({ ...surveyForm, surveyorName: e.target.value })}
                    placeholder="e.g. Er. Ramesh Sharma"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Surveyor Contact</label>
                  <input
                    type="text"
                    value={surveyForm.surveyorContact}
                    onChange={(e) => setSurveyForm({ ...surveyForm, surveyorContact: e.target.value })}
                    placeholder="e.g. +91 98290 12345"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              {/* Boundaries & Geo */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-700 block">Boundaries & Coordinates</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500">North Boundary</label>
                    <input
                      type="text"
                      value={surveyForm.north}
                      onChange={(e) => setSurveyForm({ ...surveyForm, north: e.target.value })}
                      placeholder="e.g. NH-48 Service Road"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">South Boundary</label>
                    <input
                      type="text"
                      value={surveyForm.south}
                      onChange={(e) => setSurveyForm({ ...surveyForm, south: e.target.value })}
                      placeholder="e.g. Agriculture land"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">East Boundary</label>
                    <input
                      type="text"
                      value={surveyForm.east}
                      onChange={(e) => setSurveyForm({ ...surveyForm, east: e.target.value })}
                      placeholder="e.g. Village cart track"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">West Boundary</label>
                    <input
                      type="text"
                      value={surveyForm.west}
                      onChange={(e) => setSurveyForm({ ...surveyForm, west: e.target.value })}
                      placeholder="e.g. Government reserve"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-500">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={surveyForm.lat}
                      onChange={(e) => setSurveyForm({ ...surveyForm, lat: e.target.value })}
                      placeholder="26.9124"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={surveyForm.lng}
                      onChange={(e) => setSurveyForm({ ...surveyForm, lng: e.target.value })}
                      placeholder="75.7873"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Remarks & Survey Observations</label>
                <textarea
                  rows={2}
                  value={surveyForm.remarks}
                  onChange={(e) => setSurveyForm({ ...surveyForm, remarks: e.target.value })}
                  placeholder="Boundary stone demarcations completed, natural slope noted toward southeast..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveSurvey(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveSurvey(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Mark Completed</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MASTER LAYOUT */}
          {activeTab === 'masterLayout' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Architect Master Layout Plan</h3>
                  <p className="text-xs text-slate-500">Zoning distribution between saleable plots, internal roads, common parks, and utility reserves.</p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  plan?.masterLayout?.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  Status: {plan?.masterLayout?.status === 'completed' ? 'Completed' : 'Draft / In Progress'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Layout Plan No.</label>
                  <input
                    type="text"
                    value={layoutForm.layoutNumber}
                    onChange={(e) => setLayoutForm({ ...layoutForm, layoutNumber: e.target.value })}
                    placeholder="e.g. MLP-2026-04"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Revision / Version</label>
                  <input
                    type="text"
                    value={layoutForm.version}
                    onChange={(e) => setLayoutForm({ ...layoutForm, version: e.target.value })}
                    placeholder="R1"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Principal Architect</label>
                  <input
                    type="text"
                    value={layoutForm.architect}
                    onChange={(e) => setLayoutForm({ ...layoutForm, architect: e.target.value })}
                    placeholder="e.g. Studio Vista Architecture"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Prepared On</label>
                  <input
                    type="date"
                    value={layoutForm.preparedOn}
                    onChange={(e) => setLayoutForm({ ...layoutForm, preparedOn: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none"
                  />
                </div>
              </div>

              {/* Area Breakdown */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Zoning Area Breakdown ({plan?.areaUnit || 'sqyd'})</span>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Total Project Area</label>
                    <input
                      type="number"
                      value={layoutForm.totalArea}
                      onChange={(e) => setLayoutForm({ ...layoutForm, totalArea: e.target.value })}
                      placeholder="e.g. 50000"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-700 mb-1">Saleable Area</label>
                    <input
                      type="number"
                      value={layoutForm.saleableArea}
                      onChange={(e) => setLayoutForm({ ...layoutForm, saleableArea: e.target.value })}
                      placeholder="e.g. 30000"
                      className="w-full text-xs rounded border border-emerald-300 p-1.5 bg-white text-emerald-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Road Network Area</label>
                    <input
                      type="number"
                      value={layoutForm.roadArea}
                      onChange={(e) => setLayoutForm({ ...layoutForm, roadArea: e.target.value })}
                      placeholder="e.g. 10000"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Open Green / Parks Area</label>
                    <input
                      type="number"
                      value={layoutForm.openArea}
                      onChange={(e) => setLayoutForm({ ...layoutForm, openArea: e.target.value })}
                      placeholder="e.g. 5000"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Utility & STP Area</label>
                    <input
                      type="number"
                      value={layoutForm.utilityArea}
                      onChange={(e) => setLayoutForm({ ...layoutForm, utilityArea: e.target.value })}
                      placeholder="e.g. 2500"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Common Club & Amenities Area</label>
                    <input
                      type="number"
                      value={layoutForm.commonArea}
                      onChange={(e) => setLayoutForm({ ...layoutForm, commonArea: e.target.value })}
                      placeholder="e.g. 2500"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Layout Notes / Bylaw Compliance</label>
                <textarea
                  rows={2}
                  value={layoutForm.remarks}
                  onChange={(e) => setLayoutForm({ ...layoutForm, remarks: e.target.value })}
                  placeholder="Compliant with local master plan requirements; 60% saleable area achieved..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveLayout(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveLayout(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Mark Completed</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ROADS */}
          {activeTab === 'roadPlanning' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Road Network & Stormwater Drainage</h3>
                  <p className="text-xs text-slate-500">Define spine, internal, and peripheral roads, surface finish, and drainage specs.</p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  plan?.roadPlanning?.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  Status: {plan?.roadPlanning?.status === 'completed' ? 'Completed' : 'Draft / In Progress'}
                </span>
              </div>

              {/* Road Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Road Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Surface</th>
                      <th className="py-2.5 px-3">Width</th>
                      <th className="py-2.5 px-3">Length</th>
                      <th className="py-2.5 px-3">Drainage</th>
                      <th className="py-2.5 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(plan?.roadPlanning?.roads || []).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-xs text-slate-400">
                          No roads added yet. Use the schedule form below to add main and internal roads.
                        </td>
                      </tr>
                    ) : (
                      plan.roadPlanning.roads.map((road, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 font-semibold text-slate-900">{road.name}</td>
                          <td className="py-2 px-3 uppercase text-[10px] font-bold text-brand-700">{road.category}</td>
                          <td className="py-2 px-3 uppercase text-[10px] text-slate-600">{road.surface}</td>
                          <td className="py-2 px-3">{road.widthFt} ft</td>
                          <td className="py-2 px-3">{road.lengthFt ? `${road.lengthFt} ft` : '—'}</td>
                          <td className="py-2 px-3 text-slate-600">
                            {road.hasDrainage ? road.drainageType : 'None'}
                          </td>
                          <td className="py-2 px-3 text-slate-500">{road.remarks || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add Road Form */}
              <form onSubmit={handleAddRoad} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Add Road to Schedule</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Road Name *</label>
                    <input
                      type="text"
                      required
                      value={newRoad.name}
                      onChange={(e) => setNewRoad({ ...newRoad, name: e.target.value })}
                      placeholder="Main Boulevard 60ft"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Category</label>
                    <select
                      value={newRoad.category}
                      onChange={(e) => setNewRoad({ ...newRoad, category: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    >
                      <option value="main">Main Spine</option>
                      <option value="internal">Internal Sector</option>
                      <option value="peripheral">Peripheral</option>
                      <option value="service">Service</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Surface Finish</label>
                    <select
                      value={newRoad.surface}
                      onChange={(e) => setNewRoad({ ...newRoad, surface: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    >
                      <option value="bt">Bituminous (BT / Tar)</option>
                      <option value="cc">Cement Concrete (CC)</option>
                      <option value="paver">Interlocking Paver Blocks</option>
                      <option value="wbm">WBM / Gravel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Width (ft)</label>
                    <input
                      type="number"
                      value={newRoad.widthFt}
                      onChange={(e) => setNewRoad({ ...newRoad, widthFt: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Length (ft)</label>
                    <input
                      type="number"
                      value={newRoad.lengthFt}
                      onChange={(e) => setNewRoad({ ...newRoad, lengthFt: e.target.value })}
                      placeholder="e.g. 1200"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Drainage Type</label>
                    <input
                      type="text"
                      value={newRoad.drainageType}
                      onChange={(e) => setNewRoad({ ...newRoad, drainageType: e.target.value })}
                      placeholder="underground / saucer drain"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-1.5 px-3 bg-brand-600 text-white rounded text-xs font-semibold hover:bg-brand-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Road</span>
                    </button>
                  </div>
                </div>
              </form>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving || (plan?.roadPlanning?.roads || []).length === 0}
                  onClick={handleCompleteRoads}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Complete Roads Schedule</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: AMENITIES */}
          {activeTab === 'amenities' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Amenities & Infrastructure Amenities</h3>
                  <p className="text-xs text-slate-500">Configure communal facilities, recreational spaces, and civil utilities.</p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  plan?.amenities?.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  Status: {plan?.amenities?.status === 'completed' ? 'Completed' : 'Draft / In Progress'}
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Include</th>
                      <th className="py-2.5 px-3">Amenity Facility</th>
                      <th className="py-2.5 px-3">Count</th>
                      <th className="py-2.5 px-3">Area ({plan?.areaUnit || 'sqyd'})</th>
                      <th className="py-2.5 px-3">Est. Cost (₹)</th>
                      <th className="py-2.5 px-3">Capacity / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {amenityItems.map((item, idx) => (
                      <tr key={item.key || idx} className={item.included ? 'bg-white' : 'bg-slate-50/50 text-slate-400'}>
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={item.included}
                            onChange={(e) => handleUpdateAmenity(idx, 'included', e.target.checked)}
                            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          />
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{item.label}</td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            disabled={!item.included}
                            value={item.count}
                            onChange={(e) => handleUpdateAmenity(idx, 'count', Number(e.target.value) || 0)}
                            className="w-16 text-xs rounded border border-slate-300 p-1 text-center disabled:bg-slate-100"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            disabled={!item.included}
                            value={item.area || ''}
                            onChange={(e) => handleUpdateAmenity(idx, 'area', Number(e.target.value) || 0)}
                            placeholder="0"
                            className="w-24 text-xs rounded border border-slate-300 p-1 text-center disabled:bg-slate-100"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            disabled={!item.included}
                            value={item.estimatedCost || ''}
                            onChange={(e) => handleUpdateAmenity(idx, 'estimatedCost', Number(e.target.value) || 0)}
                            placeholder="₹"
                            className="w-28 text-xs rounded border border-slate-300 p-1 text-right disabled:bg-slate-100"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            disabled={!item.included}
                            value={item.remarks || ''}
                            onChange={(e) => handleUpdateAmenity(idx, 'remarks', e.target.value)}
                            placeholder="specs or capacity..."
                            className="w-full text-xs rounded border border-slate-300 p-1 disabled:bg-slate-100"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveAmenities(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveAmenities(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Mark Completed</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: PLOTS & VILLAS */}
          {activeTab === 'plotVillaPlanning' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Plot & Villa Categorization</h3>
                  <p className="text-xs text-slate-500">Group units into typology categories with dimensions, facing, and count.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200">
                    Total Plots: {plan?.plotVillaPlanning?.totalPlots || 0} | Villas: {plan?.plotVillaPlanning?.totalVillas || 0}
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    plan?.plotVillaPlanning?.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    Status: {plan?.plotVillaPlanning?.status === 'completed' ? 'Completed' : 'Draft / In Progress'}
                  </span>
                </div>
              </div>

              {/* Unit Categories Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Category Name</th>
                      <th className="py-2.5 px-3">Kind</th>
                      <th className="py-2.5 px-3">Count</th>
                      <th className="py-2.5 px-3">Unit Area</th>
                      <th className="py-2.5 px-3">Dimensions</th>
                      <th className="py-2.5 px-3">Facing</th>
                      <th className="py-2.5 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(plan?.plotVillaPlanning?.categories || []).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-xs text-slate-400">
                          No plot or villa categories added yet. Add typologies using the form below.
                        </td>
                      </tr>
                    ) : (
                      plan.plotVillaPlanning.categories.map((cat, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 font-semibold text-slate-900">{cat.name}</td>
                          <td className="py-2 px-3 uppercase text-[10px] font-bold text-brand-700">{cat.kind}</td>
                          <td className="py-2 px-3 font-semibold">{cat.count} units</td>
                          <td className="py-2 px-3">{cat.area} {plan?.areaUnit || 'sqyd'}</td>
                          <td className="py-2 px-3 text-slate-600">
                            {cat.widthFt && cat.depthFt ? `${cat.widthFt} x ${cat.depthFt} ft` : '—'}
                          </td>
                          <td className="py-2 px-3 uppercase text-[10px]">{cat.facing || '—'}</td>
                          <td className="py-2 px-3 text-slate-500">{cat.remarks || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add Category Form */}
              <form onSubmit={handleAddCategory} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Add Unit Typology</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Typology Name *</label>
                    <input
                      type="text"
                      required
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="e.g. 30x50 East Villa"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Kind</label>
                    <select
                      value={newCategory.kind}
                      onChange={(e) => setNewCategory({ ...newCategory, kind: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    >
                      <option value="plot">Plot</option>
                      <option value="villa">Villa</option>
                      <option value="commercial">Commercial Plot</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Unit Count *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newCategory.count}
                      onChange={(e) => setNewCategory({ ...newCategory, count: e.target.value })}
                      placeholder="e.g. 24"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Unit Area ({plan?.areaUnit || 'sqyd'})</label>
                    <input
                      type="number"
                      value={newCategory.area}
                      onChange={(e) => setNewCategory({ ...newCategory, area: e.target.value })}
                      placeholder="e.g. 166.6"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Width (ft)</label>
                    <input
                      type="number"
                      value={newCategory.widthFt}
                      onChange={(e) => setNewCategory({ ...newCategory, widthFt: e.target.value })}
                      placeholder="30"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Depth (ft)</label>
                    <input
                      type="number"
                      value={newCategory.depthFt}
                      onChange={(e) => setNewCategory({ ...newCategory, depthFt: e.target.value })}
                      placeholder="50"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Facing</label>
                    <select
                      value={newCategory.facing}
                      onChange={(e) => setNewCategory({ ...newCategory, facing: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    >
                      <option value="east">East</option>
                      <option value="west">West</option>
                      <option value="north">North</option>
                      <option value="south">South</option>
                      <option value="north-east">North-East</option>
                      <option value="north-west">North-West</option>
                      <option value="south-east">South-East</option>
                      <option value="south-west">South-West</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-1.5 px-3 bg-brand-600 text-white rounded text-xs font-semibold hover:bg-brand-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Typology</span>
                    </button>
                  </div>
                </div>
              </form>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving || (plan?.plotVillaPlanning?.categories || []).length === 0}
                  onClick={handleCompletePlotVilla}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Complete Typology Planning</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: DEV BUDGET & APPROVAL */}
          {activeTab === 'budget' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Total Development Budget & Sanction</h3>
                  <p className="text-xs text-slate-500">Comprehensive civil cost estimation across earthworks, roads, utilities, and amenities.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-300">
                    Total Estimated Dev Cost: {formatCurrency(totalBudgetPreview)}
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    plan?.budget?.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    Status: {plan?.budget?.status === 'completed' ? 'Completed' : 'Draft / In Progress'}
                  </span>
                </div>
              </div>

              {/* Cost Inputs */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Land Levelling & Earthwork (₹)</label>
                  <input
                    type="number"
                    value={budgetForm.landDevelopmentCost}
                    onChange={(e) => setBudgetForm({ ...budgetForm, landDevelopmentCost: e.target.value })}
                    placeholder="e.g. 5000000"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Roads & Pathways Cost (₹)</label>
                  <input
                    type="number"
                    value={budgetForm.roadsCost}
                    onChange={(e) => setBudgetForm({ ...budgetForm, roadsCost: e.target.value })}
                    placeholder="e.g. 12000000"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Utilities (Water, Power, Sewer) (₹)</label>
                  <input
                    type="number"
                    value={budgetForm.utilitiesCost}
                    onChange={(e) => setBudgetForm({ ...budgetForm, utilitiesCost: e.target.value })}
                    placeholder="e.g. 8000000"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Amenities & Landscaping (₹)</label>
                  <input
                    type="number"
                    value={budgetForm.amenitiesCost}
                    onChange={(e) => setBudgetForm({ ...budgetForm, amenitiesCost: e.target.value })}
                    placeholder="e.g. 6000000"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Boundary Wall & Security (₹)</label>
                  <input
                    type="number"
                    value={budgetForm.infrastructureCost}
                    onChange={(e) => setBudgetForm({ ...budgetForm, infrastructureCost: e.target.value })}
                    placeholder="e.g. 4000000"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Miscellaneous & Contingency (₹)</label>
                  <input
                    type="number"
                    value={budgetForm.miscCost}
                    onChange={(e) => setBudgetForm({ ...budgetForm, miscCost: e.target.value })}
                    placeholder="e.g. 2000000"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Prepared By</label>
                  <input
                    type="text"
                    value={budgetForm.preparedBy}
                    onChange={(e) => setBudgetForm({ ...budgetForm, preparedBy: e.target.value })}
                    placeholder="e.g. Projects Costing Team"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Estimation Basis / Notes</label>
                  <input
                    type="text"
                    value={budgetForm.basis}
                    onChange={(e) => setBudgetForm({ ...budgetForm, basis: e.target.value })}
                    placeholder="Based on CPWD DSR 2024 rates and vendor quotations"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveBudget(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveBudget(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Complete Budget</span>
                </button>
              </div>

              {/* Management Approval Gate Box */}
              <div className="mt-6 p-5 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Stage 4 Governance & Sanction Gate</h4>
                      <p className="text-[11px] text-slate-500">Requires all 6 planning sections to be completed prior to management sign-off.</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    plan?.managementApproval?.decision === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : plan?.managementApproval?.decision === 'rejected'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : plan?.status === 'managementApproval'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {plan?.managementApproval?.decision || (plan?.status === 'managementApproval' ? 'Under Review' : 'Pending Sections')}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Approval / Rejection Remark</label>
                  <textarea
                    rows={2}
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    placeholder="Enter management review comments, baseline sanction conditions..."
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-500">
                    {allSectionsComplete
                      ? 'All 6 sections complete. Ready for formal management sanction.'
                      : 'Complete all 6 planning sections to enable final management approval.'}
                  </span>

                  <div className="flex items-center gap-2">
                    {plan?.status !== 'managementApproval' && plan?.managementApproval?.decision !== 'approved' && (
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
                      disabled={saving || plan?.managementApproval?.decision === 'approved'}
                      onClick={() => handleDecideApproval('rejected')}
                      className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Reject
                    </button>

                    <button
                      type="button"
                      disabled={saving || !allSectionsComplete || plan?.managementApproval?.decision === 'approved'}
                      onClick={() => handleDecideApproval('approved')}
                      className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Approve Planning</span>
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
            Last updated: {plan?.updatedAt ? new Date(plan.updatedAt).toLocaleString() : '—'}
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