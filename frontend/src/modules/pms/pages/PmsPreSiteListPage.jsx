import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  BadgePercent,
  FileSignature,
  Truck,
  ShieldCheck,
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
  Zap,
  Droplets,
  Building,
} from 'lucide-react';
import { pmsPreSiteApi } from '../../../api/pmsPreSiteApi';
import PreSiteStartWorkspaceModal from '../components/PreSiteStartWorkspaceModal';

function formatCurrency(val) {
  if (!val || isNaN(val)) return '₹0';
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

const STATUS_CONFIG = {
  contractorSelection: { label: 'Contractor Selection', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  rateFinalization: { label: 'Rate Finalization', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  workOrder: { label: 'WO Agreement', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  siteSetup: { label: 'Site Setup', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  managementApproval: { label: 'Approval Pending', color: 'bg-yellow-50 text-yellow-800 border-yellow-300' },
  approved: { label: 'Approved & Mobilized', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function PmsPreSiteListPage() {
  const [kpis, setKpis] = useState({
    total: 0,
    inPreSite: 0,
    approvalPending: 0,
    approved: 0,
    totalContractValue: 0,
    siteMobilizedCount: 0,
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
      const res = await pmsPreSiteApi.getKPIs();
      if (res?.success) {
        setKpis(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch pre-site KPIs:', err);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await pmsPreSiteApi.listRecords({
        page,
        limit,
        search,
        status: statusFilter,
      });
      if (res?.success) {
        setRecords(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch pre-site records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKpiFilter = (filterKey) => {
    setStatusFilter(filterKey);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 font-bold border border-brand-200">
              Pre-Site Start
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Pre-Site Start & Contractor Selection</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Contractor procurement, unit rate finalization, work order agreements, and site mobilization setup.
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
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            statusFilter === 'all'
              ? 'bg-brand-50/70 border-brand-300 ring-2 ring-brand-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-brand-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Workflows</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Total registered pre-site mobilization workflows.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">All pre-site records</div>
        </div>

        {/* KPI 2 */}
        <div
          onClick={() => handleKpiFilter('inPreSite')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            statusFilter === 'inPreSite'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">In Procurement</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Projects currently finalizing contractor, rates, work order, or site utilities.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-blue-700 mt-1">{kpis.inPreSite}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Procurement active</div>
        </div>

        {/* KPI 3 */}
        <div
          onClick={() => handleKpiFilter('managementApproval')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            statusFilter === 'managementApproval'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Awaiting Sign-off</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                All 4 pre-site checklist items completed and submitted for executive sanction.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-amber-700 mt-1">{kpis.approvalPending}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Gate review queue</div>
        </div>

        {/* KPI 4 */}
        <div
          onClick={() => handleKpiFilter('approved')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
            statusFilter === 'approved'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mobilized & Approved</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Sanctioned projects with mobilized site ready for Baseline Lock.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">{kpis.approved}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Stage 6 advanced</div>
        </div>

        {/* KPI 5 */}
        <div
          onClick={() => handleKpiFilter('hasWorkOrder')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] flex flex-col justify-between ${
            statusFilter === 'hasWorkOrder'
              ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileSignature className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Work Orders</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Cumulative value of formal contractor work orders executed. Click to filter records with work orders.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-purple-700 mt-1">
            {formatCurrency(kpis.totalContractValue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Contract commitments</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search code, contractor, or WO number..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-brand-500 bg-white"
          >
            <option value="all">All Stages & Statuses</option>
            <option value="inPreSite">In Procurement (Active)</option>
            <option value="contractorSelection">Step: Contractor Selection</option>
            <option value="rateFinalization">Step: Rate Finalization</option>
            <option value="workOrder">Step: WO Agreement</option>
            <option value="siteSetup">Step: Site Mobilization</option>
            <option value="hasWorkOrder">With Executed Work Order</option>
            <option value="managementApproval">Awaiting Management Sign-off</option>
            <option value="approved">Approved & Mobilized</option>
          </select>

          {(search || statusFilter !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-slate-800 underline px-2 py-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Default Table View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Code & Project</th>
                <th className="py-3 px-4">Contractor & Agency</th>
                <th className="py-3 px-4">Work Order Details</th>
                <th className="py-3 px-4">Contract Value</th>
                <th className="py-3 px-4">Site Readiness</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading pre-site mobilization records...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No pre-site records found matching criteria.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const statusConf = STATUS_CONFIG[r.status] || {
                    label: r.status,
                    color: 'bg-slate-100 text-slate-700 border-slate-200',
                  };
                  const water = r.siteSetup?.waterConnection?.ready;
                  const power = r.siteSetup?.powerConnection?.ready;
                  const barricade = r.siteSetup?.barricading?.ready;

                  return (
                    <tr
                      key={r._id}
                      onClick={() => setSelectedRecordId(r._id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/60">
                            {r.code}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 hover:text-brand-600">
                              {r.project?.name || 'Unnamed Project'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              Stage {r.project?.stageOrder}/13: {r.project?.currentStageName || 'Pre-Site Start'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {r.contractorSelection?.contractorName || 'Pending contractor'}
                        </div>
                        <div className="text-[11px] text-slate-400 capitalize">
                          {r.contractorSelection?.trade ? `${r.contractorSelection.trade} trade` : 'Trade open'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-800 font-medium">
                          {r.workOrder?.workOrderNumber || 'Draft WO'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {r.workOrder?.issueDate ? new Date(r.workOrder.issueDate).toLocaleDateString() : 'Unissued'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-emerald-800">
                          {formatCurrency(r.workOrder?.contractValue)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {r.workOrder?.advanceAmount ? `Advance: ${formatCurrency(r.workOrder.advanceAmount)}` : 'Advance pending'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            title={water ? 'Water source ready' : 'Water pending'}
                            className={`p-1 rounded ${water ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-300'}`}
                          >
                            <Droplets className="w-3 h-3" />
                          </span>
                          <span
                            title={power ? 'Power source ready' : 'Power pending'}
                            className={`p-1 rounded ${power ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-300'}`}
                          >
                            <Zap className="w-3 h-3" />
                          </span>
                          <span
                            title={barricade ? 'Barricading ready' : 'Barricading pending'}
                            className={`p-1 rounded ${barricade ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-300'}`}
                          >
                            <Building className="w-3 h-3" />
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Eng: {r.siteSetup?.siteEngineerName ? r.siteSetup.siteEngineerName.split(' ')[0] : 'Open'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold whitespace-nowrap text-slate-700">{statusConf.label}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecordId(r._id);
                          }}
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
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
          <div>
            Showing page <span className="font-semibold text-slate-800">{page}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalPages}</span> ({total} pre-site mobilization records)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 border border-slate-200 rounded hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 border border-slate-200 rounded hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stage 5 Workspace Modal */}
      {selectedRecordId && (
        <PreSiteStartWorkspaceModal
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
