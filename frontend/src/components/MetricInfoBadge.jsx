import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * MetricInfoBadge
 * High-performance, portal-rendered informational badge:
 * - Hover: dark floating tooltip anchored to the icon without clipping
 * - Click: detailed popover anchored right next to the icon (no flying/jumping)
 * - Auto-dismiss: immediately closes on scroll (up or down), outside click, or Escape
 */
export default function MetricInfoBadge({
  title = '',
  summary = '',
  calculation = '',
  className = '',
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const buttonRef = useRef(null);
  const popoverRef = useRef(null);

  // Compute popover coordinates synchronously relative to viewport
  const calculatePopoverCoords = useCallback(() => {
    if (!buttonRef.current) return { top: 0, left: 0 };
    const rect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(320, window.innerWidth - 32);
    const estimatedHeight = 220;

    // Prefer showing right below the icon, aligned towards the left or right of the icon
    let top = rect.bottom + 6;
    let left = rect.right - popoverWidth + 14;

    // Boundary check: left screen edge
    if (left < 16) {
      left = 16;
    }
    // Boundary check: right screen edge
    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - popoverWidth - 16;
    }

    // Boundary check: bottom screen edge (flip above if overflows bottom)
    if (top + estimatedHeight > window.innerHeight - 16 && rect.top > estimatedHeight + 16) {
      top = rect.top - estimatedHeight - 6;
    }

    return { top, left };
  }, []);

  // Compute tooltip coordinates synchronously relative to viewport
  const calculateTooltipCoords = useCallback(() => {
    if (!buttonRef.current) return { top: 0, left: 0 };
    const rect = buttonRef.current.getBoundingClientRect();
    const tooltipWidth = 240;

    let top = rect.bottom + 6;
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;

    if (left < 16) left = 16;
    if (left + tooltipWidth > window.innerWidth - 16) {
      left = window.innerWidth - tooltipWidth - 16;
    }

    return { top, left };
  }, []);

  // Dismiss on scroll anywhere in the document (window or scrollable parent)
  useEffect(() => {
    if (!isOpen && !isHovered) return;

    const handleScroll = () => {
      setIsOpen(false);
      setIsHovered(false);
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [isOpen, isHovered]);

  // Dismiss on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (
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

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isOpen) {
      const coords = calculatePopoverCoords();
      setPos(coords);
      setIsHovered(false);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleMouseEnter = () => {
    if (!isOpen) {
      const coords = calculateTooltipCoords();
      setTooltipPos(coords);
      setIsHovered(true);
    }
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
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-slate-300 text-[10px] font-bold text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/60 transition-colors focus:outline-none cursor-pointer"
        aria-label={`Information for ${title}`}
      >
        i
      </button>

      {/* Tier 1: Hover Tooltip (Portal-rendered so it is never clipped by card overflow) */}
      {isHovered &&
        !isOpen &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: `${tooltipPos.top}px`,
              left: `${tooltipPos.left}px`,
              zIndex: 99999,
            }}
            className="w-60 p-2.5 bg-slate-900/95 backdrop-blur-xs text-white text-[11px] rounded-lg shadow-xl pointer-events-none transition-opacity duration-150 text-left border border-slate-700/50"
          >
            <p className="font-normal text-slate-100 leading-snug">{summary || title}</p>
            <span className="block text-[10px] text-slate-400 mt-1 font-medium">
              Click the <strong className="text-slate-200 font-semibold">i</strong> for how it's calculated
            </span>
          </div>,
          document.body
        )}

      {/* Tier 2: Click Popover Card (Portal-rendered with synchronous position) */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: `${pos.top}px`,
              left: `${pos.left}px`,
              zIndex: 99999,
            }}
            className="w-72 sm:w-80 bg-white rounded-xl border border-slate-200 shadow-2xl p-4 text-left transition-all duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 mb-2.5">
              <h4 className="text-xs font-bold text-slate-900 leading-tight">{title}</h4>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded-md hover:bg-slate-100 transition-colors -mr-1 -mt-1 cursor-pointer"
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
