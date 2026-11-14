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
  RotateCcw,
  Info,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { delegationApi } from '../api/delegationApi';
import { axiosClient } from '../../../api/axiosClient';
import AddDelegationModal from '../components/AddDelegationModal';
import DelegationRegisterReport from '../components/DelegationRegisterReport';
import DelegationPersonPerformanceReport from '../components/DelegationPersonPerformanceReport';
import DelegationWeeklyTaskBreakdownModal from '../components/DelegationWeeklyTaskBreakdownModal';

const formatCivilDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getUTCDate()).padStart(2, '0')}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
};

export default function DelegationWeeklyReportPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Filters
  const [selectedDoer, setSelectedDoer] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Master data
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  // Planning targets (Next week planned)
  const [nextRed, setNextRed] = useState('');
  const [nextYellow, setNextYellow] = useState('');
  const [nextGreen, setNextGreen] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);
  const [planSavedNotice, setPlanSavedNotice] = useState(false);

  // Report selector
  const [reportKey, setReportKey] = useState('delegationWeekly');

  // Breakdown Audit Modal
  const [breakdownModal, setBreakdownModal] = useState({
    isOpen: false,
    category: 'all',
    title: '',
    doerName: '',
  });

  // Modal
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Load Masters
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [dRes, pRes, uRes] = await Promise.all([
          axiosClient.get('/master/departments'),
          axiosClient.get('/master/projects'),
          axiosClient.get('/master/users'),
        ]);
        setDepartments(Array.isArray(dRes?.data) ? dRes.data : []);
        setProjects(Array.isArray(pRes?.data) ? pRes.data : []);
        setUsers(Array.isArray(uRes?.data) ? uRes.data : []);
      } catch (err) {
        console.error('Failed to load masters', err);
      }
    };
    fetchMasters();
  }, []);

  const getTargetWeekDate = (offsetWeeks) => {
    const now = new Date();
    now.setUTCDate(now.getUTCDate() + offsetWeeks * 7);
    return now.toISOString();
  };

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      const targetDate = getTargetWeekDate(currentWeekOffset);
      const res = await delegationApi.getWeeklyReport({
        weekStart: targetDate,
        department: selectedDept,
        project: selectedProject,
        assignee: selectedDoer,
      });

      const data = res?.data || res;
      setReportData(data);

      const doerTarget = selectedDoer
        ? data.byDoer?.find((d) => d.doerId === selectedDoer)
        : data.byDoer?.[0];

      if (doerTarget?.nextWeekPlanned) {
        setNextRed(doerTarget.nextWeekPlanned.red ?? '');
        setNextYellow(doerTarget.nextWeekPlanned.yellow ?? '');
        setNextGreen(doerTarget.nextWeekPlanned.green ?? '');
      } else {
        setNextRed('');
        setNextYellow('');
        setNextGreen('');
      }
    } catch (err) {
      console.error('Failed to load delegation weekly report', err);
    } finally {
      setLoading(false);
    }
  }, [currentWeekOffset, selectedDept, selectedProject, selectedDoer]);

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
      await delegationApi.saveWeeklyPlan({
        assignedTo: targetDoerId,
        weekStart: reportData.weekStart,
        next: {
          red: nextRed !== '' ? Number(nextRed) : null,
          yellow: nextYellow !== '' ? Number(nextYellow) : null,
          green: nextGreen !== '' ? Number(nextGreen) : null,
        },
      });
      setPlanSavedNotice(true);
      setTimeout(() => setPlanSavedNotice(false), 3000);
      loadReport();
    } catch (err) {
      console.error('Failed to save delegation target plan', err);
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
      ['Doer Name', 'Total Tasks', 'Green Tasks (0 rev)', 'Yellow Tasks (1 rev)', 'Red Tasks (2+ rev)', '% Green', '% Yellow', '% Red'],
    ];

    if (reportData.byDoer && reportData.byDoer.length > 0) {
      reportData.byDoer.forEach((d) => {
        rows.push([
          `"${d.doerName}"`,
          d.total,
          d.green,
          d.yellow,
          d.red,
          d.pctGreen !== null ? `${d.pctGreen}%` : '-',
          d.pctYellow !== null ? `${d.pctYellow}%` : '-',
          d.pctRed !== null ? `${d.pctRed}%` : '-',
        ]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Delegation_RYG_Report_Week_${reportData.weekNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = reportData?.summary || { totalTasks: 0, green: 0, yellow: 0, red: 0, pctGreen: null, pctYellow: null, pctRed: null };
  const selectedDoerName = selectedDoer ? users.find((u) => u._id === selectedDoer)?.name : 'All doers';

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
            <span className="text-slate-400">Delegation</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-800 font-semibold">Report</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 ml-1 cursor-pointer hover:text-slate-600" />
          </div>
          <p className="text-xs text-slate-500">
            Assigned work and due-date tracking
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Delegation</span>
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
              <option value="delegationWeekly">Weekly performance — Red / Yellow / Green</option>
              <option value="delegationRegister">Delegations — tasks, dates and revisions</option>
              <option value="delegationPerformance">Person-wise performance — who did what</option>
            </select>
          </div>

          {reportKey === 'delegationWeekly' && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  showFilters || selectedDept || selectedDoer || selectedProject
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters {selectedDept || selectedDoer || selectedProject ? '(active)' : ''}</span>
              </button>
            </div>
          )}
        </div>

        {/* Collapsible Filter Bar (Weekly View) */}
        {reportKey === 'delegationWeekly' && showFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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
                Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="">All projects</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
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
                onClick={() => { setSelectedDept(''); setSelectedProject(''); setSelectedDoer(''); }}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs text-slate-500 hover:text-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset filters</span>
              </button>
            </div>
          </div>
        )}

        <div className="text-[11px] text-slate-400 font-medium">
          Period: {reportKey === 'delegationWeekly' ? 'Weekly' : 'Comprehensive Register'}
        </div>
      </div>

      {/* RENDER CONDITIONAL REPORT VIEW */}
      {reportKey === 'delegationRegister' ? (
        <DelegationRegisterReport departments={departments} users={users} projects={projects} />
      ) : reportKey === 'delegationPerformance' ? (
        <DelegationPersonPerformanceReport departments={departments} users={users} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Card Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Weekly performance — Red / Yellow / Green
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Green: the date never moved. Yellow: it moved once. Red: it moved twice or more. Each is a share of the period's tasks, counted by their latest due date.
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
            <span>Business Logic & SLA Guidelines (Red / Yellow / Green)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Green Score (On-Time)
                </span>
                <span className="text-[10px] font-bold bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">
                  Target: ≥ 85%
                </span>
              </div>
              <p className="text-emerald-800 text-[11px] leading-relaxed">
                Tasks delivered strictly on or before their committed due date with <strong>0 revisions</strong>. Demonstrates high scheduling accuracy and operational reliability.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Yellow Score (Managed Delay)
                </span>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                  Tolerance: ≤ 10%
                </span>
              </div>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Tasks extended <strong>exactly 1 time</strong> with a recorded and approved reason. Acceptable buffer for unexpected supplier or client dependencies without chronic slippage.
              </p>
            </div>

            <div className="bg-rose-50 border border-rose-200/80 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Red Score (High Risk)
                </span>
                <span className="text-[10px] font-bold bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded">
                  Tolerance: ≤ 5%
                </span>
              </div>
              <p className="text-rose-800 text-[11px] leading-relaxed">
                Tasks rescheduled <strong>2 or more times</strong>, or currently overdue past committed extensions. Critical risk indicator requiring direct executive intervention.
              </p>
            </div>
          </div>
        </div>

        {/* Scorecard Matrix */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-slate-500 font-semibold uppercase tracking-wider text-[11px] w-1/4">
                  Metric
                </th>
                <th className="py-3 px-4 bg-rose-50/70 border-x border-rose-100 text-rose-800 font-bold uppercase tracking-wider text-[11px] text-center w-1/4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Red Score
                  </span>
                </th>
                <th className="py-3 px-4 bg-amber-50/70 border-r border-amber-100 text-amber-800 font-bold uppercase tracking-wider text-[11px] text-center w-1/4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Yellow Score
                  </span>
                </th>
                <th className="py-3 px-4 bg-emerald-50/70 text-emerald-800 font-bold uppercase tracking-wider text-[11px] text-center w-1/4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Green Score
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
                <td className="py-3.5 px-4 text-center bg-amber-50/30 border-r border-amber-100 font-mono text-sm text-slate-700">
                  -
                </td>
                <td className="py-3.5 px-4 text-center bg-emerald-50/30 font-mono text-sm text-slate-700">
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
                      category: 'red',
                      title: 'Red Score Tasks (2+ Revisions)',
                      doerName: '',
                    })}
                    className="flex flex-col items-center mx-auto hover:bg-rose-100/70 p-1.5 rounded-lg transition-colors group cursor-pointer"
                    title="Click to view all Red tasks"
                  >
                    <span className="text-base font-bold text-rose-700">
                      {summary.pctRed !== null ? `${summary.pctRed}%` : '—'}
                    </span>
                    <span className="text-[10px] text-rose-600 font-medium mt-0.5 group-hover:underline">
                      {summary.red} tasks (Audit)
                    </span>
                  </button>
                </td>
                <td className="py-3.5 px-4 text-center bg-amber-50/50 border-r border-amber-100">
                  <button
                    type="button"
                    onClick={() => setBreakdownModal({
                      isOpen: true,
                      category: 'yellow',
                      title: 'Yellow Score Tasks (1 Revision)',
                      doerName: '',
                    })}
                    className="flex flex-col items-center mx-auto hover:bg-amber-100/70 p-1.5 rounded-lg transition-colors group cursor-pointer"
                    title="Click to view all Yellow tasks"
                  >
                    <span className="text-base font-bold text-amber-700">
                      {summary.pctYellow !== null ? `${summary.pctYellow}%` : '—'}
                    </span>
                    <span className="text-[10px] text-amber-600 font-medium mt-0.5 group-hover:underline">
                      {summary.yellow} tasks (Audit)
                    </span>
                  </button>
                </td>
                <td className="py-3.5 px-4 text-center bg-emerald-50/50">
                  <button
                    type="button"
                    onClick={() => setBreakdownModal({
                      isOpen: true,
                      category: 'green',
                      title: 'Green Score Tasks (0 Revisions / On-Time)',
                      doerName: '',
                    })}
                    className="flex flex-col items-center mx-auto hover:bg-emerald-100/70 p-1.5 rounded-lg transition-colors group cursor-pointer"
                    title="Click to view all Green tasks"
                  >
                    <span className="text-base font-bold text-emerald-700">
                      {summary.pctGreen !== null ? `${summary.pctGreen}%` : '—'}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium mt-0.5 group-hover:underline">
                      {summary.green} tasks (Audit)
                    </span>
                  </button>
                </td>
              </tr>

              {/* Row 3: Next Week Planned (Interactive Form) */}
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
                      value={nextRed}
                      onChange={(e) => setNextRed(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-16 px-2 py-1 text-center font-mono text-sm bg-white border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                    <span className="text-slate-400 text-xs">%</span>
                  </div>
                </td>
                <td className="py-3 px-4 bg-amber-50/30 border-r border-amber-100 text-center">
                  <div className="inline-flex items-center justify-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={nextYellow}
                      onChange={(e) => setNextYellow(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-16 px-2 py-1 text-center font-mono text-sm bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <span className="text-slate-400 text-xs">%</span>
                  </div>
                </td>
                <td className="py-3 px-4 bg-emerald-50/30 text-center">
                  <div className="inline-flex items-center justify-center gap-2">
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={nextGreen}
                        onChange={(e) => setNextGreen(e.target.value)}
                        placeholder="e.g. 80"
                        className="w-16 px-2 py-1 text-center font-mono text-sm bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      <span className="text-slate-400 text-xs">%</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSavePlan}
                      disabled={savingPlan}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
                      title="Save Next Week Planned Targets"
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

        {/* Total In Period Summary Box (Matching Screenshot 2) */}
        <div className="p-5 border-t border-slate-200 bg-white">
          <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
            Total In This Period
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1 mb-1">
            {summary.totalTasks}
          </div>
          <p className="text-xs text-slate-500">
            {summary.totalTasks === 0
              ? 'Nothing matches these filters in this period, so there is nothing to score.'
              : `${summary.totalTasks} delegation tasks tracked in this period.`}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Green: no revisions · Yellow: 1 revision · Red: 2 or more.
          </p>
        </div>

        {/* BY DOER Breakdown Table */}
        <div className="border-t border-slate-200">
          <div className="p-4 bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider">
            By Doer
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30 text-[11px] font-semibold text-slate-500 uppercase">
                  <th className="py-2.5 px-4">Doer Name</th>
                  <th className="py-2.5 px-4 text-center">Total Tasks</th>
                  <th className="py-2.5 px-4 text-center text-emerald-700">Green</th>
                  <th className="py-2.5 px-4 text-center text-amber-700">Yellow</th>
                  <th className="py-2.5 px-4 text-center text-rose-700">Red</th>
                  <th className="py-2.5 px-4 text-center font-bold text-emerald-700">% Green</th>
                  <th className="py-2.5 px-4 text-center font-bold text-amber-700">% Yellow</th>
                  <th className="py-2.5 px-4 text-center font-bold text-rose-700">% Red</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!reportData?.byDoer || reportData.byDoer.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400 text-xs">
                      No doer has anything in this period.
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
                                category: 'doer',
                                title: `Tasks for ${d.doerName}`,
                                doerName: d.doerName,
                              });
                            }}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-medium hover:underline px-2 py-0.5 rounded bg-blue-50/70"
                          >
                            Inspect ({d.total})
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-700">
                        {d.total}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-600">
                        {d.green}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-amber-600">
                        {d.yellow}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-rose-600">
                        {d.red}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                        {d.pctGreen !== null ? `${d.pctGreen}%` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-700">
                        {d.pctYellow !== null ? `${d.pctYellow}%` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-rose-700">
                        {d.pctRed !== null ? `${d.pctRed}%` : '—'}
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

      {/* Task Audit Breakdown Modal */}
      <DelegationWeeklyTaskBreakdownModal
        isOpen={breakdownModal.isOpen}
        onClose={() => setBreakdownModal((prev) => ({ ...prev, isOpen: false }))}
        category={breakdownModal.category}
        title={breakdownModal.title}
        doerName={breakdownModal.doerName}
        tasks={reportData?.tasks || []}
      />

      {/* Add Delegation Modal */}
      <AddDelegationModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={async (payload) => {
          await delegationApi.createTask(payload);
          loadReport();
        }}
        users={users}
        projects={projects}
      />
    </div>
  );
}
