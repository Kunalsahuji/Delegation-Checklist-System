import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Calendar, Layers } from 'lucide-react';
import WorkKpiStrip from '../../../components/WorkKpiStrip';

export const ChecklistKpis = ({ stats, activeFilter, onSelectFilter }) => {
  const items = [
    {
      key: 'all',
      id: 'all',
      label: 'TOTAL WORK',
      value: stats?.total ?? 0,
      icon: Layers,
      tone: 'blue',
      hint: 'All recurring operational items',
      active: activeFilter === 'all' || !activeFilter,
      onClick: () => onSelectFilter('all'),
      info: {
        title: 'Total Checklist Work',
        summary: 'All recurring operational compliance occurrences in the current filtered view.',
        calculation: 'Sum of all items across frequencies and assignees.',
      },
    },
    {
      key: 'dueToday',
      id: 'dueToday',
      label: 'DUE TODAY',
      value: stats?.dueToday ?? 0,
      icon: Calendar,
      tone: 'sky',
      hint: 'Scheduled for completion today',
      active: activeFilter === 'dueToday',
      onClick: () => onSelectFilter('dueToday'),
      info: {
        title: 'Due Today',
        summary: 'Checklist occurrences scheduled for completion before end of today.',
        calculation: 'Count of pending items scheduled for today.',
      },
    },
    {
      key: 'pending',
      id: 'pending',
      label: 'PENDING',
      value: stats?.pending ?? 0,
      icon: Clock,
      tone: 'warning',
      hint: stats?.overdue ? `${stats.overdue} of them overdue` : 'Awaiting check-off',
      active: activeFilter === 'pending',
      onClick: () => onSelectFilter('pending'),
      info: {
        title: 'Pending Checklist Work',
        summary: 'Scheduled checklist occurrences currently open and awaiting completion.',
        calculation: 'Occurrences with status = "pending".',
      },
    },
    {
      key: 'overdue',
      id: 'overdue',
      label: 'OVERDUE',
      value: stats?.overdue ?? 0,
      icon: AlertTriangle,
      tone: 'danger',
      hint: 'Requires immediate action',
      active: activeFilter === 'overdue',
      onClick: () => onSelectFilter('overdue'),
      info: {
        title: 'Overdue Items',
        summary: 'Pending tasks whose due date or time has passed without completion.',
        calculation: 'Status = "pending" and dueDate < today.',
      },
    },
    {
      key: 'done',
      id: 'done',
      label: 'COMPLETED',
      value: stats?.completed ?? 0,
      icon: CheckCircle2,
      tone: 'success',
      hint: `${stats?.total ? Math.round(((stats.completed || 0) / stats.total) * 100) : 0}% completion rate`,
      active: activeFilter === 'done',
      onClick: () => onSelectFilter('done'),
      info: {
        title: 'Completed Occurrences',
        summary: 'Checklist items verified and ticked Done.',
        calculation: 'Occurrences with status = "done".',
      },
    },
  ];

  return <WorkKpiStrip items={items} columns="grid-cols-2 sm:grid-cols-5" label="Checklist KPIs" />;
};
