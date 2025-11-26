'use client';

import React, { useState, useEffect, useRef } from 'react';
import { haptic } from 'ios-haptics';

export type WallpaperType = 'terminal' | 'ripple' | 'sequoia-light' | 'sequoia-dark' | 'sonoma' | 'ventura';

interface ControlCenterProps {
  isOpen: boolean;
  onClose: () => void;
  currentWallpaper: WallpaperType;
  onWallpaperChange: (wallpaper: WallpaperType) => void;
}

const WALLPAPERS: { id: WallpaperType; name: string; gradient: string }[] = [
  { id: 'terminal', name: 'Terminal', gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)' },
  { id: 'ripple', name: 'Ripple', gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)' },
  { id: 'sequoia-light', name: 'Sequoia', gradient: 'linear-gradient(135deg, #e8d5c4 0%, #d4a574 50%, #c49a6c 100%)' },
  { id: 'sequoia-dark', name: 'Sequoia Dark', gradient: 'linear-gradient(135deg, #2d1f1a 0%, #1a1210 50%, #3d2a1f 100%)' },
  { id: 'sonoma', name: 'Sonoma', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #f093fb 100%)' },
  { id: 'ventura', name: 'Ventura', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #43e97b 100%)' },
];

export default function ControlCenter({ isOpen, onClose, currentWallpaper, onWallpaperChange }: ControlCenterProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimatingOut(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside as unknown as EventListener);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as unknown as EventListener);
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsAnimatingOut(false);
      onClose();
    }, 200);
  };

  const handleWallpaperSelect = (wallpaper: WallpaperType) => {
    haptic();
    onWallpaperChange(wallpaper);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] transition-all duration-200 ${
        isAnimatingOut ? 'bg-transparent' : 'bg-black/20'
      }`}
    >
      <div
        ref={panelRef}
        className={`absolute right-2 top-8 w-[320px] md:w-[340px] bg-[#2d2d2d]/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-200 origin-top-right ${
          isAnimatingOut
            ? 'scale-95 opacity-0 translate-y-[-10px]'
            : 'scale-100 opacity-100 translate-y-0'
        }`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 0.5px rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/10">
          <h3 className="text-white/90 text-sm font-semibold">Wallpaper</h3>
        </div>

        {/* Wallpaper Grid */}
        <div className="p-3">
          <div className="grid grid-cols-3 gap-2">
            {WALLPAPERS.map((wallpaper) => (
              <button
                key={wallpaper.id}
                type="button"
                onClick={() => handleWallpaperSelect(wallpaper.id)}
                className={`relative aspect-[16/10] rounded-lg overflow-hidden transition-all duration-200 ${
                  currentWallpaper === wallpaper.id
                    ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#2d2d2d] scale-[1.02]'
                    : 'hover:scale-[1.05] active:scale-95'
                }`}
              >
                {/* Gradient preview */}
                <div
                  className="w-full h-full"
                  style={{ background: wallpaper.gradient }}
                >
                  {/* Terminal pattern overlay for terminal wallpaper */}
                  {wallpaper.id === 'terminal' && (
                    <div className="w-full h-full opacity-50" style={{
                      backgroundImage: `
                        radial-gradient(circle at 20% 30%, rgba(200,200,200,0.3) 1px, transparent 1px),
                        radial-gradient(circle at 60% 70%, rgba(200,200,200,0.3) 1px, transparent 1px),
                        radial-gradient(circle at 40% 50%, rgba(200,200,200,0.3) 1px, transparent 1px),
                        radial-gradient(circle at 80% 20%, rgba(200,200,200,0.3) 1px, transparent 1px)
                      `,
                      backgroundSize: '6px 6px',
                    }} />
                  )}
                  {/* Grid pattern overlay for ripple wallpaper */}
                  {wallpaper.id === 'ripple' && (
                    <div className="w-full h-full opacity-70" style={{
                      backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
                      `,
                      backgroundSize: '8px 8px',
                    }} />
                  )}
                </div>

                {/* Selected checkmark */}
                {currentWallpaper === wallpaper.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Wallpaper name tooltip on hover */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                  <span className="text-[9px] text-white/90 font-medium">{wallpaper.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer hint */}
        <div className="px-4 pb-3 pt-1">
          <p className="text-[10px] text-white/40 text-center">
            Tap to change desktop background
          </p>
        </div>
      </div>
    </div>
  );
}

// Control Center Toggle Button (for menu bar)
export function ControlCenterButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        haptic();
        onClick();
      }}
      className="flex items-center justify-center w-6 h-4 rounded hover:bg-black/10 active:bg-black/20 transition-colors"
      aria-label="Control Center"
    >
      {/* macOS Control Center icon - two pill shapes */}
      <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
        {/* Top toggle */}
        <rect x="1" y="1" width="14" height="4" rx="2" opacity="0.9" />
        {/* Bottom toggle */}
        <rect x="1" y="7" width="14" height="4" rx="2" opacity="0.5" />
      </svg>
    </button>
  );
}
