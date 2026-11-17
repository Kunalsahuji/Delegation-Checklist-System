import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Building,
  User,
  Phone,
  Calendar,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export default function VisitDetailsModal({ isOpen, onClose, visit }) {
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !visit) return null;

  const mapLink =
    visit.submittedLat && visit.submittedLng
      ? `https://www.google.com/maps?q=${visit.submittedLat},${visit.submittedLng}`
      : null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                visit.geoVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {visit.geoVerified ? <ShieldCheck className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">Site Visit Report</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                  {visit.visitNumber || '1st'} Visit
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {visit.customerName} • {new Date(visit.visitedAt || visit.createdAt).toLocaleString('en-IN')}
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
          {/* Geo-verification status card */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              visit.geoVerified
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {visit.geoVerified ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              )}
              <div>
                <p className="font-bold text-sm">
                  {visit.geoVerified ? 'Geo-Fence Verified' : 'External / Unverified GPS'}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {visit.geoVerified
                    ? `Validated within project boundary${
                        visit.geoDistanceMeters !== null ? ` (~${visit.geoDistanceMeters}m from site)` : ''
                      }`
                    : 'Submitted outside designated project geo-fence radius or GPS unverified.'}
                </p>
                {visit.submittedLat && (
                  <p className="text-[11px] font-mono mt-1 opacity-90">
                    Coords: {visit.submittedLat.toFixed(5)}, {visit.submittedLng.toFixed(5)}
                    {visit.submittedAccuracy ? ` (±${visit.submittedAccuracy}m)` : ''}
                  </p>
                )}
              </div>
            </div>

            {mapLink && (
              <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white rounded-lg shadow-2xs border border-slate-200 hover:bg-slate-50 transition-colors shrink-0 text-slate-800"
              >
                <span>View on Map</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block mb-0.5">Client Contact</span>
              <span className="font-semibold text-slate-800 text-sm block">{visit.customerName}</span>
              <span className="text-slate-600">{visit.contactNumber}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Project Visited</span>
              <span className="font-semibold text-slate-800 text-sm block">
                {visit.projectVisited || visit.projectId?.name || 'General'}
              </span>
              <span className="text-slate-600">{visit.propertyInterested || 'Villa / Plot'}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Visited By</span>
              <span className="font-medium text-slate-800">
                {visit.visitorName || visit.visitorId?.name || visit.createdBy?.name || 'Staff Member'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Client Budget</span>
              <span className="font-semibold text-emerald-700">
                {visit.customerBudget ? `₹${visit.customerBudget}` : 'Not Specified'}
              </span>
            </div>

            {visit.firstPreference && (
              <div className="col-span-2">
                <span className="text-slate-400 block mb-0.5">1st Preference</span>
                <span className="font-medium text-slate-800">{visit.firstPreference}</span>
              </div>
            )}

            {visit.secondPreference && (
              <div className="col-span-2">
                <span className="text-slate-400 block mb-0.5">2nd Preference</span>
                <span className="font-medium text-slate-800">{visit.secondPreference}</span>
              </div>
            )}

            {visit.customerProfession && (
              <div>
                <span className="text-slate-400 block mb-0.5">Profession</span>
                <span className="font-medium text-slate-800">{visit.customerProfession}</span>
              </div>
            )}

            {visit.customerAddress && (
              <div>
                <span className="text-slate-400 block mb-0.5">Address / City</span>
                <span className="font-medium text-slate-800">{visit.customerAddress}</span>
              </div>
            )}

            {visit.seniorPerson && (
              <div className="col-span-2">
                <span className="text-slate-400 block mb-0.5">Senior Accompanying</span>
                <span className="font-medium text-slate-800">{visit.seniorPerson}</span>
              </div>
            )}
          </div>

          {/* Remarks */}
          {visit.remarks && (
            <div>
              <span className="text-slate-500 font-semibold block mb-1.5">Site Visit Remarks</span>
              <p className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                "{visit.remarks}"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
