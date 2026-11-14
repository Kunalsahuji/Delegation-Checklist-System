import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRightLeft,
  ChevronRight
} from 'lucide-react';
import { delegationApi } from '../api/delegationApi';
import { Spinner } from '../../../components/Spinner';

export default function DelegationPersonPerformanceReport({ departments = [], users = [] }) {
  const [loading, setLoading] = useState(true);
  const [performanceRows, setPerformanceRows] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    const loadPerformance = async () => {
      setLoading(true);
      try {
        // Fetch full delegation items to aggregate person-wise metrics
        const res = await delegationApi.list({ limit: 1000 });
        const items = res?.items || res?.data?.items || [];

        const map = new Map();

        // Initialize with all known users
        users.forEach((u) => {
          map.set(String(u._id), {
            id: String(u._id),
            name: u.name,
            role: u.role,
            department: u.department?.name || 'Company-wide',
            total: 0,
            completed: 0,
            pending: 0,
            overdue: 0,
            weekShifted: 0,
            cancelled: 0,
            revised: 0,
          });
        });

        // Add an Unassigned bucket
        map.set('unassigned', {
          id: 'unassigned',
          name: 'Unassigned',
          role: '-',
          department: '-',
          total: 0,
          completed: 0,
          pending: 0,
          overdue: 0,
          weekShifted: 0,
          cancelled: 0,
          revised: 0,
        });

        // Aggregate actual tasks
        items.forEach((t) => {
          const key = t.assignedTo?._id ? String(t.assignedTo._id) : 'unassigned';
          if (!map.has(key)) {
            map.set(key, {
              id: key,
              name: t.assignedTo?.name || 'Unknown',
              role: t.assignedTo?.role || '-',
              department: t.department?.name || 'Company-wide',
              total: 0,
              completed: 0,
              pending: 0,
              overdue: 0,
              weekShifted: 0,
              cancelled: 0,
              revised: 0,
            });
          }

          const entry = map.get(key);
          entry.total += 1;

          if (t.status === 'completed') entry.completed += 1;
          else if (t.status === 'weekShifted') entry.weekShifted += 1;
          else if (t.status === 'cancelled') entry.cancelled += 1;
          else if (t.isOverdue) entry.overdue += 1;
          else if (t.status === 'pending') entry.pending += 1;

          if ((t.revisionCount || 0) > 0) {
            entry.revised += 1;
          }
        });

        // Calculate rates
        const rows = Array.from(map.values())
          .filter((r) => r.total > 0 || r.id !== 'unassigned')
          .map((r) => {
            const completionRate = r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0;
            const onTimeCount = Math.max(0, r.completed - r.revised);
            const onTimeRate = r.total > 0 ? Math.round((onTimeCount / r.total) * 100) : 0;
            return {
              ...r,
              completionRate,
              onTimeRate,
            };
          })
          .sort((a, b) => b.total - a.total);

        setPerformanceRows(rows);
      } catch (err) {
        console.error('Failed to aggregate person performance', err);
      } finally {
        setLoading(false);
      }
    };

    loadPerformance();
  }, [users]);

  // Filter rows
  const filteredRows = useMemo(() => {
    return performanceRows.filter((r) => {
      const matchSearch =
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.department.toLowerCase().includes(search.toLowerCase());
      const matchDept = !department || r.department === department;
      return matchSearch && matchDept;
    });
  }, [performanceRows, search, department]);

  // CSV Export
  const handleExportCSV = () => {
    if (!filteredRows.length) return;
    const headers = [
      'S.No',
      'Doer Name',
      'Role',
      'Department',
      'Total Assigned',
      'Completed',
      'Pending',
      'Overdue',
      'Week Shifted',
      'Cancelled',
      'Revised Tasks',
      'Completion Rate (%)',
      'On-Time Rate (%)',
    ];

    const rows = filteredRows.map((r, idx) => [
      idx + 1,
      `"${r.name}"`,
      `"${r.role}"`,
      `"${r.department}"`,
      r.total,
      r.completed,
      r.pending,
      r.overdue,
      r.weekShifted,
      r.cancelled,
      r.revised,
      `${r.completionRate}%`,
      `${r.onTimeRate}%`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `delegation_person_performance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search team member or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 w-full sm:w-auto"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d.name}>{d.name}</option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Spinner size="lg" className="text-blue-600" />
            <p className="text-xs">Computing person-wise performance scores...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 w-12 text-center">S.No</th>
                  <th className="py-3 px-4">Doer Name</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3 text-center">Total Assigned</th>
                  <th className="py-3 px-3 text-center">Completed</th>
                  <th className="py-3 px-3 text-center">Pending</th>
                  <th className="py-3 px-3 text-center">Overdue</th>
                  <th className="py-3 px-3 text-center">Week Shifted</th>
                  <th className="py-3 px-3 text-center">Revised</th>
                  <th className="py-3 px-4 min-w-[140px]">Completion Rate</th>
                  <th className="py-3 px-4 min-w-[140px]">On-Time Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {row.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{row.name}</p>
                          <p className="text-[10px] text-slate-400">{row.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {row.department}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800 tabular-nums">
                      {row.total}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-emerald-600 tabular-nums">
                      {row.completed}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-amber-600 tabular-nums">
                      {row.pending}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-rose-600 tabular-nums">
                      {row.overdue}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-orange-600 tabular-nums">
                      {row.weekShifted}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-slate-600 tabular-nums">
                      {row.revised}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${row.completionRate}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-800 tabular-nums min-w-[32px] text-right">
                          {row.completionRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              row.onTimeRate >= 80 ? 'bg-blue-600' : row.onTimeRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${row.onTimeRate}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-800 tabular-nums min-w-[32px] text-right">
                          {row.onTimeRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
