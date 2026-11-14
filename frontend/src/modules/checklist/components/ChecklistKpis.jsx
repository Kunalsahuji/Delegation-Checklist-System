import { CheckCircle2, Clock, AlertTriangle, Calendar, Layers } from 'lucide-react';

export const ChecklistKpis = ({ stats, activeFilter, onSelectFilter }) => {
  const cards = [
    {
      id: 'all',
      title: 'Total',
      value: stats?.total ?? 0,
      icon: Layers,
      variant: 'default',
    },
    {
      id: 'dueToday',
      title: 'Due today',
      value: stats?.dueToday ?? 0,
      icon: Calendar,
      variant: 'primary',
    },
    {
      id: 'pending',
      title: 'Pending',
      value: stats?.pending ?? 0,
      icon: Clock,
      variant: 'warning',
    },
    {
      id: 'overdue',
      title: 'Overdue',
      value: stats?.overdue ?? 0,
      icon: AlertTriangle,
      variant: 'danger',
    },
    {
      id: 'done',
      title: 'Completed',
      value: stats?.completed ?? 0,
      icon: CheckCircle2,
      variant: 'success',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectFilter(card.id)}
            className={`text-left p-3.5 rounded-xl border bg-white shadow-subtle transition-all cursor-pointer ${
              isActive
                ? 'ring-2 ring-brand-500 border-brand-500 shadow-sm'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">{card.title}</span>
              <Icon
                className={`w-4 h-4 ${
                  card.variant === 'danger'
                    ? 'text-rose-500'
                    : card.variant === 'success'
                    ? 'text-emerald-500'
                    : card.variant === 'warning'
                    ? 'text-amber-500'
                    : 'text-slate-400'
                }`}
              />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {card.value}
            </div>
          </button>
        );
      })}
    </div>
  );
};
