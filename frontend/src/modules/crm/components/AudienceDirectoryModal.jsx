import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Users,
  Search,
  Phone,
  Building,
  CheckCircle2,
  Sparkles,
  Send,
  Filter,
} from 'lucide-react';
import { crmBulkMessageApi } from '../../../api/crmBulkMessageApi';
import { crmEnquiryApi } from '../../../api/crmEnquiryApi';
import { crmLeadApi } from '../../../api/crmLeadApi';

export default function AudienceDirectoryModal({ isOpen, onClose, onLaunchCampaign }) {
  const [loading, setLoading] = useState(true);
  const [recipients, setRecipients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'Lead', 'Enquiry'

  useEffect(() => {
    if (isOpen) {
      loadAudience();
    }
  }, [isOpen]);

  const loadAudience = async () => {
    try {
      setLoading(true);
      // Attempt 1: Direct backend audience directory
      try {
        const res = await crmBulkMessageApi.getAudienceDirectory();
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setRecipients(res.data);
          setLoading(false);
          return;
        }
        if (res?.data?.recipients && res.data.recipients.length > 0) {
          setRecipients(res.data.recipients);
          setLoading(false);
          return;
        }
      } catch (err) {
        // Fallback to direct enquiry & lead fetch
      }

      // Attempt 2: Direct enquiry and lead client contacts from database
      const [enqRes, leadRes] = await Promise.all([
        crmEnquiryApi.getEnquiries({ limit: 100 }),
        crmLeadApi.getLeads({ limit: 100 }),
      ]);

      const enquiries = enqRes?.enquiries || enqRes?.data || [];
      const leads = leadRes?.leads || leadRes?.data?.leads || (Array.isArray(leadRes?.data) ? leadRes.data : []);

      const phoneMap = new Map();

      enquiries.forEach((e) => {
        const raw = String(e.clientPhone || '').replace(/\D/g, '');
        const phone = raw.length >= 10 ? raw.slice(-10) : raw;
        if (phone && !phoneMap.has(phone)) {
          phoneMap.set(phone, {
            name: e.clientName || 'Prospective Buyer',
            phone,
            type: 'Enquiry',
            code: e.enquiryNumber || 'ENQ',
            project: e.project || 'General Inquiry',
            status: e.status || 'New Lead',
          });
        }
      });

      leads.forEach((l) => {
        const raw = String(l.clientPhone || '').replace(/\D/g, '');
        const phone = raw.length >= 10 ? raw.slice(-10) : raw;
        if (phone && !phoneMap.has(phone)) {
          phoneMap.set(phone, {
            name: l.clientName || 'Qualified Lead',
            phone,
            type: 'Lead',
            code: l.leadNumber || 'LD',
            project: l.project || l.projectId?.name || 'General Lead',
            status: l.currentStageName || l.currentStageId?.name || l.status || 'Active',
          });
        }
      });

      setRecipients(Array.from(phoneMap.values()));
    } catch (err) {
      console.error('Failed to load audience directory', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipients = useMemo(() => {
    return recipients.filter((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = (r.name || '').toLowerCase().includes(term);
        const matchesPhone = (r.phone || '').includes(term);
        const matchesProject = (r.project || '').toLowerCase().includes(term);
        return matchesName || matchesPhone || matchesProject;
      }
      return true;
    });
  }, [recipients, typeFilter, searchTerm]);

  const leadCount = recipients.filter((r) => r.type === 'Lead').length;
  const enquiryCount = recipients.filter((r) => r.type === 'Enquiry').length;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Addressable Audience Directory</h2>
                <span className="px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-800 rounded-full">
                  {recipients.length} Reachable
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified unique contacts from CRM leads and enquiries ready for WhatsApp and SMS broadcasts.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          {/* Segment Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Contacts ({recipients.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('Lead')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'Lead'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Leads ({leadCount})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('Enquiry')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'Enquiry'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Enquiries ({enquiryCount})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, phone, project..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-purple-500 bg-white"
            />
          </div>
        </div>

        {/* Audience List Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
              Loading addressable audience contacts...
            </div>
          ) : filteredRecipients.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No contacts match your search or filter.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Contact & Client</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Channel / Type</th>
                  <th className="py-3 px-4">Project Focus</th>
                  <th className="py-3 px-4">Current Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecipients.map((rec, index) => (
                  <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{rec.name}</div>
                      {rec.code && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{rec.code}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-700 font-medium flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>+91 {rec.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          rec.type === 'Lead'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {rec.type === 'Lead' ? 'Pipeline Lead' : 'Intake Enquiry'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{rec.project || 'General'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{rec.status || 'Verified Reachable'}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Showing <span className="font-semibold text-slate-800">{filteredRecipients.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{recipients.length}</span> addressable contacts
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onLaunchCampaign) onLaunchCampaign();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Launch Campaign to this Audience</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
