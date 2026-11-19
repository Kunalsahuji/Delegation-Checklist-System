import React from 'react';
import { CheckCircle2, Lock, Clock, AlertCircle } from 'lucide-react';

export default function StageRail({
  stages = [],
  currentStageOrder = 1,
  activeSelectedStage = 1,
  onSelectStage,
  baselineLocked = false,
}) {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 tracking-wider uppercase">
            13-Stage Construction Lifecycle Rail
          </span>
          {baselineLocked && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <Lock className="w-2.5 h-2.5" />
              Baseline Locked
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Stage {currentStageOrder} of 13 Active
        </span>
      </div>

      {/* Rail Container */}
      <div className="relative overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex items-center min-w-[900px] gap-1.5 py-1">
          {stages.map((stage) => {
            const isApproved = stage.approved || stage.order < currentStageOrder;
            const isCurrent = stage.order === currentStageOrder;
            const isSelected = stage.order === activeSelectedStage;
            const isLocked = stage.order > currentStageOrder;

            let badgeStyle = 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300';
            let dotStyle = 'bg-slate-300 text-slate-600';

            if (isApproved) {
              badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70';
              dotStyle = 'bg-emerald-600 text-white';
            } else if (isCurrent) {
              badgeStyle = 'bg-blue-50 text-blue-900 border-blue-300 ring-2 ring-blue-500/20 shadow-xs';
              dotStyle = 'bg-blue-600 text-white';
            }

            if (isSelected) {
              badgeStyle += ' ring-2 ring-brand-500 font-bold';
            }

            return (
              <button
                key={stage.order}
                type="button"
                onClick={() => onSelectStage && onSelectStage(stage.order)}
                className={`flex-1 min-w-[125px] flex flex-col p-2 rounded-lg border text-left transition-all cursor-pointer ${badgeStyle}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${dotStyle}`}
                  >
                    {isApproved ? <CheckCircle2 className="w-3.5 h-3.5" /> : stage.order}
                  </span>
                  {stage.locksBaseline && (
                    <Lock
                      className={`w-3 h-3 ${isApproved || baselineLocked ? 'text-amber-600' : 'text-slate-400'}`}
                      title="Locks Project Baseline (BOQ & Budget)"
                    />
                  )}
                </div>

                <div className="text-[11px] font-semibold truncate leading-tight" title={stage.name}>
                  {stage.name}
                </div>

                <div className="text-[10px] opacity-75 mt-0.5 flex items-center gap-1">
                  {isApproved ? (
                    <span className="text-emerald-700 font-medium">Done</span>
                  ) : isCurrent ? (
                    <span className="text-blue-700 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      In Progress
                    </span>
                  ) : (
                    <span className="text-slate-400">Locked</span>
                  )}
                  <span className="text-slate-400 font-normal">
                    ({(stage.checklist || []).filter((i) => i.done).length}/{(stage.checklist || []).length})
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
