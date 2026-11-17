import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  MessageSquare,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  RefreshCw,
  LayoutGrid,
  List,
  Eye,
  Edit2,
  Trash2,
  Filter,
} from 'lucide-react';
import { crmEnquiryApi } from '../../../api/crmEnquiryApi';
import { useToast } from '../../../context/ToastContext';
import WorkKpiStrip from '../../../components/WorkKpiStrip';
import EnquiryFormModal from '../components/EnquiryFormModal';
import EnquiryDetailsModal from '../components/EnquiryDetailsModal';
import QualificationModal from '../components/QualificationModal';

export default function EnquiriesPage() {
  const { showSuccess, showError } = useToast();

  const [enquiries, setEnquiries] = useState([]);
  const [kpis, setKpis] = useState({
    totalEnquiries: 0,
    qualifiedCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    dueTodayCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [temperatureFilter, setTemperatureFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [followupFilter, setFollowupFilter] = useState('all'); // 'all' | 'today' | 'overdue' | 'upcoming'
  const [specialFilter, setSpecialFilter] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedEnquiryForEdit, setSelectedEnquiryForEdit] = useState(null);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedEnquiryForDetails, setSelectedEnquiryForDetails] = useState(null);

  const [qualifyModalOpen, setQualifyModalOpen] = useState(false);
  const [selectedEnquiryForQualify, setSelectedEnquiryForQualify] = useState(null);

  const loadEnquiries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await crmEnquiryApi.getEnquiries({
        search,
        status: statusFilter,
        temperature: temperatureFilter,
        source: sourceFilter,
        followup: followupFilter,
        special: specialFilter,
      });
      setEnquiries(res.enquiries || []);
      if (res.kpis) {
        setKpis(res.kpis);
      }
    } catch (err) {
      showError(err.message || 'Failed to fetch enquiries');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, temperatureFilter, sourceFilter, followupFilter, specialFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEnquiries();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadEnquiries]);

  const handleOpenCreateModal = () => {
    setSelectedEnquiryForEdit(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (enq) => {
    setSelectedEnquiryForEdit(enq);
    setFormModalOpen(true);
  };

  const handleOpenDetailsModal = (enq) => {
    setSelectedEnquiryForDetails(enq);
    setDetailsModalOpen(true);
  };

  const handleOpenQualifyModal = (enq) => {
    setSelectedEnquiryForQualify(enq);
    setQualifyModalOpen(true);
  };

  const handleDeleteEnquiry = async (enq) => {
    if (!window.confirm(`Are you sure you want to delete enquiry for "${enq.clientName}"?`)) return;
    try {
      await crmEnquiryApi.deleteEnquiry(enq._id);
      showSuccess('Enquiry deleted');
      loadEnquiries();
    } catch (err) {
      showError(err.message || 'Failed to delete enquiry');
    }
  };

  const handleToggleSpecial = async (enq, e) => {
    e.stopPropagation();
    try {
      await crmEnquiryApi.toggleSpecialFollowup(enq._id);
      loadEnquiries();
    } catch (err) {
      showError('Failed to update special follow-up');
    }
  };

  // KPI Strip Data with MetricInfoBadges
  const kpiItems = [
    {
      key: 'total-enquiries',
      id: 'total-enquiries',
      label: 'TOTAL ENQUIRIES',
      value: kpis.totalEnquiries,
      hint: 'Inbound prospective buyers',
      tone: 'default',
      info: {
        title: 'Total Enquiries',
        summary: 'All incoming prospective buyer inquiries recorded across advertisements, walk-ins, phone calls, and referral partners.',
        calculation: 'Count of all non-deleted enquiry records currently in the system.',
      },
      onClick: () => {
        setStatusFilter('all');
        setFollowupFilter('all');
        setSpecialFilter(false);
      },
    },
    {
      key: 'qualified',
      id: 'qualified',
      label: 'QUALIFIED',
      value: kpis.qualifiedCount,
      hint: `${kpis.totalEnquiries ? Math.round((kpis.qualifiedCount / kpis.totalEnquiries) * 100) : 0}% qualification rate`,
      tone: 'success',
      info: {
        title: 'Qualified Enquiries',
        summary: 'Prospective buyers verified through tele-sales screening and ready for sales pipeline assignment or site visits.',
        calculation: 'Enquiries where qualification status = "qualified" or converted into an active Lead.',
      },
      onClick: () => {
        setStatusFilter('qualified');
        setFollowupFilter('all');
      },
    },
    {
      key: 'pending',
      id: 'pending',
      label: 'PENDING',
      value: kpis.pendingCount,
      hint: 'Awaiting call / verification',
      tone: 'warning',
      info: {
        title: 'Pending Screening',
        summary: 'New or in-progress inbound inquiries undergoing initial outreach, qualification calls, or awaiting customer response.',
        calculation: 'Enquiries with status in ["new", "contacted", "hold"].',
      },
      onClick: () => {
        setStatusFilter('new');
        setFollowupFilter('all');
      },
    },
    {
      key: 'overdue',
      id: 'overdue',
      label: 'OVERDUE',
      value: kpis.overdueCount,
      hint: 'Follow-up date passed',
      tone: 'danger',
      info: {
        title: 'Overdue Follow-ups',
        summary: 'Inquiries whose scheduled callback or follow-up deadline has passed without an updated activity log or status change.',
        calculation: 'Active enquiries where nextFollowupAt < today (start of day 00:00).',
      },
      onClick: () => {
        setFollowupFilter('overdue');
        setStatusFilter('all');
      },
    },
    {
      key: 'due-today',
      id: 'due-today',
      label: 'DUE TODAY',
      value: kpis.dueTodayCount,
      hint: 'Scheduled for today',
      tone: 'sky',
      info: {
        title: 'Due Today Follow-ups',
        summary: 'Inquiries scheduled for customer callback, reminder follow-up, or site visit coordination on today\'s calendar date.',
        calculation: 'Enquiries where nextFollowupAt falls between today 00:00 and 23:59.',
      },
      onClick: () => {
        setFollowupFilter('today');
        setStatusFilter('all');
      },
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'qualified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Qualified
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Not Qualified
          </span>
        );
      case 'hold':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            On Hold
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            Contacted
          </span>
        );
      case 'new':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            New Lead
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Enquiries & Intake</h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/60 rounded-full">
              CRM Intake
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Capture raw buyer inquiries from ads, phone calls, walk-ins, and brokers. Screen and qualify leads for the sales pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadEnquiries}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Enquiry</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <WorkKpiStrip items={kpiItems} columns="grid-cols-2 sm:grid-cols-5" />

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name, phone, code or project..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50/50"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="hold">On Hold</option>
            <option value="rejected">Not Qualified</option>
          </select>

          <select
            value={temperatureFilter}
            onChange={(e) => setTemperatureFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-brand-500"
          >
            <option value="all">All Temperature</option>
            <option value="hot">🔥 Hot</option>
            <option value="warm">☀️ Warm</option>
            <option value="cold">❄️ Cold</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-brand-500"
          >
            <option value="all">All Sources</option>
            <option value="phone">Direct Phone</option>
            <option value="walkIn">Walk-in</option>
            <option value="metaAds">Meta Ads</option>
            <option value="broker">Broker</option>
            <option value="reference">Reference</option>
          </select>

          {/* Special Follow-up Toggle */}
          <button
            type="button"
            onClick={() => setSpecialFilter((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              specialFilter
                ? 'bg-amber-50 text-amber-700 border-amber-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${specialFilter ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
            <span>Special Follow-Ups</span>
          </button>

          {/* View Mode Toggle */}
          <div className="inline-flex items-center p-0.5 border border-slate-200 rounded-lg bg-slate-50">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white text-brand-700 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-white text-brand-700 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Enquiries Presentation */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="inline-block w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-slate-500">Loading enquiries...</p>
        </div>
      ) : enquiries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No Enquiries Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search || statusFilter !== 'all' || temperatureFilter !== 'all' || specialFilter
              ? 'No enquiries match your active filter criteria.'
              : 'Register your first customer enquiry to begin tracking tele-sales follow-ups.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Enquiry</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enquiries.map((enq) => {
            const cleanPhone = (enq.clientPhone || '').replace(/\D/g, '');
            return (
              <div
                key={enq._id}
                onClick={() => handleOpenDetailsModal(enq)}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-2xs hover:shadow-md transition-all flex flex-col overflow-hidden cursor-pointer"
              >
                {/* Card Top Banner */}
                <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{enq.clientName}</h3>
                      <button
                        type="button"
                        onClick={(e) => handleToggleSpecial(enq, e)}
                        className={`p-0.5 rounded transition-colors ${
                          enq.specialFollowUp ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${enq.specialFollowUp ? 'fill-amber-400 text-amber-500' : ''}`} />
                      </button>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">{enq.enquiryNumber}</span>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(enq.status)}
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        enq.temperature === 'hot'
                          ? 'bg-rose-100/70 text-rose-700'
                          : enq.temperature === 'warm'
                          ? 'bg-amber-100/70 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {enq.temperature === 'hot' ? '🔥 Hot' : enq.temperature === 'warm' ? '☀️ Warm' : '❄️ Cold'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-2.5 flex-1 text-xs">
                  {/* Phone & City */}
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-mono font-semibold text-slate-800">{enq.clientPhone}</span>
                    <span className="text-slate-500 truncate max-w-[120px]">{enq.city || enq.source}</span>
                  </div>

                  {/* Project & Budget */}
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Project:</span>
                      <span className="font-semibold text-slate-900 truncate max-w-[150px]">
                        {enq.project || 'General Inquiry'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Budget:</span>
                      <span className="font-semibold text-slate-900">
                        {enq.budgetMin || enq.budgetMax
                          ? `₹${Number(enq.budgetMin || 0).toLocaleString('en-IN')} – ₹${Number(
                              enq.budgetMax || 0
                            ).toLocaleString('en-IN')}`
                          : 'Not specified'}
                      </span>
                    </div>
                  </div>

                  {/* Next Follow-up Pill */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {enq.nextFollowupAt
                          ? new Date(enq.nextFollowupAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : 'No date'}
                      </span>
                    </div>
                    {enq.followupTime && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{enq.followupTime}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div
                  className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${enq.clientPhone}`}
                      className="p-1.5 bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                      title="Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-md transition-colors"
                      title="WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="flex items-center gap-1">
                    {enq.status !== 'qualified' && (
                      <button
                        type="button"
                        onClick={() => handleOpenQualifyModal(enq)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                      >
                        Qualify
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenDetailsModal(enq)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(enq)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEnquiry(enq)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Code / Client</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Project / Type</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3">Next Follow-Up</th>
                  <th className="px-4 py-3">Temperature</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enquiries.map((enq) => (
                  <tr
                    key={enq._id}
                    onClick={() => handleOpenDetailsModal(enq)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleToggleSpecial(enq, e)}
                          className="text-slate-300 hover:text-amber-400"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${enq.specialFollowUp ? 'fill-amber-400 text-amber-500' : ''}`}
                          />
                        </button>
                        <div>
                          <p className="font-bold text-slate-900">{enq.clientName}</p>
                          <p className="text-[10px] font-mono text-slate-400">{enq.enquiryNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">{enq.clientPhone}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <p className="font-semibold">{enq.project || '—'}</p>
                      <p className="text-[10px] text-slate-400">{enq.propertyType}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      ₹{Number(enq.budgetMin || 0).toLocaleString('en-IN')} – ₹
                      {Number(enq.budgetMax || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {enq.nextFollowupAt
                        ? new Date(enq.nextFollowupAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : '—'}
                      {enq.followupTime && <span className="text-[10px] text-slate-400 ml-1">({enq.followupTime})</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          enq.temperature === 'hot'
                            ? 'bg-rose-100 text-rose-700'
                            : enq.temperature === 'warm'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {enq.temperature}
                      </span>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(enq.status)}</td>
                    <td className="px-4 py-3 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                      {enq.status !== 'qualified' && (
                        <button
                          type="button"
                          onClick={() => handleOpenQualifyModal(enq)}
                          className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded"
                        >
                          Qualify
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenDetailsModal(enq)}
                        className="p-1 text-slate-500 hover:text-slate-800 rounded"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(enq)}
                        className="p-1 text-slate-500 hover:text-slate-800 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEnquiry(enq)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal (Create / Edit) */}
      <EnquiryFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        enquiry={selectedEnquiryForEdit}
        onSaved={loadEnquiries}
      />

      {/* Details Drawer */}
      <EnquiryDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        enquiry={selectedEnquiryForDetails}
        onEdit={handleOpenEditModal}
        onOpenQualify={handleOpenQualifyModal}
        onUpdated={loadEnquiries}
      />

      {/* Qualification Modal */}
      <QualificationModal
        isOpen={qualifyModalOpen}
        onClose={() => setQualifyModalOpen(false)}
        enquiry={selectedEnquiryForQualify}
        onQualified={loadEnquiries}
      />
    </div>
  );
}
