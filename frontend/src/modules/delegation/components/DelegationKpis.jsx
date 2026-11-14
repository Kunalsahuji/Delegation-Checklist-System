import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  ArrowRightLeft, 
  Layers,
  Bell
} from 'lucide-react';

export default function DelegationKpis({ stats, activeSlice, onSelectSlice, loading }) {
  const cards = [
    {
      id: 'all',
      title: 'TOTAL WORK',
      value: stats?.totalWork ?? 0,
      subtext: 'Including completed and cancelled',
      icon: Layers,
      color: 'blue',
      badgeClass: 'text-slate-900 border-slate-200',
    },
    {
      id: 'pending',
      title: 'PENDING',
      value: stats?.pending ?? 0,
      subtext: stats?.overdue ? `${stats.overdue} of them overdue` : 'Awaiting completion',
      icon: Clock,
      color: 'amber',
      badgeClass: 'text-amber-600 border-amber-200',
    },
    {
      id: 'dueToday',
      title: 'DUE TODAY',
      value: stats?.dueToday ?? 0,
      subtext: 'Requires action today',
      icon: Calendar,
      color: 'sky',
      badgeClass: 'text-sky-600 border-sky-200',
    },
    {
      id: 'overdue',
      title: 'OVERDUE',
      value: stats?.overdue ?? 0,
      subtext: 'Past current due date',
      icon: AlertTriangle,
      color: 'rose',
      badgeClass: 'text-rose-600 border-rose-200',
    },
    {
      id: 'weekShifted',
      title: 'WEEK SHIFTED',
      value: stats?.weekShifted ?? 0,
      subtext: 'Did not happen in the week it was due',
      icon: ArrowRightLeft,
      color: 'orange',
      badgeClass: 'text-orange-600 border-orange-200',
    },
    {
      id: 'completed',
      title: 'COMPLETED',
      value: stats?.completed ?? 0,
      subtext: 'Marked done',
      icon: CheckCircle2,
      color: 'emerald',
      badgeClass: 'text-emerald-600 border-emerald-200',
    },
    {
      id: 'followUpDue',
      title: 'FOLLOW-UP DUE',
      value: stats?.followUpDue ?? 0,
      subtext: 'Requires follow-up reminder',
      icon: Bell,
      color: 'purple',
      badgeClass: 'text-purple-600 border-purple-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
      {cards.map((c) => {
        const Icon = c.icon;
        const isSelected = activeSlice === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelectSlice(isSelected && c.id !== 'all' ? 'all' : c.id)}
            className={`text-left p-3.5 rounded-xl border transition-all ${
              isSelected
                ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-100'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase">
                {c.title}
              </span>
              <Icon className={`w-4 h-4 ${
                c.color === 'rose' ? 'text-rose-500' :
                c.color === 'emerald' ? 'text-emerald-500' :
                c.color === 'amber' ? 'text-amber-500' :
                c.color === 'orange' ? 'text-orange-500' :
                c.color === 'sky' ? 'text-sky-500' :
                c.color === 'purple' ? 'text-purple-500' : 'text-slate-400'
              }`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold tracking-tight ${
                c.color === 'rose' && c.value > 0 ? 'text-rose-600' :
                c.color === 'emerald' && c.value > 0 ? 'text-emerald-600' :
                'text-slate-900'
              }`}>
                {loading ? '-' : c.value}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate" title={c.subtext}>
              {c.subtext}
            </p>
          </button>
        );
      })}
    </div>
  );
}
