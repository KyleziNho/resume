'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { haptic } from 'ios-haptics';

export type WallpaperType = 'terminal' | 'sequoia-light' | 'sequoia-dark' | 'sonoma' | 'ventura';

interface ControlCenterProps {
  isOpen: boolean;
  onClose: () => void;
  currentWallpaper: WallpaperType;
  onWallpaperChange: (wallpaper: WallpaperType) => void;
}

const WALLPAPERS: { id: WallpaperType; name: string; preview: string; color?: string }[] = [
  { id: 'terminal', name: 'Terminal', preview: '', color: '#1a1a1a' },
  { id: 'sequoia-light', name: 'Sequoia Light', preview: '/wallpapers/sequoia-light.jpg', color: '#d4a574' },
  { id: 'sequoia-dark', name: 'Sequoia Dark', preview: '/wallpapers/sequoia-dark.jpg', color: '#2d1f1a' },
  { id: 'sonoma', name: 'Sonoma', preview: '/wallpapers/sonoma.jpg', color: '#f5d6ba' },
  { id: 'ventura', name: 'Ventura', preview: '/wallpapers/ventura.jpg', color: '#4a7c9b' },
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
                {wallpaper.preview ? (
                  <Image
                    src={wallpaper.preview}
                    alt={wallpaper.name}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: wallpaper.color }}
                  >
                    {/* Terminal pattern preview */}
                    <div className="w-full h-full opacity-60 overflow-hidden">
                      <div className="w-full h-full" style={{
                        backgroundImage: `
                          radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 1px, transparent 1px),
                          radial-gradient(circle at 60% 70%, rgba(255,255,255,0.1) 1px, transparent 1px),
                          radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: '8px 8px',
                      }} />
                    </div>
                  </div>
                )}

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
