import React, { useState, useEffect } from 'react';
import {
  BadgeDollarSign,
  Landmark,
  FileText,
  Stamp,
  FileCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RotateCw,
  Info,
  ChevronLeft,
  ChevronRight,
  Award,
} from 'lucide-react';
import { pmsPurchaseApi } from '../../../api/pmsPurchaseApi';
import LandPurchaseWorkspaceModal from '../components/LandPurchaseWorkspaceModal';

function formatCurrency(val) {
  if (!val || isNaN(val)) return '₹0';
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

export default function PmsLandPurchaseListPage() {
  const [kpis, setKpis] = useState({
    total: 0,
    inNegotiation: 0,
    priceApprovalPending: 0,
    inExecution: 0,
    completed: 0,
    cancelled: 0,
    totalOutlay: 0,
  });

  const [purchases, setPurchases] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);

  useEffect(() => {
    fetchKPIs();
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [page, search, statusFilter]);

  const fetchKPIs = async () => {
    try {
      const res = await pmsPurchaseApi.getKPIs();
      if (res?.success) {
        setKpis(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch purchase KPIs:', err);
    }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await pmsPurchaseApi.listPurchases({
        page,
        limit,
        search,
        status: statusFilter,
      });
      if (res?.success) {
        setPurchases(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch land purchases:', err);
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
              Land Purchase & Registry (Stage 3)
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-purple-50 text-purple-700 border border-purple-200">
              Module 03
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Commercial negotiation, price sanction, bayana token, bilateral sale agreement, registry deed, and revenue mutation.
          </p>
        </div>

        <button
          onClick={() => {
            fetchKPIs();
            fetchPurchases();
          }}
          className="self-start sm:self-auto px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* 3-Liner KPI Cards with (i) Tooltips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* TOTAL PURCHASES */}
        <div
          onClick={() => handleKpiFilter('all')}
          className={`cursor-pointer group relative p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all ${
            statusFilter === 'all' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <BadgeDollarSign className="w-4 h-4" />
            </div>
            <div className="relative group/info">
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
              <div className="absolute right-0 top-5 hidden group-hover/info:block z-20 w-48 p-2 text-[11px] leading-tight text-white bg-slate-900 rounded-lg shadow-lg">
                Total commercial land purchases across all real estate projects.
              </div>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Purchases
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{kpis.total}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">{formatCurrency(kpis.totalOutlay)} committed</p>
          </div>
        </div>

        {/* IN NEGOTIATION */}
        <div
          onClick={() => handleKpiFilter('negotiation')}
          className={`cursor-pointer group relative p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all ${
            statusFilter === 'negotiation'
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
                Land parcels undergoing price discovery and offer/counter negotiations.
              </div>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
              In Negotiation
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{kpis.inNegotiation}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Price haggling</p>
          </div>
        </div>

        {/* PRICE SANCTION */}
        <div
          onClick={() => handleKpiFilter('priceApproval')}
          className={`cursor-pointer group relative p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all ${
            statusFilter === 'priceApproval'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Award className="w-4 h-4" />
            </div>
            <div className="relative group/info">
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
              <div className="absolute right-0 top-5 hidden group-hover/info:block z-20 w-48 p-2 text-[11px] leading-tight text-white bg-slate-900 rounded-lg shadow-lg">
                Commercial agreements awaiting management price approval before token release.
              </div>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
              Price Sanction
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{kpis.priceApprovalPending}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Awaiting management</p>
          </div>
        </div>

        {/* EXECUTION & REGISTRY */}
        <div
          onClick={() => handleKpiFilter('mutation')}
          className={`cursor-pointer group relative p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all ${
            ['tokenPayment', 'saleAgreement', 'registry', 'mutation'].includes(statusFilter)
              ? 'border-blue-500 ring-2 ring-blue-500/20'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Stamp className="w-4 h-4" />
            </div>
            <div className="relative group/info">
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
              <div className="absolute right-0 top-5 hidden group-hover/info:block z-20 w-48 p-2 text-[11px] leading-tight text-white bg-slate-900 rounded-lg shadow-lg">
                Deeds registered or mutation applied with Tehsil/JDA revenue authority.
              </div>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
              Registry & Mutation
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{kpis.inExecution}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Under execution</p>
          </div>
        </div>

        {/* FULLY COMPLETED */}
        <div
          onClick={() => handleKpiFilter('completed')}
          className={`cursor-pointer group relative p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all ${
            statusFilter === 'completed'
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
                Deeds registered, full mutation completed, and title transitioned to developer.
              </div>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              Completed Purchases
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{kpis.completed}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Ready for Project Planning</p>
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
            placeholder="Search by purchase code, owner name, or notes..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 text-slate-800"
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
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-purple-500 font-medium"
          >
            <option value="all">All Stages</option>
            <option value="negotiation">1. Price Negotiation</option>
            <option value="priceApproval">2. Price Sanction</option>
            <option value="tokenPayment">3. Token Advance</option>
            <option value="saleAgreement">4. Sale Agreement</option>
            <option value="registry">5. Sub-Registrar Deed</option>
            <option value="mutation">6. Revenue Mutation</option>
            <option value="completed">Completed Purchases</option>
          </select>
        </div>
      </div>

      {/* Default Table View */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Project & Locality</th>
                <th className="py-3 px-4">Land Parcel (Plot)</th>
                <th className="py-3 px-4">Landowner Details</th>
                <th className="py-3 px-4">Contract / Agreed Price</th>
                <th className="py-3 px-4">Total Cost (with Duty & Fees)</th>
                <th className="py-3 px-4">Stage Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading land purchase transactions...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No land purchase transactions match your search or filter.
                  </td>
                </tr>
              ) : (
                purchases.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Code */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-purple-600">
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
                      <div className="text-[11px] text-slate-500 font-mono">
                        {item.plot?.code || 'PLT'} • Survey: {item.plot?.surveyNumber || 'N/A'}
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{item.ownerSnapshot?.name || 'Owner'}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.ownerSnapshot?.contact || 'Contact on deed'}
                      </div>
                    </td>

                    {/* Agreed Price */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      {formatCurrency(
                        item.saleAgreement?.agreementValue ||
                          item.priceApproval?.approvedPrice ||
                          item.negotiation?.finalPrice
                      )}
                    </td>

                    {/* Total Cost */}
                    <td className="py-3.5 px-4 font-bold text-purple-700 font-mono">
                      {formatCurrency(item.totalCost)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                          item.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'negotiation'
                            ? 'bg-amber-100 text-amber-800'
                            : item.status === 'priceApproval'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {item.status === 'negotiation'
                          ? '1. Negotiation'
                          : item.status === 'priceApproval'
                          ? '2. Price Sanction'
                          : item.status === 'tokenPayment'
                          ? '3. Token Advance'
                          : item.status === 'saleAgreement'
                          ? '4. Sale Agreement'
                          : item.status === 'registry'
                          ? '5. Registry Deed'
                          : item.status === 'mutation'
                          ? '6. Mutation Record'
                          : item.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedPurchaseId(item._id)}
                        className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors"
                      >
                        <BadgeDollarSign className="w-3.5 h-3.5" />
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
            Showing page {page} of {totalPages} ({total} land purchase transactions)
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

      {/* Land Purchase Workspace Modal */}
      {selectedPurchaseId && (
        <LandPurchaseWorkspaceModal
          purchaseId={selectedPurchaseId}
          onClose={() => setSelectedPurchaseId(null)}
          onRefresh={() => {
            fetchKPIs();
            fetchPurchases();
          }}
        />
      )}
    </div>
  );
}
