import { useState, useEffect, useMemo } from 'react';
import { FolderGit2, RefreshCw, Hash, CheckCircle2, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { axiosClient } from '../api/axiosClient';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';

export const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/master/departments');
      const list = res?.data || res || [];
      if (Array.isArray(list)) {
        setDepartments(list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Filtered departments based on search query
  const filteredDepartments = useMemo(() => {
    if (!search.trim()) return departments;
    const q = search.toLowerCase().trim();
    return departments.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.key?.toLowerCase().includes(q) ||
        String(d.order ?? '').includes(q)
    );
  }, [departments, search]);

  // Reset to page 1 on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Pagination calculation
  const totalItems = filteredDepartments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedDepartments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDepartments.slice(start, start + pageSize);
  }, [filteredDepartments, currentPage, pageSize]);

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Departments</h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
              {departments.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational divisions for checklist & delegation grouping
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchDepartments} className="self-start sm:self-auto">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Search Bar & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments by name or key..."
            className="w-full pl-8 pr-8 py-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {totalItems} {totalItems === 1 ? 'department' : 'departments'}
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Spinner size="lg" className="text-blue-600 mx-auto" />
            <p className="text-xs text-slate-500 mt-3">Loading departments...</p>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            {search ? 'No departments match your search.' : 'No departments found.'}
          </div>
        ) : (
          <>
            {/* Mobile Card View (< sm) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {paginatedDepartments.map((dept) => (
                <div key={dept._id} className="p-3.5 space-y-2 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60">
                        <FolderGit2 className="w-3.5 h-3.5" />
                      </div>
                      <span>{dept.name}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Active</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-medium">Key:</span>
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/80">
                        {dept.key}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Hash className="w-3 h-3 text-slate-400" />
                      <span>Order: {dept.order ?? 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop & Tablet Table (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Key Code</th>
                    <th className="py-3 px-4">Sort Order</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedDepartments.map((dept) => (
                    <tr key={dept._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/50">
                          <FolderGit2 className="w-3.5 h-3.5" />
                        </div>
                        <span>{dept.name}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{dept.key}</td>
                      <td className="py-3 px-4 text-slate-600">{dept.order ?? 0}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Active</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 sm:px-4 border-t border-slate-100 gap-3 bg-slate-50/40">
                <span className="text-xs text-slate-500">
                  Showing {(currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                        currentPage === pg
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
