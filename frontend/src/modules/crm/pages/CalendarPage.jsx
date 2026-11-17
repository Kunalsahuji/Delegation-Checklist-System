import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Clock,
  MapPin,
  Bell,
  CheckCircle2,
  Users,
} from 'lucide-react';
import WorkKpiStrip from '../../../components/WorkKpiStrip';
import { crmCalendarApi } from '../../../api/crmCalendarApi';
import { useToast } from '../../../context/ToastContext';
import CalendarActivityModal from '../components/CalendarActivityModal';
import FollowupFormModal from '../components/FollowupFormModal';
import CompleteFollowupModal from '../components/CompleteFollowupModal';

export default function CalendarPage() {
  const { showSuccess, showError } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [completeModal, setCompleteModal] = useState({ open: false, reminder: null });

  // Compute month boundaries
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthStart = useMemo(() => new Date(year, month, 1), [year, month]);
  const monthEnd = useMemo(() => new Date(year, month + 1, 0), [year, month]);

  useEffect(() => {
    loadActivities();
  }, [year, month]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const from = monthStart.toISOString();
      const to = monthEnd.toISOString();
      const res = await crmCalendarApi.getActivities({ from, to });
      if (res.success) {
        setActivities(res.data || []);
      }
    } catch (err) {
      showError(err.message || 'Failed to load calendar activities');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Group activities by date string 'YYYY-MM-DD'
  const activitiesByDate = useMemo(() => {
    const map = {};
    activities.forEach((act) => {
      const d = new Date(act.at).toISOString().split('T')[0];
      if (!map[d]) map[d] = [];
      map[d].push(act);
    });
    return map;
  }, [activities]);

  // Compute calendar grid days (Mon-Sun layout)
  const calendarDays = useMemo(() => {
    const days = [];
    const firstDayIndex = (monthStart.getDay() + 6) % 7; // Monday = 0
    const totalDays = monthEnd.getDate();

    // Previous month padding
    const prevMonthEnd = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthEnd - i;
      const d = new Date(year, month - 1, dayNum);
      days.push({
        date: d,
        dayNum,
        isCurrentMonth: false,
        dateStr: d.toISOString().split('T')[0],
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        dayNum: i,
        isCurrentMonth: true,
        dateStr: d.toISOString().split('T')[0],
      });
    }

    // Next month padding to fill out 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dayNum: i,
        isCurrentMonth: false,
        dateStr: d.toISOString().split('T')[0],
      });
    }

    return days;
  }, [year, month, monthStart, monthEnd]);

  const visitCount = activities.filter((a) => a.source === 'visit').length;
  const followupCount = activities.filter((a) => a.source === 'reminder').length;
  const milestoneCount = activities.filter((a) => a.source === 'lead_stage').length;

  const kpiItems = [
    {
      key: 'total-activities',
      label: 'TOTAL ACTIVITIES',
      value: activities.length,
      status: 'neutral',
      info: {
        title: 'Monthly Calendar Activities',
        summary: 'Unified schedule of customer appointments, site tours, and planned milestones.',
        calculation: 'Count of all calendar events in the selected month',
      },
    },
    {
      key: 'site-visits',
      label: 'SITE VISITS',
      value: visitCount,
      status: 'positive',
      info: {
        title: 'Field Site Visits',
        summary: 'Physical customer site tours scheduled or completed this month.',
        calculation: 'Count of visit reports in calendar date range',
      },
    },
    {
      key: 'follow-ups',
      label: 'FOLLOW-UPS',
      value: followupCount,
      status: 'warning',
      info: {
        title: 'Client Follow-ups',
        summary: 'Customer callbacks, discussions, and meeting follow-ups.',
        calculation: 'Count of reminder follow-ups in calendar date range',
      },
    },
    {
      key: 'stage-milestones',
      label: 'STAGE TARGETS',
      value: milestoneCount,
      status: 'neutral',
      info: {
        title: 'Pipeline Stage Targets',
        summary: 'Target deadlines set on active deals to progress them to the next sales stage.',
        calculation: 'Count of lead plannedStageAt milestones in date range',
      },
    },
  ];

  const monthLabel = currentDate.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const isTodayDate = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="space-y-4 w-full">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">CRM Unified Calendar</h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-700 rounded-md">
              Schedule & Milestones
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic view of all site visits, follow-up calls, and pipeline target milestones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month Navigation */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-xs font-bold text-slate-800 select-none min-w-[130px] text-center">
              {monthLabel}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
          >
            Today
          </button>

          <button
            onClick={loadActivities}
            className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refresh activities"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsScheduleOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Follow-up</span>
          </button>
        </div>
      </div>

      {/* KPI Strip with MetricInfoBadge */}
      <WorkKpiStrip items={kpiItems} />

      {/* Main Calendar Grid Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
          <div className="py-2.5">Mon</div>
          <div className="py-2.5">Tue</div>
          <div className="py-2.5">Wed</div>
          <div className="py-2.5">Thu</div>
          <div className="py-2.5">Fri</div>
          <div className="py-2.5">Sat</div>
          <div className="py-2.5 text-rose-500">Sun</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 text-xs">
          {calendarDays.map((dayItem, idx) => {
            const dayActs = activitiesByDate[dayItem.dateStr] || [];
            const isToday = isTodayDate(dayItem.date);

            return (
              <div
                key={idx}
                className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                  !dayItem.isCurrentMonth
                    ? 'bg-slate-50/50 text-slate-400'
                    : isToday
                    ? 'bg-blue-50/30'
                    : 'bg-white hover:bg-slate-50/40'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-bold ${
                      isToday
                        ? 'w-6 h-6 rounded-full bg-blue-600 text-white shadow-2xs'
                        : dayItem.isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {dayItem.dayNum}
                  </span>

                  {dayActs.length > 0 && (
                    <span className="text-[10px] font-semibold text-slate-400">
                      {dayActs.length} {dayActs.length === 1 ? 'task' : 'tasks'}
                    </span>
                  )}
                </div>

                {/* Activity Chips Container */}
                <div className="space-y-1 flex-1 overflow-hidden">
                  {dayActs.slice(0, 3).map((act) => (
                    <div
                      key={act.id}
                      onClick={() => setSelectedActivity(act)}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold text-white truncate cursor-pointer transition-all hover:opacity-90 shadow-2xs"
                      style={{ backgroundColor: act.color || '#3B82F6' }}
                      title={`${act.type}: ${act.title} (${act.clientName})`}
                    >
                      {act.time ? `${act.time} ` : ''}
                      {act.clientName || act.title}
                    </div>
                  ))}

                  {dayActs.length > 3 && (
                    <button
                      onClick={() => setSelectedActivity(dayActs[3])}
                      className="text-[10px] font-bold text-blue-600 hover:underline block text-left"
                    >
                      +{dayActs.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend strip */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-slate-700">Activity Types:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>Client Follow-up</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Site Visit Tour</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Stage Target Milestone</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <span>Personal Task</span>
            </div>
          </div>

          <span className="text-slate-400">Click any appointment to view contact details</span>
        </div>
      </div>

      {/* Portaled Modals with z-[9999] */}
      <CalendarActivityModal
        isOpen={Boolean(selectedActivity)}
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onComplete={(act) => {
          setCompleteModal({
            open: true,
            reminder: { _id: act.rawId, title: act.title },
          });
        }}
      />

      <FollowupFormModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSuccess={() => loadActivities()}
      />

      <CompleteFollowupModal
        isOpen={completeModal.open}
        reminder={completeModal.reminder}
        onClose={() => setCompleteModal({ open: false, reminder: null })}
        onSuccess={() => loadActivities()}
      />
    </div>
  );
}
