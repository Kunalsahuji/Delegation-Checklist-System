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
import WorkKpiStrip from '../../../components/WorkKpiStrip';

export default function DelegationKpis({ stats, activeSlice, onSelectSlice, loading }) {
  const items = [
    {
      key: 'all',
      id: 'all',
      label: 'TOTAL WORK',
      value: stats?.totalWork ?? 0,
      hint: 'All assigned tasks',
      icon: Layers,
      tone: 'blue',
      active: activeSlice === 'all' || !activeSlice,
      onClick: () => onSelectSlice(activeSlice === 'all' ? 'all' : 'all'),
      info: {
        title: 'Total Work',
        summary: 'All delegated tasks in the system across all assignees and departments.',
        calculation: 'Sum of all delegation tasks.',
      },
    },
    {
      key: 'pending',
      id: 'pending',
      label: 'PENDING',
      value: stats?.pending ?? 0,
      hint: stats?.overdue ? `${stats.overdue} of them overdue` : 'Awaiting completion',
      icon: Clock,
      tone: 'warning',
      active: activeSlice === 'pending',
      onClick: () => onSelectSlice(activeSlice === 'pending' ? 'all' : 'pending'),
      info: {
        title: 'Pending Tasks',
        summary: 'Delegated tasks currently open and awaiting completion by assignees.',
        calculation: 'Tasks with status = "pending" or "weekShifted".',
      },
    },
    {
      key: 'dueToday',
      id: 'dueToday',
      label: 'DUE TODAY',
      value: stats?.dueToday ?? 0,
      hint: 'Requires action today',
      icon: Calendar,
      tone: 'sky',
      active: activeSlice === 'dueToday',
      onClick: () => onSelectSlice(activeSlice === 'dueToday' ? 'all' : 'dueToday'),
      info: {
        title: 'Due Today',
        summary: 'Tasks whose current deadline is before the end of today.',
        calculation: 'Pending tasks where currentDueDate = today.',
      },
    },
    {
      key: 'overdue',
      id: 'overdue',
      label: 'OVERDUE',
      value: stats?.overdue ?? 0,
      hint: 'Past current due date',
      icon: AlertTriangle,
      tone: 'danger',
      active: activeSlice === 'overdue',
      onClick: () => onSelectSlice(activeSlice === 'overdue' ? 'all' : 'overdue'),
      info: {
        title: 'Overdue Work',
        summary: 'Pending tasks whose due date has passed without completion.',
        calculation: 'Tasks with status = "pending" and currentDueDate < today.',
      },
    },
    {
      key: 'weekShifted',
      id: 'weekShifted',
      label: 'WEEK SHIFTED',
      value: stats?.weekShifted ?? 0,
      hint: 'Shifted past original week',
      icon: ArrowRightLeft,
      tone: 'orange',
      active: activeSlice === 'weekShifted',
      onClick: () => onSelectSlice(activeSlice === 'weekShifted' ? 'all' : 'weekShifted'),
      info: {
        title: 'Week Shifted Tasks',
        summary: 'Tasks whose due date has been postponed beyond the original assigned week.',
        calculation: 'Tasks with date revision count > 0 beyond original calendar week.',
      },
    },
    {
      key: 'completed',
      id: 'completed',
      label: 'COMPLETED',
      value: stats?.completed ?? 0,
      hint: 'Marked done',
      icon: CheckCircle2,
      tone: 'success',
      active: activeSlice === 'completed',
      onClick: () => onSelectSlice(activeSlice === 'completed' ? 'all' : 'completed'),
      info: {
        title: 'Completed Tasks',
        summary: 'Delegated tasks successfully finished and signed off.',
        calculation: 'Tasks with status = "completed".',
      },
    },
    {
      key: 'followUpDue',
      id: 'followUpDue',
      label: 'FOLLOW-UP DUE',
      value: stats?.followUpDue ?? 0,
      hint: 'Requires reminder',
      icon: Bell,
      tone: 'purple',
      active: activeSlice === 'followUpDue',
      onClick: () => onSelectSlice(activeSlice === 'followUpDue' ? 'all' : 'followUpDue'),
      info: {
        title: 'Follow-up Due',
        summary: 'Tasks requiring supervisor check-in or progress follow-up reminder.',
        calculation: 'Tasks with followUpDate <= today.',
      },
    },
  ];

  return (
    <div className="mb-4">
      <WorkKpiStrip
        items={items}
        loading={loading}
        columns="grid-cols-2 sm:grid-cols-4 lg:grid-cols-7"
        label="Delegation KPIs"
      />
    </div>
  );
}
