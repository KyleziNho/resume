'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { haptic } from 'ios-haptics';

export interface AppData {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  link: string;
  website?: string; // Optional website URL
  description: string;
  progressNotes?: string; // Optional detailed progress notes
  videoId?: string; // Optional Vimeo video ID
  images: string[];
  progress: number; // 0-100
  stage: string;
  technologies: string[];
}

export const apps: AppData[] = [
  {
    id: 'onlybills',
    name: 'OnlyBills',
    tagline: 'Split bills, not friendships',
    icon: '/app-onlybills.png',
    link: 'https://apps.apple.com/app/onlybills',
    description: 'The easiest way to split receipts. Snap a photo and AI extracts items, prices, tax and tips. Assign items to friends and see exactly who owes what.',
    videoId: '1140723788',
    images: ['/app-onlybills.png'],
    progress: 90,
    stage: 'In Development',
    technologies: ['SwiftUI', 'SwiftData', 'Google Gemini', 'Vision']
  },
  {
    id: 'frift',
    name: 'Frift',
    tagline: 'Your campus marketplace',
    icon: '/app-frift.png',
    link: 'https://apps.apple.com/gb/app/frift-student-marketplace/id6745021634',
    website: 'https://www.frift.uk',
    description: 'Started with friends at uni - nightlife tickets were sold across snapchat and whatsapp making them hard to find. Surveyed 100 people, discovered we should also list clothes. Flew to Chicago to learn Flutter from a friend, spent 3 months building it solo. Won Santander X and made it to final round of Dragons Den (Bath).',
    progressNotes: 'App is fully built and live on the App Store. Won some competitions which was super validating. Now integrated into a Bath uni course module where students work on it as part of their degree. Next step is properly marketing it and getting users - that\'s the hard part. This was my first big software project so it\'s been a massive learning experience. Will keep iterating on it.',
    videoId: '1068684400',
    images: ['/frift-screenshot-1.png', '/frift-screenshot-2.png', '/frift-screenshot-3.png', '/frift-screenshot-4.png', '/frift-screenshot-5.png'],
    progress: 100,
    stage: 'Live on App Store',
    technologies: ['Flutter', 'Firebase', 'Firestore', 'Cloud Functions']
  },
  {
    id: 'arcadeus',
    name: 'Arcadeus',
    tagline: 'M&A Deal Modeling',
    icon: '/app-arcadeus.png',
    link: 'https://arcadeus.com',
    description: 'Professional Excel add-in for M&A and PE deal modeling. AI-powered data extraction from financial documents with automated model generation.',
    images: ['/app-arcadeus.png'],
    progress: 85,
    stage: 'In Development',
    technologies: ['Node.js', 'Python', 'OpenAI', 'Excel API']
  },
  {
    id: 'kyro',
    name: 'Kyro',
    tagline: 'Multiplayer Card Game',
    icon: '/app-kyro.png',
    link: 'https://kyro.onl',
    description: 'Real-time multiplayer card game where you compete for the lowest score. Use power cards strategically, match cards to eliminate them, and call Kyro to win.',
    videoId: '1140726803',
    images: ['/app-kyro.png'],
    progress: 100,
    stage: 'Live',
    technologies: ['Node.js', 'Express', 'Socket.IO', 'HTML5']
  },
];

interface AppStoreProps {
  onAppInstalled?: (app: AppData) => void;
  onUninstallAll?: () => void;
  initialInstalledApps?: AppData[];
}

