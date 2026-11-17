import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Handshake,
  Award,
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  Percent,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { crmBrokerApi } from '../../../api/crmBrokerApi';

export default function BrokerDetailsModal({ isOpen, onClose, brokerId, onEdit }) {
  const [data, setData] = useState(null);
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
    if (isOpen && brokerId) {
      loadDetails();
    }
  }, [isOpen, brokerId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await crmBrokerApi.getBrokerById(brokerId);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load broker details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const broker = data?.broker;
  const progress = broker?.progress;
  const referrals = data?.referrals;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 font-bold">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">{broker?.name || 'Partner Profile'}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                  {broker?.brokerCode || 'BRK'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {broker?.agencyName || 'Independent Real Estate Partner'} • {broker?.city || 'Jaipur'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading partner statistics...</div>
          ) : !broker ? (
            <div className="py-12 text-center text-slate-400">Partner information unavailable</div>
          ) : (
            <>
              {/* Sales Tier & Yards Progression Card */}
              <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/70 to-indigo-50/70">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-900 text-sm">{broker.level}</span>
                    <span className="text-[11px] text-slate-500">
                      ({broker.totalYards.toLocaleString('en-IN')} Yards Sold)
                    </span>
                  </div>
                  {progress?.nextLevel && (
                    <span className="text-[11px] font-semibold text-indigo-700">
                      Target: {progress.nextLevel}
                    </span>
                  )}
                </div>

                {progress?.nextLevel && (
                  <div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-1.5">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress.progressPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{progress.progressPct}% Qualified</span>
                      <span>
                        {progress.remainingYards > 0
                          ? `${progress.remainingYards.toLocaleString('en-IN')} yards needed for promotion`
                          : 'Eligible for Promotion!'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact & Agency Details */}
              <div className="grid grid-cols-2 gap-3.5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block mb-0.5">Primary Contact</span>
                  <a
                    href={`tel:${broker.phone}`}
                    className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{broker.phone}</span>
                  </a>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Email Address</span>
                  <span className="font-medium text-slate-800">
                    {broker.email || 'No email registered'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Managing Representative</span>
                  <span className="font-medium text-slate-800">
                    {broker.managedBy?.name || broker.managedByName || 'General Sales Pool'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Commission Rate</span>
                  <span className="font-semibold text-emerald-700">{broker.commissionRate}%</span>
                </div>

                {broker.address && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block mb-0.5">Office Address</span>
                    <span className="font-medium text-slate-800">{broker.address}</span>
                  </div>
                )}
              </div>

              {/* Referral Activity Summary */}
              <div>
                <h3 className="font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Referred Client Enquiries</span>
                  <span className="text-slate-500 font-normal">
                    {referrals?.totalEnquiries || 0} Inbound Records
                  </span>
                </h3>

                {referrals?.enquiries?.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-center text-slate-400">
                    No referred clients logged for this partner yet.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="py-2 px-3">Enquiry Code</th>
                          <th className="py-2 px-3">Client Name</th>
                          <th className="py-2 px-3">Project</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {referrals?.enquiries?.slice(0, 5).map((e) => (
                          <tr key={e._id}>
                            <td className="py-2 px-3 font-semibold text-slate-800">
                              {e.enquiryNumber}
                            </td>
                            <td className="py-2 px-3 font-medium text-slate-900">{e.clientName}</td>
                            <td className="py-2 px-3 text-slate-600">{e.project || 'General'}</td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                                {e.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Notes */}
              {broker.notes && (
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">Partnership Notes</span>
                  <p className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                    "{broker.notes}"
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            {broker && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onEdit(broker);
                  onClose();
                }}
                className="px-3.5 py-1.5 font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Edit Partner Details
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
