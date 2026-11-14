import { useState, useEffect, useMemo } from 'react';
import { Users2, Mail, Phone, Building2, Shield, RefreshCw, Search, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { axiosClient } from '../api/axiosClient';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/master/users');
      const list = res?.data || res || [];
      if (Array.isArray(list)) {
        setUsers(list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Administrator':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Manager':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.includes(q) ||
        u.department?.name?.toLowerCase().includes(q);

      const matchesRole = !roleFilter || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  // Reset pagination on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  // Pagination calculation
  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Employees & Roles</h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
              {users.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active organizational users, assignees, and role permissions
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchUsers} className="self-start sm:self-auto">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 w-full sm:max-w-xl">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, department or phone..."
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

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Roles</option>
              <option value="Administrator">Administrator</option>
              <option value="Manager">Manager</option>
              <option value="Employee">Employee</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium shrink-0">
          Showing {totalItems} of {users.length} employees
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Spinner size="lg" className="text-blue-600 mx-auto" />
            <p className="text-xs text-slate-500 mt-3">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            {search || roleFilter ? 'No users match your filters.' : 'No users found.'}
          </div>
        ) : (
          <>
            {/* Mobile Card View (< sm) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {paginatedUsers.map((u) => (
                <div key={u._id} className="p-3.5 space-y-2.5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                        {u.name?.slice(0, 2).toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{u.name}</p>
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{u.email}</span>
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${getRoleBadgeClass(u.role)}`}>
                      {u.role || 'Employee'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-100/80">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-slate-700">{u.department?.name || 'Company-wide'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-mono text-[11px] text-slate-700">{u.phone || '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop & Tablet Table (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[550px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] border border-blue-200/80 shrink-0">
                            {u.name?.slice(0, 2).toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{u.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getRoleBadgeClass(u.role)}`}>
                          {u.role || 'Employee'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {u.department?.name || 'Company-wide'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {u.phone || '—'}
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
                  {Math.min(currentPage * pageSize, totalItems)} of {totalItems} employees
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