export default function AppStore({ onAppInstalled, onUninstallAll, initialInstalledApps = [] }: AppStoreProps) {
  const [installedApps, setInstalledApps] = useState<Set<string>>(
    new Set(initialInstalledApps.map(app => app.id))
  );
  const [loadingApps, setLoadingApps] = useState<Set<string>>(new Set());
  const [isUninstalling, setIsUninstalling] = useState(false);

  const handleAppClick = (app: AppData) => {
    if (installedApps.has(app.id)) {
      // If installed, notify parent to open the app details
      haptic();
      if (onAppInstalled) {
        onAppInstalled(app);
      }
    } else if (!loadingApps.has(app.id)) {
      // If not installed and not loading, start "installation"
      setLoadingApps(prev => new Set(prev).add(app.id));

      // Pulsing haptic feedback during installation (like resize)
      haptic.error();
      const pulseInterval = setInterval(() => {
        haptic.error();
      }, 300);

      // Simulate installation with loading bar (1.2 seconds)
      setTimeout(() => {
        clearInterval(pulseInterval);

        setLoadingApps(prev => {
          const newSet = new Set(prev);
          newSet.delete(app.id);
          return newSet;
        });
        setInstalledApps(prev => new Set(prev).add(app.id));

        // Notify parent that app was installed
        if (onAppInstalled) {
          onAppInstalled(app);
        }

        // Final completion haptics
        setTimeout(() => {
          haptic();
          setTimeout(() => {
            haptic();
          }, 100);
        }, 250);
      }, 1200);
    }
  };

  const handleUninstallAll = () => {
    if (installedApps.size === 0 || isUninstalling) return;

    setIsUninstalling(true);

    // Pulsing haptic feedback during uninstall
    haptic.error();
    const pulseInterval = setInterval(() => {
      haptic.error();
    }, 300);

    // Simulate uninstall with loading bar (1.2 seconds)
    setTimeout(() => {
      clearInterval(pulseInterval);

      // Clear all installed apps locally
      setInstalledApps(new Set());
      setIsUninstalling(false);

      // Notify parent to remove apps from dock/desktop and close windows
      if (onUninstallAll) {
        onUninstallAll();
      }

      // Final completion haptics
      setTimeout(() => {
        haptic();
        setTimeout(() => {
          haptic();
        }, 100);
      }, 250);
    }, 1200);
  };

  const hasInstalledApps = installedApps.size > 0;

  return (
    <div
      className="h-full flex flex-col font-sans select-none overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #c9d6e3 0%, #a8bcd0 25%, #94a8bc 50%, #a8bcd0 75%, #c9d6e3 100%)',
      }}
    >
      {/* Subtle mesh gradient for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 20% 20%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(100,130,170,0.2) 0%, transparent 50%)',
        }}
      />
      {/* Pinstripe Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          {/* "My Apps" Section Header - scrolls with content */}
          <div
            className="mb-3 px-3 py-2 rounded-lg border border-[#aaa] relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #4a90d9 0%, #357abd 50%, #2a5f8f 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            {/* Glossy overlay */}
            <div
              className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)',
              }}
            />
            <p className="text-white text-xs font-semibold relative z-10" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              My Apps
            </p>
          </div>

          {/* Apps Grid */}
          <div className="grid grid-cols-2 gap-3">
            {apps.map((app) => {
              const isInstalled = installedApps.has(app.id);
              const isLoading = loadingApps.has(app.id);

              return (
                <button
                  key={app.id}
                  onClick={() => handleAppClick(app)}
                  className="group relative rounded-2xl overflow-hidden transition-all duration-150 active:scale-[0.98] backdrop-blur-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.25) 100%)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 1px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(255,255,255,0.5)',
                  }}
                >
                  {/* Frosted glass inner glow */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.5) 0%, transparent 50%)',
                    }}
                  />
                  {/* Glossy top highlight */}
                  <div
                    className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, transparent 100%)',
                    }}
                  />
                  {/* Bottom edge shadow for depth */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-1/4 pointer-events-none"
                    style={{
                      background: 'linear-gradient(0deg, rgba(0,0,0,0.03) 0%, transparent 100%)',
                    }}
                  />

                  <div className="relative z-10 p-3 flex flex-col items-center">
                    {/* App Icon */}
                    <div className="relative mb-2">
                      <div className="relative w-16 h-16 rounded-[14px] overflow-hidden">
                        {/* App icon content */}
                        <Image
                          src={`${app.icon}?v=2`}
                          alt={app.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover rounded-[12px]"
                          unoptimized
                        />

                        {/* Subtle glass highlight overlay - doesn't obscure icon */}
                        <div
                          className="absolute inset-0 rounded-[14px] pointer-events-none"
                          style={{
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.15) 0%, transparent 40%, transparent 100%)',
                            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.15)',
                          }}
                        />
                      </div>
                    </div>

                    {/* App Name */}
                    <p
                      className="text-xs font-semibold text-center truncate w-full"
                      style={{
                        color: '#333',
                        textShadow: '0 1px 0 rgba(255,255,255,0.7)',
                      }}
                    >
                      {app.name}
                    </p>

                    {/* Tagline */}
                    <p className="text-[10px] text-gray-500 text-center truncate w-full">
                      {app.tagline}
                    </p>

                    {/* Button - INSTALL / LOADING / OPEN */}
                    <div className="mt-2 w-full flex justify-center">
                      {isLoading ? (
                        // Loading Bar - Aqua progress bar style
                        <div
                          className="w-full max-w-[80px] h-5 rounded-full overflow-hidden relative"
                          style={{
                            background: 'linear-gradient(180deg, #e0e0e0 0%, #c8c8c8 100%)',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.8)',
                          }}
                        >
                          {/* Animated progress fill */}
                          <div
                            className="h-full animate-loading-bar"
                            style={{
                              background: 'linear-gradient(180deg, #6cb4f5 0%, #3d9df5 30%, #1a7de8 70%, #1565c0 100%)',
                              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
                              animation: 'loadingBar 1.2s ease-out forwards',
                            }}
                          />
                          {/* Glossy overlay on progress bar */}
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(0,0,0,0.1) 100%)',
                            }}
                          />
                        </div>
                      ) : (
                        // INSTALL or OPEN Button
                        <div
                          className="px-4 py-1 rounded-full text-[10px] font-bold text-white transition-all duration-300 ease-out"
                          style={{
                            background: isInstalled
                              ? 'linear-gradient(180deg, #7ed97e 0%, #5bc95b 30%, #3ab53a 70%, #2a9d2a 100%)'
                              : 'linear-gradient(180deg, #6cb4f5 0%, #3d9df5 30%, #1a7de8 70%, #1565c0 100%)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 2px rgba(0,0,0,0.2)',
                            textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
                          }}
                        >
                          <span className="inline-block transition-all duration-200 ease-out">
                            {isInstalled ? 'OPEN' : 'INSTALL'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hover/Active state overlay */}
                  <div
                    className="absolute inset-0 transition-all duration-150 pointer-events-none group-hover:opacity-100 group-active:opacity-100 opacity-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Uninstall All Button - macOS boot screen style */}
          <div className="mt-4">
            {isUninstalling ? (
              // Uninstalling state - macOS boot progress bar style
              <div className="flex flex-col items-center gap-2">
                {/* Progress bar container - matches My Apps width */}
                <div
                  className="w-full h-[6px] rounded-full overflow-hidden"
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  {/* Animated progress fill */}
                  <div
                    className="h-full rounded-full"
                    style={{
                      background: 'linear-gradient(180deg, #ffffff 0%, #e0e0e0 50%, #cccccc 100%)',
                      boxShadow: '0 0 4px rgba(255,255,255,0.5)',
                      animation: 'loadingBar 1.2s ease-out forwards',
                    }}
                  />
                </div>
                {/* Uninstalling text */}
                <p className="text-[10px] text-gray-600" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
                  Uninstalling...
                </p>
              </div>
            ) : (
              // Uninstall All button
              <button
                onClick={handleUninstallAll}
                disabled={!hasInstalledApps}
                className={`w-full rounded-lg border border-[#aaa] relative overflow-hidden transition-all duration-150 ${
                  hasInstalledApps
                    ? 'active:scale-[0.98] cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                style={{
                  background: hasInstalledApps
                    ? 'linear-gradient(135deg, #d94545 0%, #c53030 50%, #a02525 100%)'
                    : 'linear-gradient(135deg, #888 0%, #777 50%, #666 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px rgba(0,0,0,0.3)',
                }}
              >
                {/* Glossy overlay */}
                <div
                  className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)',
                  }}
                />
                <p className="text-white text-xs font-semibold relative z-10 py-2" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                  Uninstall All
                </p>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Subtle branding */}
      <div
        className="h-8 flex items-center justify-center border-t border-[#bbb] shrink-0"
        style={{
          background: 'linear-gradient(180deg, #d8d8d8 0%, #c0c0c0 100%)',
        }}
      >
        <p className="text-[10px] text-gray-500" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
          Founded and developed by me
        </p>
      </div>

      {/* Keyframe animation for loading bar */}
      <style jsx>{`
        @keyframes loadingBar {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
