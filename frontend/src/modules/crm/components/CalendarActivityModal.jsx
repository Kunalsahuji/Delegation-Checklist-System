import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Building,
  CheckCircle2,
  FileText,
  MapPin,
  Bell,
} from 'lucide-react';

export default function CalendarActivityModal({ isOpen, onClose, activity, onComplete }) {
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !activity) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl text-white font-bold"
              style={{ backgroundColor: activity.color || '#3B82F6' }}
            >
              {activity.type === 'Site Visit' ? (
                <MapPin className="w-5 h-5" />
              ) : (
                <Bell className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">{activity.type}</h2>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: activity.color || '#3B82F6' }}
                >
                  {activity.status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-xs">{activity.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details Content */}
        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block mb-0.5">Client / Contact</span>
              <span className="font-semibold text-slate-800 text-sm block">
                {activity.clientName || 'General'}
              </span>
              {activity.phone && (
                <a
                  href={`tel:${activity.phone}`}
                  className="text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                >
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{activity.phone}</span>
                </a>
              )}
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Project</span>
              <span className="font-semibold text-slate-800 text-sm block">
                {activity.project || 'General'}
              </span>
              {activity.code && <span className="text-slate-400">{activity.code}</span>}
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Scheduled Date & Time</span>
              <span className="font-medium text-slate-800 block">
                {new Date(activity.at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="text-slate-500">{activity.time || 'All Day'}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Assigned Representative</span>
              <span className="font-medium text-slate-800">{activity.assignedUser}</span>
            </div>
          </div>

          {activity.notes && (
            <div>
              <span className="text-slate-500 font-semibold block mb-1">Details & Remarks</span>
              <p className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                "{activity.notes}"
              </p>
            </div>
          )}

          {activity.geoVerified !== undefined && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 ${
                activity.geoVerified
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {activity.geoVerified
                  ? 'Geo-Fence Verified Site Tour'
                  : 'External / Off-site Captured Tour'}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            {activity.source === 'reminder' && activity.status !== 'completed' && onComplete && (
              <button
                type="button"
                onClick={() => {
                  onComplete(activity);
                  onClose();
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Mark Done
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
