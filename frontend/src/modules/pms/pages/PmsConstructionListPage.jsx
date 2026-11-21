import React, { useState, useEffect } from 'react';
import {
  HardHat,
  Calendar,
  Users,
  Package,
  Camera,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RotateCw,
  Info,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowRight,
  Activity,
  Layers,
  Thermometer,
  ShieldCheck,
} from 'lucide-react';
import { pmsConstructionApi } from '../../../api/pmsConstructionApi';
import ConstructionWorkspaceModal from '../components/ConstructionWorkspaceModal';

function formatCurrency(val) {
  if (!val || isNaN(val)) return '₹0';
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

const STATUS_CONFIG = {
  siteMobilized: { label: 'Site Mobilized', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  inProgress: { label: 'Active Execution', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  reviewPending: { label: 'Awaiting Sign-off', color: 'bg-yellow-50 text-yellow-800 border-yellow-300' },
  approved: { label: 'Certified & Approved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected / Revision', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function PmsConstructionListPage() {
  const [kpis, setKpis] = useState({
    total: 0,
    inProgress: 0,
    reviewPending: 0,
    approved: 0,
    totalDprCount: 0,
    totalManHours: 0,
    totalLabourCost: 0,
    totalMaterialCost: 0,
    totalPhotosCount: 0,
  });

  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedRecordId, setSelectedRecordId] = useState(null);

  useEffect(() => {
    fetchKPIs();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [page, search, statusFilter]);

  const fetchKPIs = async () => {
    try {
      const res = await pmsConstructionApi.getKPIs();
      if (res?.success) {
        setKpis(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch construction KPIs:', err);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search,
      };

      if (statusFilter === 'hasDpr') {
        params.hasDpr = true;
      } else if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const res = await pmsConstructionApi.listRecords(params);
      if (res?.success) {
        const payload = res.data;
        setRecords(payload.records || []);
        setTotal(payload.pagination?.total || 0);
        setTotalPages(payload.pagination?.totalPages || payload.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch construction records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKpiFilter = (newFilter) => {
    setStatusFilter(newFilter);
    setPage(1);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
              Construction Execution
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Construction Execution Engine</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily Progress Reports (DPR), labour gang deployments, material consumption, and quality inspections.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchKPIs();
              fetchRecords();
            }}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5 Interactive 3-Liner KPI Cards with (i) Tooltips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* KPI 1 */}
        <div
          onClick={() => handleKpiFilter('all')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] flex flex-col justify-between ${
            statusFilter === 'all'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <HardHat className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Sites</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Total active construction execution tracking records under monitoring. Click to clear filters.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">All monitored sites</div>
        </div>

        {/* KPI 2 */}
        <div
          onClick={() => handleKpiFilter('inProgress')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] flex flex-col justify-between ${
            statusFilter === 'inProgress'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Execution</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Sites executing daily shifts, labour deployments, and structural works. Click to filter active sites.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-blue-700 mt-1">{kpis.inProgress}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Civil works active</div>
        </div>

        {/* KPI 3 */}
        <div
          onClick={() => handleKpiFilter('reviewPending')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] flex flex-col justify-between ${
            statusFilter === 'reviewPending'
              ? 'bg-yellow-50/70 border-yellow-300 ring-2 ring-yellow-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-yellow-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Awaiting Sign-off</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Daily DPR logs and quality inspections submitted pending Project Manager review.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-yellow-700 mt-1">{kpis.reviewPending}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Review queue</div>
        </div>

        {/* KPI 4 */}
        <div
          onClick={() => handleKpiFilter('approved')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] flex flex-col justify-between ${
            statusFilter === 'approved'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Certified & Approved</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Execution certified and approved. Projects advanced to Stage 9 (Quality Control).
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">{kpis.approved}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Stage 9 advanced</div>
        </div>

        {/* KPI 5 (CLICKABLE & ACCESSIBLE!) */}
        <div
          onClick={() => handleKpiFilter('hasDpr')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] flex flex-col justify-between ${
            statusFilter === 'hasDpr'
              ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total DPR Reports</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Total daily progress reports logged across all active sites. Click to filter projects with DPR logs.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-purple-700 mt-1">{kpis.totalDprCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Logged work reports</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by project name or code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => handleKpiFilter(e.target.value)}
              className="border border-slate-200 rounded-lg text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="inProgress">Active Execution</option>
              <option value="reviewPending">Awaiting Sign-off</option>
              <option value="approved">Approved & Certified</option>
              <option value="hasDpr">Has DPR Logs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Default Table View */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Project & Code</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-center">DPR Count</th>
                <th className="py-3 px-4 text-center">Man-Hours</th>
                <th className="py-3 px-4 text-right">Labour Cost</th>
                <th className="py-3 px-4 text-right">Material Cost</th>
                <th className="py-3 px-4 text-center">Quality Pass</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    <Clock className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                    Loading construction execution records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    No construction execution records match the selected filter.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.inProgress;
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{r.project?.name || 'Unnamed Project'}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {r.code} • Stage {r.project?.stageOrder || 8}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {r.project?.location || 'Jaipur'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-800">{r.totalDprCount || 0}</span>
                        <span className="text-[10px] text-slate-400 block">Reports</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-slate-700">{r.totalManHours || 0}</span>
                        <span className="text-[10px] text-slate-400 block">Hours</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-700">
                        {formatCurrency(r.totalLabourCost)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-700">
                        {formatCurrency(r.totalMaterialCost)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs font-semibold text-emerald-600">
                          {r.overallPassRate || 100}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {r.status === "certified" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {cfg.label}
                          </span>
                        ) : r.status === "activeExecution" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                            <Activity className="w-3.5 h-3.5" />
                            {cfg.label}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                            <Clock className="w-3.5 h-3.5" />
                            {cfg.label}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedRecordId(r._id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors cursor-pointer"
                        >
                          <span>Workspace</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Contextual Pagination */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing page <strong className="text-slate-700">{page}</strong> of{' '}
            <strong className="text-slate-700">{totalPages}</strong> (
            <strong className="text-slate-700">{total}</strong> construction execution logs)
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 border border-slate-200 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 border border-slate-200 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Modal */}
      {selectedRecordId && (
        <ConstructionWorkspaceModal
          recordId={selectedRecordId}
          onClose={() => setSelectedRecordId(null)}
          onRefresh={() => {
            fetchKPIs();
            fetchRecords();
          }}
        />
      )}
    </div>
  );
}
