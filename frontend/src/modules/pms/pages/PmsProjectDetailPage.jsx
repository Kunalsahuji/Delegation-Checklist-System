import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  Lock,
  Layers,
  MapPin,
  Calendar,
  IndianRupee,
  ShieldCheck,
  FileText,
  AlertTriangle,
  ChevronRight,
  Upload,
  User,
} from 'lucide-react';
import { pmsProjectApi } from '../../../api/pmsProjectApi';
import { useToast } from '../../../context/ToastContext';
import StageRail from '../components/StageRail';

function formatCurrencyCr(amount) {
  if (!amount || isNaN(amount)) return '₹0';
  const val = Number(amount);
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  return `₹${val.toLocaleString('en-IN')}`;
}

export default function PmsProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStageOrder, setActiveStageOrder] = useState(1);
  const [advancing, setAdvancing] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      const res = await pmsProjectApi.getProjectById(id);
      if (res.success && res.data) {
        setProject(res.data);
        setActiveStageOrder(res.data.stageOrder || 1);
      }
    } catch (err) {
      showError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const handleToggleChecklist = async (stageOrder, itemIndex) => {
    try {
      const res = await pmsProjectApi.toggleChecklistItem(id, stageOrder, itemIndex);
      if (res.success && res.data) {
        setProject(res.data);
        showSuccess('Checklist updated');
      }
    } catch (err) {
      showError(err.message || 'Failed to update checklist item');
    }
  };

  const handleAdvanceStage = async () => {
    try {
      setAdvancing(true);
      const res = await pmsProjectApi.advanceStage(id);
      if (res.success && res.data) {
        setProject(res.data);
        setActiveStageOrder(res.data.stageOrder);
        showSuccess(`Project advanced to Stage ${res.data.stageOrder}!`);
      }
    } catch (err) {
      showError(err.message || 'Cannot advance stage');
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mb-2" />
        <p className="text-xs text-slate-500">Loading project stage workspace...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-700">Project Not Found</h3>
        <button
          onClick={() => navigate('/pms/projects')}
          className="mt-3 px-3 py-1.5 text-xs font-semibold bg-brand-600 text-white rounded-lg"
        >
          Return to Project Catalog
        </button>
      </div>
    );
  }

  const stages = project.stages || [];
  const activeStage = stages.find((s) => s.order === activeStageOrder) || stages[0];
  const isCurrentStage = activeStage.order === project.stageOrder;
  const isApproved = activeStage.approved;
  const pendingItems = (activeStage.checklist || []).filter((i) => !i.done);
  const isChecklistComplete = pendingItems.length === 0 && (activeStage.checklist || []).length > 0;

  return (
    <div className="space-y-4 w-full">
      {/* Top Navigation & Project Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate('/pms/projects')}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer mt-0.5"
            title="Back to Projects Catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/60">
                {project.code}
              </span>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">{project.name}</h1>
              {project.nameHi && (
                <span className="text-xs text-slate-400 font-normal">({project.nameHi})</span>
              )}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  project.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : project.status === 'planning'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {project.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {project.locality ? `${project.locality}, ` : ''}
                {project.city || 'Jaipur'}
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                Budget: {formatCurrencyCr(project.plannedBudget)}
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <Lock
                  className={`w-3.5 h-3.5 ${project.baselineLocked ? 'text-amber-600' : 'text-slate-400'}`}
                />
                Baseline: {project.baselineLocked ? 'Locked (Post-Stage 6)' : 'Open (Planning)'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            Current Stage:{' '}
            <strong className="text-slate-900 font-bold">
              Stage {project.stageOrder} of 13
            </strong>
          </span>
        </div>
      </div>

      {/* 13-Stage Interactive Lifecycle Rail */}
      <StageRail
        stages={stages}
        currentStageOrder={project.stageOrder}
        activeSelectedStage={activeStageOrder}
        onSelectStage={(order) => setActiveStageOrder(order)}
        baselineLocked={project.baselineLocked}
      />

      {/* Selected Stage Inspection & Execution Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Checklist & Governance */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                  Stage {activeStage.order} Workspace
                </span>
                <h2 className="text-base font-bold text-slate-900">{activeStage.name}</h2>
              </div>
              <div>
                {isApproved ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Stage Completed & Approved
                  </span>
                ) : isCurrentStage ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    Active Stage Gate
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                    <Lock className="w-3 h-3" />
                    Locked Upcoming Stage
                  </span>
                )}
              </div>
            </div>

            {/* Stage Checklist Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mandatory Stage Verification Checklist
                </h3>
                <span className="text-xs text-slate-500">
                  {(activeStage.checklist || []).filter((i) => i.done).length} of{' '}
                  {(activeStage.checklist || []).length} Verified
                </span>
              </div>

              <div className="space-y-2">
                {(activeStage.checklist || []).map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => isCurrentStage && handleToggleChecklist(activeStage.order, idx)}
                    className={`flex items-start justify-between p-3 rounded-lg border transition-all ${
                      item.done
                        ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                        : isCurrentStage
                        ? 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70 cursor-pointer'
                        : 'bg-slate-50/50 border-slate-200/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={item.done}
                        disabled={!isCurrentStage}
                        onChange={() => {}}
                        className="mt-0.5 w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
                      />
                      <div>
                        <span className={`text-xs font-semibold ${item.done ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                          {item.label}
                        </span>
                        {item.done && item.completedAt && (
                          <p className="text-[10px] text-emerald-700 mt-0.5">
                            Completed on {new Date(item.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                    {item.auto && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded font-mono">
                        Auto-Sync
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Document Verification Slots */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Required Stage Document Slots
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(activeStage.docSlots || []).map((slot, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-dashed border-slate-300 bg-slate-50/60"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                    <span className="text-xs font-medium text-slate-800 truncate" title={slot}>
                      {slot}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Slot Ready
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Stage Advancement Gate Action Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Stage Gate Advancement
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                To advance project progression to Stage {project.stageOrder + 1}, all checklist criteria for the active stage must be 100% verified.
              </p>

              {isApproved ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>This stage was previously approved and closed out.</span>
                </div>
              ) : isCurrentStage ? (
                isChecklistComplete ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>All checklist items are completed! Stage is eligible for advancement.</span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Gate Blocked: {pendingItems.length} checklist item(s) pending verification.
                    </span>
                  </div>
                )
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 mb-4">
                  You are viewing Stage {activeStage.order}. The current active gate for this project is Stage {project.stageOrder}.
                </div>
              )}
            </div>

            {isCurrentStage && (
              <button
                type="button"
                onClick={handleAdvanceStage}
                disabled={!isChecklistComplete || advancing || project.stageOrder >= 13}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <span>{advancing ? 'Advancing Gate...' : `Advance to Stage ${project.stageOrder + 1}`}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Project Details Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs text-xs space-y-2.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
              Project Specification
            </h4>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Planned Villas:</span>
              <span className="font-semibold text-slate-800">{project.totalVillas || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Planned Plots:</span>
              <span className="font-semibold text-slate-800">{project.totalPlots || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Started Date:</span>
              <span className="font-semibold text-slate-800">
                {project.startedAt ? new Date(project.startedAt).toLocaleDateString('en-IN') : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Completion:</span>
              <span className="font-semibold text-slate-800">
                {project.targetCompletionAt
                  ? new Date(project.targetCompletionAt).toLocaleDateString('en-IN')
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
