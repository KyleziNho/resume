'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, PanInfo, useReducedMotion } from 'framer-motion';
import { haptic } from 'ios-haptics';

const SEEN_KEY = 'kyleos-onlybills2-notification';
const SHOW_DELAY_MS = 2500;
const AUTO_HIDE_MS = 10000;

interface UpdateNotificationProps {
  /** Only start the timer once the desktop is on screen */
  enabled: boolean;
  onOpen: () => void;
}

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Storage blocked (private mode etc.) - just show it again next time
  }
}

// The blur has to sit on the animated element itself: if it sat on a child, the
// parent's opacity animation would stop the child from seeing what's behind it.
const GLASS: React.CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.62) 0%, rgba(246,247,252,0.48) 45%, rgba(236,240,252,0.55) 100%)',
  backdropFilter: 'blur(28px) saturate(190%) brightness(1.06)',
  WebkitBackdropFilter: 'blur(28px) saturate(190%) brightness(1.06)',
  border: '1px solid rgba(255,255,255,0.6)',
  boxShadow:
    '0 18px 50px -12px rgba(0,0,0,0.35), 0 4px 14px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(255,255,255,0.25)',
};

export default function UpdateNotification({ enabled, onOpen }: UpdateNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hovered, setHovered] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Drop in a moment after boot, once per visit
  useEffect(() => {
    if (!enabled || alreadySeen()) return;
    const t = setTimeout(() => {
      setVisible(true);
      markSeen();
      try { haptic(); } catch { /* no haptics */ }
    }, SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [enabled]);

  // Auto-dismiss, paused while hovered
  useEffect(() => {
    if (!visible || hovered) return;
    hideTimer.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [visible, hovered]);

  const handleOpen = () => {
    setVisible(false);
    try { haptic(); } catch { /* no haptics */ }
    onOpen();
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const swipedAway = isMobile
      ? info.offset.y < -40 || info.velocity.y < -300
      : info.offset.x > 80 || info.velocity.x > 400;
    if (swipedAway) setVisible(false);
  };

  // Starts as a small pill at the top, then springs out into the full card
  const hidden = reduceMotion
    ? { opacity: 0 }
    : isMobile
      ? { opacity: 0, y: -60, scaleX: 0.32, scaleY: 0.45 }
      : { opacity: 0, x: 40, scale: 0.92 };

  const exit = reduceMotion
    ? { opacity: 0 }
    : isMobile
      ? { opacity: 0, y: -90, scale: 0.96, transition: { duration: 0.25 } }
      : { opacity: 0, x: 380, transition: { duration: 0.3, ease: 'easeIn' as const } };

  if (!mounted) return null;

  // Rendered on <body> so no parent opacity/filter can break the glass blur
  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          key="onlybills-update"
          role="button"
          tabIndex={0}
          aria-label="Kyle\'s app OnlyBills 2.0 just launched. Open onlybills.app."
          className="fixed z-[10000] cursor-pointer select-none outline-none touch-none"
          style={{
            top: isMobile ? 'calc(env(safe-area-inset-top, 0px) + 32px)' : 34,
            left: isMobile ? 8 : 'auto',
            right: isMobile ? 8 : 14,
            width: isMobile ? 'auto' : 330,
            transformOrigin: isMobile ? 'top center' : 'top right',
            borderRadius: isMobile ? 24 : 20,
            ...GLASS,
          }}
          initial={hidden}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1 }}
          exit={exit}
          transition={reduceMotion ? { duration: 0.2 } : { type: 'spring', stiffness: 380, damping: 28, mass: 0.9 }}
          drag={isMobile ? 'y' : 'x'}
          dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
          dragElastic={isMobile ? { top: 0.9, bottom: 0.15 } : { left: 0.1, right: 0.9 }}
          onDragEnd={handleDragEnd}
          onTap={handleOpen}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleOpen();
            if (e.key === 'Escape') setVisible(false);
          }}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
        >
          <div className="relative overflow-hidden rounded-[24px] md:rounded-[20px]">
            {/* Specular highlights + moving sheen */}
            <div className="lg-specular pointer-events-none absolute inset-0" />
            {!reduceMotion && <div className="lg-sheen pointer-events-none absolute inset-y-0 -left-1/2 w-1/2" />}

            <motion.div
              className="relative flex items-center gap-3 px-3.5 py-3"
              initial={reduceMotion ? false : { opacity: 0, filter: 'blur(6px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ delay: reduceMotion ? 0 : 0.15, duration: 0.35 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/app-onlybills-2.png"
                alt=""
                width={38}
                height={38}
                draggable={false}
                className="h-[38px] w-[38px] shrink-0 rounded-[9px]"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] text-black/50">Kyle&apos;s app</span>
                  <span className="text-[12px] text-black/40">now</span>
                </div>
                <p className="text-[14px] font-semibold leading-snug text-black/90">
                  OnlyBills 2.0 just launched
                </p>
              </div>
            </motion.div>
          </div>

          {/* Close button on hover (desktop), like macOS */}
          {!isMobile && (
            <button
              aria-label="Dismiss notification"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setVisible(false);
              }}
              className={`lg-close absolute -left-2 -top-2 flex h-[22px] w-[22px] items-center justify-center rounded-full text-black/60 transition-opacity duration-150 ${
                hovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M1 1l8 8M9 1l-8 8" />
              </svg>
            </button>
          )}

          <style jsx>{`
            /* Light catching the top-left rim and a soft glow at the bottom edge */
            .lg-specular {
              border-radius: inherit;
              background:
                radial-gradient(120% 60% at 0% 0%, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 45%),
                radial-gradient(80% 50% at 100% 110%, rgba(140, 180, 255, 0.28) 0%, rgba(140, 180, 255, 0) 60%);
              mix-blend-mode: soft-light;
            }
            .lg-sheen {
              background: linear-gradient(
                100deg,
                rgba(255, 255, 255, 0) 0%,
                rgba(255, 255, 255, 0.55) 50%,
                rgba(255, 255, 255, 0) 100%
              );
              transform: skewX(-18deg);
              animation: lg-sweep 1.4s cubic-bezier(0.22, 1, 0.36, 1) 0.35s 1 both;
            }
            @keyframes lg-sweep {
              from { transform: translateX(0) skewX(-18deg); }
              to { transform: translateX(400%) skewX(-18deg); }
            }
            .lg-close {
              background: rgba(255, 255, 255, 0.75);
              backdrop-filter: blur(12px) saturate(180%);
              -webkit-backdrop-filter: blur(12px) saturate(180%);
              border: 0.5px solid rgba(0, 0, 0, 0.12);
              box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
