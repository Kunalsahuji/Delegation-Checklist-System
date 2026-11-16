import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * MetricInfoBadge
 * Two-tier informational icon:
 * - Hover: dark tooltip with short summary & prompt
 * - Click: detailed popover card showing "WHAT IT SHOWS" and "HOW IT IS CALCULATED"
 */
export default function MetricInfoBadge({
  title = '',
  summary = '',
  calculation = '',
  className = '',
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);

  // Position popover relative to button
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = 320;
      const popoverHeight = 240;

      let top = rect.bottom + window.scrollY + 8;
      let left = rect.left + window.scrollX - 140;

      // Adjust if it goes off-screen right
      if (left + popoverWidth > window.innerWidth - 16) {
        left = window.innerWidth - popoverWidth - 16;
      }
      // Adjust if it goes off-screen left
      if (left < 16) {
        left = 16;
      }

      // If it goes off-screen bottom, show above
      if (rect.bottom + popoverHeight > window.innerHeight) {
        top = rect.top + window.scrollY - popoverHeight - 8;
      }

      setPopoverPos({ top, left });
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovered(false);
    setIsOpen((prev) => !prev);
  };

  const handleMouseEnter = () => {
    if (!isOpen) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div className={`relative inline-flex items-center shrink-0 ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-slate-300 text-[10px] font-bold text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/60 transition-colors focus:outline-none"
        title=""
        aria-label={`Info about ${title}`}
      >
        i
      </button>

      {/* Tier 1: Hover Tooltip */}
      {isHovered && !isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 sm:w-60 p-2.5 bg-slate-900 text-white text-[11px] rounded-lg shadow-xl z-50 pointer-events-none transition-opacity duration-150">
          <p className="font-normal text-slate-200 leading-snug">{summary || title}</p>
          <span className="block text-[10px] text-slate-400 mt-1 font-medium">
            Click the <strong className="text-slate-300 font-semibold">i</strong> for how it's calculated
          </span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
        </div>
      )}

      {/* Tier 2: Click Popover Card */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'absolute',
              top: `${popoverPos.top}px`,
              left: `${popoverPos.left}px`,
              zIndex: 9999,
            }}
            className="w-72 sm:w-80 bg-white rounded-xl border border-slate-200 shadow-2xl p-4 text-left animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 mb-2.5">
              <h4 className="text-xs font-bold text-slate-900 leading-tight">{title}</h4>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded-md hover:bg-slate-100 transition-colors -mr-1 -mt-1"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* What it shows */}
            <div className="space-y-1 mb-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                What it shows
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">{summary}</p>
            </div>

            {/* How it is calculated */}
            {calculation && (
              <div className="space-y-1 border-t border-slate-100 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  How it is calculated
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed font-mono bg-slate-50 p-2 rounded-md border border-slate-100">
                  {calculation}
                </p>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
