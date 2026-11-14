import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * High-performance, non-blocking route transition micro-loader.
 * Inspired by Tangdi CRM PageLoader:
 * - Ultra-fast: completes and fades out in ~380ms (well under 1 sec limit)
 * - Top gradient progress bar + subtle frosted ambient glow
 * - Non-blocking pointer-events-none so it never stalls user interactions
 */
export default function PageLoader() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    setProgress(15);

    const step1 = setTimeout(() => setProgress(65), 80);
    const step2 = setTimeout(() => setProgress(95), 180);
    const step3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setLoading(false), 140);
    }, 280);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
    };
  }, [location.pathname, location.search]);

  if (!loading) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] select-none">
      {/* Top glowing progress bar */}
      <div
        className="fixed left-0 top-0 h-[2.5px] bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />

      {/* Ultra-soft frosted backdrop (fades away fast) */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] animate-in fade-in duration-100 flex items-center justify-center">
        {/* Soft centered brand badge pulse */}
        <div className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-white/90 shadow-md border border-slate-100">
          <div className="flex items-end gap-1 h-5">
            <span className="w-1.5 h-3 bg-blue-400 rounded-xs animate-pulse" />
            <span className="w-1.5 h-5 bg-blue-600 rounded-xs animate-pulse delay-75" />
            <span className="w-1.5 h-3.5 bg-indigo-500 rounded-xs animate-pulse delay-150" />
            <span className="w-1.5 h-4.5 bg-emerald-500 rounded-xs animate-pulse delay-200" />
          </div>
          <span className="text-[10px] font-semibold tracking-wider text-slate-600 uppercase">
            TaskFlow
          </span>
        </div>
      </div>
    </div>
  );
}
