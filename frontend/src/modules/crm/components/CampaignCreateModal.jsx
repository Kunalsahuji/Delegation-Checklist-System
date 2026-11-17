import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Send,
  Users,
  MessageSquare,
  Sparkles,
  Layers,
  Building,
  Handshake,
  CheckCircle2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { crmBulkMessageApi } from '../../../api/crmBulkMessageApi';
import { crmProjectApi } from '../../../api/crmProjectApi';
import { useToast } from '../../../context/ToastContext';

export default function CampaignCreateModal({ isOpen, onClose, onSuccess }) {
  const { showSuccess, showError } = useToast();

  const [templates, setTemplates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [audienceCount, setAudienceCount] = useState(null);
  const [counting, setCounting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [audienceMode, setAudienceMode] = useState('all');
  const [selectedStatuses, setSelectedStatuses] = useState(['qualified', 'new']);
  const [selectedLeadStatuses, setSelectedLeadStatuses] = useState(['active']);
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      const [tmplRes, projRes] = await Promise.all([
        crmBulkMessageApi.getTemplates(),
        crmProjectApi.getProjects({ limit: 100 }),
      ]);

      if (tmplRes.success && tmplRes.data.length) {
        setTemplates(tmplRes.data);
        setTemplateName(tmplRes.data[0].id);
        setBodyText(tmplRes.data[0].sampleText);
        setName(`Campaign - ${tmplRes.data[0].name}`);
      }

      if (projRes.success) {
        setProjects(projRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load campaign metadata:', err);
    }
  };

  // Build current selection object
  const getSelection = () => {
    if (audienceMode === 'status') {
      return { mode: 'status', statuses: selectedStatuses };
    }
    if (audienceMode === 'lead') {
      return { mode: 'lead', leadStatuses: selectedLeadStatuses };
    }
    if (audienceMode === 'project') {
      return { mode: 'project', project: selectedProject };
    }
    if (audienceMode === 'brokers') {
      return { mode: 'brokers' };
    }
    return { mode: 'all' };
  };

  // Recalculate audience reach preview
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(async () => {
      try {
        setCounting(true);
        const res = await crmBulkMessageApi.previewAudience(getSelection());
        if (res.success) {
          setAudienceCount(res.data.reachable);
        }
      } catch (err) {
        console.error('Audience preview error:', err);
      } finally {
        setCounting(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [audienceMode, selectedStatuses, selectedLeadStatuses, selectedProject, isOpen]);

  const handleTemplateChange = (e) => {
    const tmplId = e.target.value;
    setTemplateName(tmplId);
    const tmpl = templates.find((t) => t.id === tmplId);
    if (tmpl) {
      setBodyText(tmpl.sampleText);
      if (!name || name.startsWith('Campaign -')) {
        setName(`Campaign - ${tmpl.name}`);
      }
    }
  };

  const toggleStatus = (st) => {
    setSelectedStatuses((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
  };

  const toggleLeadStatus = (st) => {
    setSelectedLeadStatuses((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showError('Campaign name is required');
      return;
    }

    if (audienceCount === 0) {
      showError('No reachable recipients found for the selected audience');
      return;
    }

    try {
      setSubmitting(true);
      const res = await crmBulkMessageApi.createCampaign({
        name: name.trim(),
        templateName,
        bodyText: bodyText.trim(),
        mediaUrl: mediaUrl.trim(),
        mediaType: mediaUrl.trim() ? 'image' : '',
        selection: getSelection(),
      });

      if (res.success) {
        showSuccess(`Campaign "${name}" queued for dispatch to ${res.data.total} recipients`);
        onSuccess?.();
      }
    } catch (err) {
      showError(err.message || 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create Bulk Campaign</h2>
              <p className="text-xs text-slate-500">
                Broadcast personalized promotional messages across target segments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Campaign Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Campaign Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Diwali Luxury Villa Launch 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Target Audience Segment Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Target Audience Segment
              </label>
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {counting
                    ? 'Calculating reach...'
                    : `${audienceCount ?? 0} reachable recipients`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'all', label: 'All Clients', icon: Users },
                { id: 'status', label: 'Enquiries', icon: FileText },
                { id: 'lead', label: 'Leads', icon: Layers },
                { id: 'project', label: 'By Project', icon: Building },
                { id: 'brokers', label: 'Brokers', icon: Handshake },
              ].map((m) => {
                const Icon = m.icon;
                const active = audienceMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setAudienceMode(m.id)}
                    className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                      active
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold ring-1 ring-emerald-400'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="text-[11px] truncate w-full">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-filters depending on Mode */}
            {audienceMode === 'status' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                <span className="text-[11px] font-semibold text-slate-600">Select Enquiry Statuses:</span>
                <div className="flex flex-wrap gap-2">
                  {['new', 'qualified', 'converted', 'hold', 'rejected'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => toggleStatus(st)}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-colors capitalize ${
                        selectedStatuses.includes(st)
                          ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {audienceMode === 'lead' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                <span className="text-[11px] font-semibold text-slate-600">Select Lead Pipeline Statuses:</span>
                <div className="flex flex-wrap gap-2">
                  {['active', 'won', 'lost'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => toggleLeadStatus(st)}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-colors capitalize ${
                        selectedLeadStatuses.includes(st)
                          ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {audienceMode === 'project' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                <span className="text-[11px] font-semibold text-slate-600">Filter Inquiries by Project:</span>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">All Projects</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p.name}>
                      {p.name} ({p.location || 'Jaipur'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Message Template
            </label>
            <select
              value={templateName}
              onChange={handleTemplateChange}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.category}] {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Message Body Text */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Message Text Body
            </label>
            <textarea
              rows={4}
              required
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-colors"
              placeholder="Type message content..."
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Note: <code className="bg-slate-100 px-1 py-0.2 rounded font-mono text-emerald-600">{`{{name}}`}</code> will automatically be replaced with each client's personalized name.
            </p>
          </div>

          {/* Optional Media Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Promotional Banner / Media URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://example.com/banner-image.jpg"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || audienceCount === 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Launch Campaign</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
