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

      {/* 3-Liner KPI Cards with (i) Tooltips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* TOTAL CASES */}
        <div
          onClick={() => handleKpiFilter('all')}
          className={`cursor-pointer group relative p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all ${
            statusFilter === 'all' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Scale className="w-4 h-4" />
            </div>
            <div className="relative group/info">
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
              <div className="absolute right-0 top-5 hidden group-hover/info:block z-20 w-48 p-2 text-[11px] leading-tight text-white bg-slate-900 rounded-lg shadow-lg">
                Total land parcels currently undergoing or completed legal verification.
              </div>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Legal Cases
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{kpis.total}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">All parcel title files</p>
          </div>
        </div>

        {/* IN PROGRESS */}
        <div
          onClick={() => handleKpiFilter('titleVerification')}
          className={`cursor-pointer group relative p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all ${
            statusFilter === 'titleVerification'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
            <div className="relative group/info">
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
              <div className="absolute right-0 top-5 hidden group-hover/info:block z-20 w-48 p-2 text-[11px] leading-tight text-white bg-slate-900 rounded-lg shadow-lg">
                Cases with active checklist search at Tehsil, Sub-Registrar, or Counsel.
              </div>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
              In Verification
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{kpis.inProgress}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Active stage check</p>
          </div>
        </div>

        {/* APPROVAL PENDING */}
        <div
          onClick={() => handleKpiFilter('approvalPending')}
          className={`cursor-pointer group relative p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all ${
            statusFilter === 'approvalPending'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div className="relative group/info">
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
              <div className="absolute right-0 top-5 hidden group-hover/info:block z-20 w-48 p-2 text-[11px] leading-tight text-white bg-slate-900 rounded-lg shadow-lg">
                All 4 checklists verified; awaiting Project Manager or Management sign-off.
              </div>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">
              Approval Gate
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{kpis.approvalPending}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Awaiting PM decision</p>
          </div>
        </div>

        {/* APPROVED / CLEAN TITLES */}
        <div
          onClick={() => handleKpiFilter('approved')}
          className={`cursor-pointer group relative p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all ${
            statusFilter === 'approved'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="relative group/info">
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
              <div className="absolute right-0 top-5 hidden group-hover/info:block z-20 w-48 p-2 text-[11px] leading-tight text-white bg-slate-900 rounded-lg shadow-lg">
                Approved titles sanctioned for Stage 3 purchase agreement & registry.
              </div>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              Approved Titles
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{kpis.approved}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Cleared for registry</p>
          </div>
        </div>

        {/* HIGH RISK */}
        <div
          onClick={() => handleKpiFilter('highRisk')}
          className={`cursor-pointer group relative p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all ${
            statusFilter === 'highRisk'
              ? 'border-rose-500 ring-2 ring-rose-500/20'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="relative group/info">
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
              <div className="absolute right-0 top-5 hidden group-hover/info:block z-20 w-48 p-2 text-[11px] leading-tight text-white bg-slate-900 rounded-lg shadow-lg">
                Parcels flagging legal disputes, pending litigation, or adverse findings.
              </div>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
              High Risk
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{kpis.highRisk}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Adverse issues found</p>
          </div>
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
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                          item.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : item.status === 'approvalPending'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status === 'titleVerification'
                          ? '1. Title Verification'
                          : item.status === 'encumbranceCheck'
                          ? '2. Encumbrance Check'
                          : item.status === 'documentVerification'
                          ? '3. Document Completeness'
                          : item.status === 'legalOpinion'
                          ? '4. Counsel Opinion'
                          : item.status}
                      </span>
                    </td>

                    {/* Risk Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                          item.risk?.level === 'high'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : item.risk?.level === 'medium'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>{item.risk?.level || 'LOW'}</span>
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCaseId(item._id)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Workspace</span>
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
