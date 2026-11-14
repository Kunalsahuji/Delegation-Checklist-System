import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Printer, 
  Download, 
  Filter, 
  Plus, 
  Save, 
  Check, 
  HelpCircle,
  Clock,
  RotateCcw,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { checklistApi } from '../api/checklistApi';
import { axiosClient } from '../../../api/axiosClient';
import { ChecklistTaskDrawer } from '../components/ChecklistTaskDrawer';
import ChecklistItemsReport from '../components/ChecklistItemsReport';
import ChecklistPersonPerformanceReport from '../components/ChecklistPersonPerformanceReport';
import ChecklistWeeklyItemBreakdownModal from '../components/ChecklistWeeklyItemBreakdownModal';

const formatCivilDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getUTCDate()).padStart(2, '0')}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
};

export default function ChecklistWeeklyReportPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Filters
  const [selectedDoer, setSelectedDoer] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Master data
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);

  // Planning target inputs (Next week planned)
  const [nextNotDone, setNextNotDone] = useState('');
  const [nextNotDoneOnTime, setNextNotDoneOnTime] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);
  const [planSavedNotice, setPlanSavedNotice] = useState(false);

  // Report selector
  const [reportKey, setReportKey] = useState('checklistWeekly');

  // Breakdown Modal
  const [breakdownModal, setBreakdownModal] = useState({
    isOpen: false,
    filterType: 'all',
    title: '',
    personName: '',
  });

  // Modal
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Load Masters
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [dRes, uRes] = await Promise.all([
          axiosClient.get('/master/departments'),
          axiosClient.get('/master/users'),
        ]);
        setDepartments(Array.isArray(dRes?.data) ? dRes.data : []);
        setUsers(Array.isArray(uRes?.data) ? uRes.data : []);
      } catch (err) {
        console.error('Failed to load master filters', err);
      }
    };
    fetchMasters();
  }, []);

  // Calculate target date based on offset
  const getTargetWeekDate = (offsetWeeks) => {
    const now = new Date();
    now.setUTCDate(now.getUTCDate() + offsetWeeks * 7);
    return now.toISOString();
  };

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      const targetDate = getTargetWeekDate(currentWeekOffset);
      const res = await checklistApi.getWeeklyReport({
        weekStart: targetDate,
        department: selectedDept,
        assignee: selectedDoer,
      });

      const data = res?.data || res;
      setReportData(data);

      // Pre-fill next week planned input if available
      const doerTarget = selectedDoer
        ? data.byDoer?.find((d) => d.doerId === selectedDoer)
        : data.byDoer?.[0];

      if (doerTarget?.nextWeekPlanned) {
        setNextNotDone(doerTarget.nextWeekPlanned.notDone ?? '');
        setNextNotDoneOnTime(doerTarget.nextWeekPlanned.notDoneOnTime ?? '');
      } else {
        setNextNotDone('');
        setNextNotDoneOnTime('');
      }
    } catch (err) {
      console.error('Failed to load checklist weekly report', err);
    } finally {
      setLoading(false);
    }
  }, [currentWeekOffset, selectedDept, selectedDoer]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!reportData?.weekStart) return;
    const targetDoerId = selectedDoer || users[0]?._id;
    if (!targetDoerId) return;

    try {
      setSavingPlan(true);
      await checklistApi.saveWeeklyPlan({
        assignedTo: targetDoerId,
        weekStart: reportData.weekStart,
        next: {
          notDone: nextNotDone !== '' ? Number(nextNotDone) : null,
          notDoneOnTime: nextNotDoneOnTime !== '' ? Number(nextNotDoneOnTime) : null,
        },
      });
      setPlanSavedNotice(true);
      setTimeout(() => setPlanSavedNotice(false), 3000);
      loadReport();
    } catch (err) {
      console.error('Failed to save weekly target plan', err);
    } finally {
      setSavingPlan(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    const rows = [
      ['Doer Name', 'Total Planned', 'Not Done', 'Not Done On Time', '% Not Done', '% Not Done On Time'],
    ];

    if (reportData.byDoer && reportData.byDoer.length > 0) {
      reportData.byDoer.forEach((d) => {
        rows.push([
          `"${d.doerName}"`,
          d.planned,
          d.notDone,
          d.notDoneOnTime,
          d.pctNotDone !== null ? `${d.pctNotDone}%` : '-',
          d.pctNotDoneOnTime !== null ? `${d.pctNotDoneOnTime}%` : '-',
        ]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Checklist_Weekly_Report_Week_${reportData.weekNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = reportData?.summary || { totalPlanned: 0, notDone: 0, notDoneOnTime: 0, pctNotDone: null, pctNotDoneOnTime: null };
  const selectedDoerName = selectedDoer ? users.find((u) => u._id === selectedDoer)?.name : 'All doers';

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
            <span className="text-slate-400">Checklist</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-800 font-semibold">Report</span>
          </div>
          <p className="text-xs text-slate-500">
            Recurring operational work
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Checklist</span>
        </button>
      </div>

      {/* Report Selection Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 w-full sm:max-w-md min-w-0 flex-1">
            <label className="text-xs font-semibold text-slate-700 block">
              What do you want to report on?
            </label>
            <select
              value={reportKey}
              onChange={(e) => setReportKey(e.target.value)}
              className="w-full max-w-full truncate text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="checklistWeekly">Weekly performance — % work not done</option>
              <option value="checklistItems">Checklist items — dated occurrences</option>
              <option value="checklistPerformance">Person-wise performance — who did what</option>
            </select>
          </div>

          {reportKey === 'checklistWeekly' && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  showFilters || selectedDept || selectedDoer
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters {selectedDept || selectedDoer ? '(active)' : ''}</span>
              </button>
            </div>
          )}
        </div>

        {/* Collapsible Filter Bar (Weekly View) */}
        {reportKey === 'checklistWeekly' && showFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">
                Department
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">
                Doer (Employee)
              </label>
              <select
                value={selectedDoer}
                onChange={(e) => setSelectedDoer(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="">All doers</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => { setSelectedDept(''); setSelectedDoer(''); }}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs text-slate-500 hover:text-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset filters</span>
              </button>
            </div>
          </div>
        )}

        <div className="text-[11px] text-slate-400 font-medium">
          Period: {reportKey === 'checklistWeekly' ? 'Weekly' : 'Comprehensive Register'}
        </div>
      </div>

      {/* RENDER CONDITIONAL REPORT VIEW */}
      {reportKey === 'checklistItems' ? (
        <ChecklistItemsReport departments={departments} users={users} />
      ) : reportKey === 'checklistPerformance' ? (
        <ChecklistPersonPerformanceReport departments={departments} users={users} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Card Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Weekly performance — % work not done
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              How much of the planned work was not completed, and how much was not completed on time — a share of the items planned in the period.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Week Navigator */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="inline-flex items-center justify-between sm:justify-start w-full sm:w-auto bg-white border border-slate-200 rounded-lg shadow-2xs">
            <button
              type="button"
              onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-l-lg transition-colors"
              title="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 sm:px-3 py-1 text-xs font-semibold text-slate-800 text-center truncate">
              Week {reportData?.weekNumber || 1} • {formatCivilDate(reportData?.weekStart)} - {formatCivilDate(reportData?.weekEnd)}
            </span>
            <button
              type="button"
              onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-r-lg transition-colors"
              title="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {currentWeekOffset !== 0 && (
            <button
              type="button"
              onClick={() => setCurrentWeekOffset(0)}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium self-end sm:self-center whitespace-nowrap"
            >
              Jump to current week
            </button>
          )}
        </div>

        {/* Meta Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 bg-white border-b border-slate-100 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase block">Doer Name</span>
            <strong className="text-slate-800 font-medium">{selectedDoerName}</strong>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase block">Week Start Date</span>
            <span className="text-slate-700 font-medium">{formatCivilDate(reportData?.weekStart)}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase block">Week End</span>
            <span className="text-slate-700 font-medium">{formatCivilDate(reportData?.weekEnd)}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase block">Week Number</span>
            <span className="text-slate-700 font-medium">{reportData?.weekNumber || '-'}</span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-400 font-semibold uppercase block">Current Week</span>
            <span className={`font-semibold ${reportData?.isCurrentWeek ? 'text-emerald-600' : 'text-slate-500'}`}>
              {reportData?.isCurrentWeek ? 'Current week' : 'Historical'}{' '}
              <span className="font-normal text-slate-400">(now: week {reportData?.currentWeekNumber})</span>
            </span>
          </div>
        </div>

        {/* Business Logic & Industry SLA Standards Guide */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Checklist Operational Rigor & SLA Standards (% Work Not Done)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Tier 1: High Compliance
                </span>
                <span className="text-[10px] font-bold bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">
                  Target: &lt; 5% Not Done
                </span>
              </div>
              <p className="text-emerald-800 text-[11px] leading-relaxed">
                Over 95% of recurring operational checklist items completed on time. Meets enterprise operational rigor standards.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Tier 2: Attention Required
                </span>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                  Tolerance: 5% – 15%
                </span>
              </div>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Occasional checklist skips or delays due to work shifts. Routine supervisor follow-up recommended during weekly reviews.
              </p>
            </div>

            <div className="bg-rose-50 border border-rose-200/80 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Tier 3: Critical Slippage
                </span>
                <span className="text-[10px] font-bold bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded">
                  Action: &gt; 15% Not Done
                </span>
              </div>
              <p className="text-rose-800 text-[11px] leading-relaxed">
                Severe operational breakdown with recurring tasks neglected or overdue. Requires immediate managerial intervention and root-cause audit.
              </p>
            </div>
          </div>
        </div>

        {/* High-Visibility Scorecard Matrix */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-slate-500 font-semibold uppercase tracking-wider text-[11px] w-1/3">
                  Metric
                </th>
                <th className="py-3 px-4 bg-rose-50/70 border-x border-rose-100 text-rose-800 font-bold uppercase tracking-wider text-[11px] text-center w-1/3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    % Work Not Done
                  </span>
                </th>
                <th className="py-3 px-4 bg-amber-50/70 text-amber-800 font-bold uppercase tracking-wider text-[11px] text-center w-1/3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    % Work Not Done On Time
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Row 1: This Week Planned */}
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-700">
                  This Week Planned
                </td>
                <td className="py-3.5 px-4 text-center bg-rose-50/30 border-x border-rose-100 font-mono text-sm text-slate-700">
                  -
                </td>
                <td className="py-3.5 px-4 text-center bg-amber-50/30 font-mono text-sm text-slate-700">
                  -
                </td>
              </tr>

              {/* Row 2: Actual Score */}
              <tr className="bg-slate-50/50">
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  Actual Score (Click to Audit)
                </td>
                <td className="py-3.5 px-4 text-center bg-rose-50/50 border-x border-rose-100">
                  <button
                    type="button"
                    onClick={() => setBreakdownModal({
                      isOpen: true,
                      filterType: 'notDone',
                      title: 'Incomplete / Slipped Checklist Items',
                      personName: '',
                    })}
                    className="flex flex-col items-center mx-auto hover:bg-rose-100/70 p-1.5 rounded-lg transition-colors group cursor-pointer"
                    title="Click to view incomplete/slipped items"
                  >
                    <span className="text-base font-bold text-rose-700">
                      {summary.pctNotDone !== null ? `${summary.pctNotDone}%` : '—'}
                    </span>
                    <span className="text-[10px] text-rose-600 font-medium mt-0.5 group-hover:underline">
                      {summary.notDone} items (Audit)
                    </span>
                  </button>
                </td>
                <td className="py-3.5 px-4 text-center bg-amber-50/50">
                  <button
                    type="button"
                    onClick={() => setBreakdownModal({
                      isOpen: true,
                      filterType: 'notDone',
                      title: 'Items Not Completed On Time',
                      personName: '',
                    })}
                    className="flex flex-col items-center mx-auto hover:bg-amber-100/70 p-1.5 rounded-lg transition-colors group cursor-pointer"
                    title="Click to view items not done on time"
                  >
                    <span className="text-base font-bold text-amber-700">
                      {summary.pctNotDoneOnTime !== null ? `${summary.pctNotDoneOnTime}%` : '—'}
                    </span>
                    <span className="text-[10px] text-amber-600 font-medium mt-0.5 group-hover:underline">
                      {summary.notDoneOnTime} items (Audit)
                    </span>
                  </button>
                </td>
              </tr>

              {/* Row 3: Next Week Planned (Interactive Input Form) */}
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Next Week Planned Target</span>
                    {planSavedNotice && (
                      <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Saved
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 bg-rose-50/30 border-x border-rose-100 text-center">
                  <div className="inline-flex items-center justify-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={nextNotDone}
                      onChange={(e) => setNextNotDone(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-20 px-2.5 py-1 text-center font-mono text-sm bg-white border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                    <span className="text-slate-400 text-xs">%</span>
                  </div>
                </td>
                <td className="py-3 px-4 bg-amber-50/30 text-center">
                  <div className="inline-flex items-center justify-center gap-2">
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={nextNotDoneOnTime}
                        onChange={(e) => setNextNotDoneOnTime(e.target.value)}
                        placeholder="e.g. 15"
                        className="w-20 px-2.5 py-1 text-center font-mono text-sm bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                      <span className="text-slate-400 text-xs">%</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSavePlan}
                      disabled={savingPlan}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
                      title="Save Next Week Planned Target"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingPlan ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">
          Choose a doer to see and set their planned scores — or open one from the table below.
        </div>

        {/* Total In Period Summary Box (Matching Screenshot 1) */}
        <div className="p-5 border-t border-slate-200 bg-white">
          <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
            Total In This Period
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1 mb-1">
            {summary.totalPlanned}
          </div>
          <p className="text-xs text-slate-500">
            {summary.totalPlanned === 0
              ? 'Nothing matches these filters in this period, so there is nothing to score.'
              : `${summary.totalPlanned} recurring items planned across this week period.`}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Of the items planned in the period: Not Done = not completed by the end of the period; Not Done On Time = not done, plus done after the planned time.
          </p>
        </div>

        {/* BY DOER Breakdown Table */}
        <div className="border-t border-slate-200">
          <div className="p-4 bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider">
            By Doer
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30 text-[11px] font-semibold text-slate-500 uppercase">
                  <th className="py-2.5 px-4">Doer Name</th>
                  <th className="py-2.5 px-4 text-center">Planned</th>
                  <th className="py-2.5 px-4 text-center">Not Done</th>
                  <th className="py-2.5 px-4 text-center">Not Done On Time</th>
                  <th className="py-2.5 px-4 text-center text-rose-700">% Not Done</th>
                  <th className="py-2.5 px-4 text-center text-amber-700">% Not Done On Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!reportData?.byDoer || reportData.byDoer.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                      No doer has anything planned in this period.
                    </td>
                  </tr>
                ) : (
                  reportData.byDoer.map((d) => (
                    <tr
                      key={d.doerId}
                      onClick={() => setSelectedDoer(d.doerId === selectedDoer ? '' : d.doerId)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                        selectedDoer === d.doerId ? 'bg-blue-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-slate-800">
                        <div className="flex items-center justify-between gap-2">
                          <span>{d.doerName}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBreakdownModal({
                                isOpen: true,
                                filterType: 'person',
                                title: `Items for ${d.doerName}`,
                                personName: d.doerName,
                              });
                            }}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-medium hover:underline px-2 py-0.5 rounded bg-blue-50/70"
                          >
                            Inspect ({d.planned})
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-700">
                        {d.planned}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-rose-600">
                        {d.notDone}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-amber-600">
                        {d.notDoneOnTime}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-rose-700">
                        {d.pctNotDone !== null ? `${d.pctNotDone}%` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-700">
                        {d.pctNotDoneOnTime !== null ? `${d.pctNotDoneOnTime}%` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* Checklist Audit Breakdown Modal */}
      <ChecklistWeeklyItemBreakdownModal
        isOpen={breakdownModal.isOpen}
        onClose={() => setBreakdownModal((prev) => ({ ...prev, isOpen: false }))}
        filterType={breakdownModal.filterType}
        title={breakdownModal.title}
        personName={breakdownModal.personName}
        items={reportData?.items || []}
      />

      {/* Add Checklist Drawer */}
      <ChecklistTaskDrawer
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={loadReport}
      />
    </div>
  );
}
