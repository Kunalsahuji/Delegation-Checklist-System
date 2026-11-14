import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle 
} from 'lucide-react';
import { checklistApi } from '../api/checklistApi';
import { Spinner } from '../../../components/Spinner';

export default function ChecklistPersonPerformanceReport({ departments = [], users = [] }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    const loadPerformance = async () => {
      setLoading(true);
      try {
        const res = await checklistApi.listOccurrences({ limit: 1000 });
        const items = res?.items || res?.data?.items || [];

        const map = new Map();

        // Initialize map with known users
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
            skipped: 0,
          });
        });

        // Unassigned bucket
        map.set('unassigned', {
          id: 'unassigned',
          name: 'Unassigned',
          role: '-',
          department: '-',
          total: 0,
          completed: 0,
          pending: 0,
          overdue: 0,
          skipped: 0,
        });

        items.forEach((it) => {
          const key = it.assignedTo?._id ? String(it.assignedTo._id) : 'unassigned';
          if (!map.has(key)) {
            map.set(key, {
              id: key,
              name: it.assignedToName || it.assignedTo?.name || 'Unknown',
              role: it.assignedTo?.role || '-',
              department: it.departmentName || it.department?.name || 'Company-wide',
              total: 0,
              completed: 0,
              pending: 0,
              overdue: 0,
              skipped: 0,
            });
          }

          const entry = map.get(key);
          entry.total += 1;

          const state = it.derivedStatus || it.status;
          if (state === 'done') entry.completed += 1;
          else if (state === 'overdue') entry.overdue += 1;
          else if (state === 'skipped') entry.skipped += 1;
          else entry.pending += 1;
        });

        const list = Array.from(map.values())
          .filter((r) => r.total > 0 || r.id !== 'unassigned')
          .map((r) => {
            const completionRate = r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0;
            const notDoneCount = r.pending + r.overdue + r.skipped;
            const notDoneRate = r.total > 0 ? Math.round((notDoneCount / r.total) * 100) : 0;
            return {
              ...r,
              completionRate,
              notDoneRate,
            };
          })
          .sort((a, b) => b.total - a.total);

        setRows(list);
      } catch (err) {
        console.error('Failed to load checklist person performance', err);
      } finally {
        setLoading(false);
      }
    };

    loadPerformance();
  }, [users]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchSearch =
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.department.toLowerCase().includes(search.toLowerCase());
      const matchDept = !department || r.department === department;
      return matchSearch && matchDept;
    });
  }, [rows, search, department]);

  const handleExportCSV = () => {
    if (!filteredRows.length) return;
    const headers = [
      'S.No',
      'Person Name',
      'Role',
      'Department',
      'Total Scheduled Items',
      'Completed',
      'Pending',
      'Overdue',
      'Skipped',
      'Completion Rate (%)',
      '% Work Not Done',
    ];

    const csvRows = filteredRows.map((r, idx) => [
      idx + 1,
      `"${r.name}"`,
      `"${r.role}"`,
      `"${r.department}"`,
      r.total,
      r.completed,
      r.pending,
      r.overdue,
      r.skipped,
      `${r.completionRate}%`,
      `${r.notDoneRate}%`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `checklist_person_performance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search person or department..."
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
            <p className="text-xs">Computing checklist compliance metrics...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 w-12 text-center">S.No</th>
                  <th className="py-3 px-4">Person Name</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3 text-center">Scheduled</th>
                  <th className="py-3 px-3 text-center">Completed</th>
                  <th className="py-3 px-3 text-center">Pending</th>
                  <th className="py-3 px-3 text-center">Overdue</th>
                  <th className="py-3 px-3 text-center">Skipped</th>
                  <th className="py-3 px-4 min-w-[140px]">Completion Rate</th>
                  <th className="py-3 px-4 min-w-[140px]">% Work Not Done</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {r.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{r.name}</p>
                          <p className="text-[10px] text-slate-400">{r.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {r.department}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800 tabular-nums">
                      {r.total}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-emerald-600 tabular-nums">
                      {r.completed}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-amber-600 tabular-nums">
                      {r.pending}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-rose-600 tabular-nums">
                      {r.overdue}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-600 tabular-nums">
                      {r.skipped}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${r.completionRate}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-800 tabular-nums min-w-[32px] text-right">
                          {r.completionRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              r.notDoneRate <= 5 ? 'bg-emerald-500' : r.notDoneRate <= 15 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, r.notDoneRate)}%` }}
                          />
                        </div>
                        <span className={`font-semibold tabular-nums min-w-[32px] text-right ${
                          r.notDoneRate <= 5 ? 'text-emerald-700' : r.notDoneRate <= 15 ? 'text-amber-700' : 'text-rose-700'
                        }`}>
                          {r.notDoneRate}%
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
