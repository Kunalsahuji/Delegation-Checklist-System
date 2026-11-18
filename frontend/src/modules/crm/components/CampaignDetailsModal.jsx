import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Send,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Phone,
  Tag,
  Building,
  Calendar,
} from 'lucide-react';
import { crmBulkMessageApi } from '../../../api/crmBulkMessageApi';

export default function CampaignDetailsModal({ isOpen, onClose, campaignId }) {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && campaignId) {
      loadDetails();
    }
  }, [isOpen, campaignId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await crmBulkMessageApi.getCampaignById(campaignId);
      if (res.success) {
        setCampaign(res.data);
      }
    } catch (err) {
      console.error('Failed to load campaign details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const percentDelivered =
    campaign && campaign.total > 0
      ? Math.round(((campaign.delivered || 0) / campaign.total) * 100)
      : 100;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {campaign?.name || 'Campaign Report'}
              </h2>
              <p className="text-xs text-slate-500">
                Broadcast log & delivery audit report
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

        {/* Content */}
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-emerald-600 border-t-transparent mb-3" />
            <p className="text-xs text-slate-500">Loading campaign report...</p>
          </div>
        ) : !campaign ? (
          <div className="p-12 text-center text-xs text-slate-400">Campaign not found</div>
        ) : (
          <div className="p-6 space-y-4 overflow-y-auto">
            {/* Delivery Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Recipients
                </div>
                <div className="text-xl font-bold text-slate-900 mt-1">{campaign.total}</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-center">
                <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  Sent
                </div>
                <div className="text-xl font-bold text-blue-900 mt-1">{campaign.sent}</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
                <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Delivered
                </div>
                <div className="text-xl font-bold text-emerald-900 mt-1">{campaign.delivered}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Status
                </div>
                <div className="text-sm font-bold text-emerald-700 mt-1.5 capitalize">
                  {campaign.status}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Delivery Completion</span>
                <span className="text-emerald-700">{percentDelivered}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentDelivered}%` }}
                />
              </div>
            </div>

            {/* Template & Message Preview */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Template: {campaign.templateName}</span>
                </span>
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                  {campaign.templateCategory}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-700 whitespace-pre-wrap font-sans border border-slate-100">
                {campaign.bodyText}
              </div>
              {campaign.mediaUrl && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span className="font-semibold text-slate-700">Media URL:</span>
                  <a
                    href={campaign.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline truncate max-w-sm"
                  >
                    {campaign.mediaUrl}
                  </a>
                </div>
              )}
            </div>

            {/* Recipient Audit Log */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Recipients List ({campaign.recipients?.length || 0})
                </span>
                <span className="text-[10px] text-slate-400">
                  Initiated by {campaign.createdBy?.name || 'CRM Team'}
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {(campaign.recipients || []).map((r, i) => (
                  <div key={i} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div>
                      <div className="font-semibold text-slate-900">{r.name}</div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Phone className="w-2.5 h-2.5" />
                        <span>{r.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {r.status}
                      </span>
                      {r.sentAt && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(r.sentAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
