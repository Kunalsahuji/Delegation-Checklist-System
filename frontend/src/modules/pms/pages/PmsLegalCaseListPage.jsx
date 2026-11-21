import React, { useState, useEffect } from 'react';
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  Info,
  RotateCw,
  Building2,
} from 'lucide-react';
import { pmsLegalApi } from '../../../api/pmsLegalApi';
import LegalCaseWorkspaceModal from '../components/LegalCaseWorkspaceModal';

export default function PmsLegalCaseListPage() {
  const [kpis, setKpis] = useState({
    total: 0,
    inProgress: 0,
    approvalPending: 0,
    approved: 0,
    rejected: 0,
    highRisk: 0,
  });

  const [cases, setCases] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected case for workspace modal
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  useEffect(() => {
    fetchKPIs();
  }, []);

  useEffect(() => {
    fetchCases();
  }, [page, search, statusFilter]);

  const fetchKPIs = async () => {
    try {
      const res = await pmsLegalApi.getKPIs();
      if (res?.success) {
        setKpis(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch legal KPIs:', err);
    }
  };

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await pmsLegalApi.listLegalCases({
        page,
        limit,
        search,
        status: statusFilter,
      });
      if (res?.success) {
        setCases(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch legal cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKpiFilter = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Legal Verification (Stage 2)
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
              Module 02
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            4-stage title verification, encumbrance check, document custody, advocate opinion, and management approval gate.
          </p>
        </div>

        <button
          onClick={() => {
            fetchKPIs();
            fetchCases();
          }}
          className="self-start sm:self-auto px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* 5-Card KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* KPI 1 */}
        <div
          onClick={() => handleKpiFilter('all')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] flex flex-col justify-between ${
            statusFilter === 'all'
              ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Legal Cases</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Total land parcels currently undergoing or completed legal verification.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">All parcel title files</div>
        </div>

        {/* KPI 2 */}
        <div
          onClick={() => handleKpiFilter('titleVerification')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] flex flex-col justify-between ${
            statusFilter === 'titleVerification'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">In Verification</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Cases with active checklist search at Tehsil, Sub-Registrar, or Counsel.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-amber-700 mt-1">{kpis.inProgress}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active stage check</div>
        </div>

        {/* KPI 3 */}
        <div
          onClick={() => handleKpiFilter('approvalPending')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] flex flex-col justify-between ${
            statusFilter === 'approvalPending'
              ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Approval Gate</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                All 4 checklists verified; awaiting Project Manager or Management sign-off.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-purple-700 mt-1">{kpis.approvalPending}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Awaiting PM decision</div>
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
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Approved Titles</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Approved titles sanctioned for Stage 3 purchase agreement & registry.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">{kpis.approved}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Cleared for registry</div>
        </div>

        {/* KPI 5 */}
        <div
          onClick={() => handleKpiFilter('highRisk')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group min-h-[96px] flex flex-col justify-between ${
            statusFilter === 'highRisk'
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">High Risk</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Parcels flagging legal disputes, pending litigation, or adverse findings.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-rose-700 mt-1">{kpis.highRisk}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Adverse issues found</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by case code, lawyer, or notes..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="titleVerification">1. Title Verification</option>
            <option value="encumbranceCheck">2. Encumbrance Check</option>
            <option value="documentVerification">3. Document Completeness</option>
            <option value="legalOpinion">4. Legal Opinion</option>
            <option value="approvalPending">Approval Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Default Table View */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Case Code</th>
                <th className="py-3 px-4">Project & Locality</th>
                <th className="py-3 px-4">Land Parcel (Plot)</th>
                <th className="py-3 px-4">Assigned Counsel / Advocate</th>
                <th className="py-3 px-4">Current Verification Stage</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading legal verification cases...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No legal verification cases match your search or filter.
                  </td>
                </tr>
              ) : (
                cases.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Code */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-600">
                      {item.code}
                    </td>

                    {/* Project */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{item.project?.name || '---'}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.project?.locality || 'Jaipur District'}
                      </div>
                    </td>

                    {/* Plot */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{item.plot?.title || 'Plot Parcel'}</div>
                      <div className="text-[11px] text-slate-500">
                        Survey: {item.plot?.surveyNumber || 'Unassigned'} • {item.plot?.area?.size || 0}{' '}
                        {item.plot?.area?.unit || 'sqyd'}
                      </div>
                    </td>

                    {/* Lawyer */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">
                        {item.lawyer?.name || 'In-House Counsel'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.lawyer?.firmName || item.lawyer?.mobile || 'Legal Department'}
                      </div>
                    </td>

                    {/* Current Stage */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-xs font-semibold text-slate-800">
                        {item.status === 'titleVerification'
                          ? 'Title Verification'
                          : item.status === 'encumbranceCheck'
                          ? 'Encumbrance Check'
                          : item.status === 'documentVerification'
                          ? 'Document Completeness'
                          : item.status === 'legalOpinion'
                          ? 'Counsel Opinion'
                          : item.status === 'approved'
                          ? 'Approved'
                          : item.status === 'rejected'
                          ? 'Rejected'
                          : item.status === 'approvalPending'
                          ? 'Approval Pending'
                          : item.status}
                      </span>
                    </td>

                    {/* Risk Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold uppercase ${
                          item.risk?.level === 'high'
                            ? 'text-rose-600'
                            : item.risk?.level === 'medium'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{item.risk?.level || 'LOW'}</span>
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedCaseId(item._id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        <span>Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Contextual Pagination */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing page {page} of {totalPages} ({total} legal verification cases)
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-700">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Legal Case Workspace Modal */}
      {selectedCaseId && (
        <LegalCaseWorkspaceModal
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
          onRefresh={() => {
            fetchKPIs();
            fetchCases();
          }}
        />
      )}
    </div>
  );
}
