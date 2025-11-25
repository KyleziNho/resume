import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FloatingDock } from './floating-dock';
import { MacFolderIcon, MacDocIcon, MacTerminalIcon, MacDriveIcon, MacPreviewIcon, MacSafariIcon, MacMessagesIcon, MacPaintIcon, MacNotesIcon, MacAppStoreIcon } from './Icons';
import { AppData } from '../apps/AppStore';

type WindowId = 'welcome' | 'finder' | 'preview' | 'resume' | 'terminal' | 'safari' | 'paint' | 'messages' | 'game' | 'appstore';

interface WindowState {
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  title: string;
  iconType: 'drive' | 'folder' | 'terminal' | 'doc' | 'preview' | 'safari' | 'messages' | 'paint' | 'notes' | 'appstore';
  pos: { x: number; y: number };
  size: { width: number; height: number };
}

interface DockProps {
  windows: Record<WindowId, WindowState>;
  onOpenWindow: (id: WindowId) => void;
  onRestoreWindow: (id: WindowId) => void;
  onFocusWindow: (id: WindowId) => void;
  hasMessagesNotification?: boolean;
  appStoreNotificationCount?: number;
  installedApps?: AppData[];
  installedAppWindows?: Record<string, { isOpen: boolean; isMinimized: boolean }>;
  onOpenApp?: (appId: string) => void;
  onRestoreApp?: (appId: string) => void;
  onFocusApp?: (appId: string) => void;
}

const Dock: React.FC<DockProps> = ({ windows, onOpenWindow, onRestoreWindow, onFocusWindow, hasMessagesNotification = false, appStoreNotificationCount = 0, installedApps = [], installedAppWindows = {}, onOpenApp, onRestoreApp, onFocusApp }) => {
  const [dockVisible, setDockVisible] = useState(true);
  const [isHoveringDock, setIsHoveringDock] = useState(false);

  // Check if any window is maximized
  const hasMaximizedWindow = Object.values(windows).some(
    (win) => win.isOpen && win.isMaximized && !win.isMinimized
  );

  // Immediately hide dock when window is maximized
  useEffect(() => {
    if (hasMaximizedWindow) {
      setDockVisible(false);
    } else {
      setDockVisible(true);
    }
  }, [hasMaximizedWindow]);

  // Handle mouse movement to show dock when cursor is at bottom (desktop only)
  useEffect(() => {
    if (!hasMaximizedWindow) {
      return;
    }

    // Check if device has fine pointer (mouse) - desktop only
    const hasMousePointer = window.matchMedia('(pointer: fine)').matches;
    if (!hasMousePointer) {
      // Mobile/touch device - don't show dock on touch
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const windowHeight = window.innerHeight;
      const triggerZone = 100; // Show dock when cursor is within 100px of bottom

      if (e.clientY >= windowHeight - triggerZone || isHoveringDock) {
        setDockVisible(true);
      } else {
        setDockVisible(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [hasMaximizedWindow, isHoveringDock]);
  const renderIcon = (iconType: 'drive' | 'folder' | 'terminal' | 'doc' | 'preview' | 'safari' | 'messages' | 'paint' | 'notes' | 'appstore') => {
    switch (iconType) {
      case 'drive': return <MacDriveIcon />;
      case 'folder': return <MacFolderIcon />;
      case 'terminal': return <MacTerminalIcon />;
      case 'doc': return <MacDocIcon />;
      case 'preview': return <MacPreviewIcon />;
      case 'safari': return <MacSafariIcon />;
      case 'messages': return <MacMessagesIcon />;
      case 'paint': return <MacPaintIcon />;
      case 'notes': return <MacNotesIcon />;
      case 'appstore': return <MacAppStoreIcon />;
      default: return <MacFolderIcon />;
    }
  };

  // Permanent dock apps that always show
  const permanentWindowIds: WindowId[] = ['safari', 'messages', 'appstore'];

  // All window items
  const allWindowItems: Array<{ id: WindowId; title: string; icon: React.ReactNode; isOpen: boolean }> = [
    { id: 'safari', title: windows.safari.title, icon: renderIcon(windows.safari.iconType), isOpen: windows.safari.isOpen },
    { id: 'messages', title: windows.messages.title, icon: renderIcon(windows.messages.iconType), isOpen: windows.messages.isOpen },
    { id: 'finder', title: windows.finder.title, icon: renderIcon(windows.finder.iconType), isOpen: windows.finder.isOpen },
    { id: 'preview', title: windows.preview.title, icon: renderIcon(windows.preview.iconType), isOpen: windows.preview.isOpen },
    { id: 'paint', title: windows.paint.title, icon: renderIcon(windows.paint.iconType), isOpen: windows.paint.isOpen },
    { id: 'resume', title: windows.resume.title, icon: renderIcon(windows.resume.iconType), isOpen: windows.resume.isOpen },
    { id: 'terminal', title: windows.terminal.title, icon: renderIcon(windows.terminal.iconType), isOpen: windows.terminal.isOpen },
    { id: 'welcome', title: windows.welcome?.title || 'Notes', icon: renderIcon(windows.welcome?.iconType || 'notes'), isOpen: windows.welcome?.isOpen || false },
    { id: 'appstore', title: windows.appstore?.title || 'App Store', icon: renderIcon(windows.appstore?.iconType || 'appstore'), isOpen: windows.appstore?.isOpen || false },
  ];

  // Filter to show: permanent apps OR apps that are currently open
  const visibleWindowItems = allWindowItems.filter(
    (win) => permanentWindowIds.includes(win.id) || win.isOpen
  );

  const applicationItems = visibleWindowItems.map((win) => ({
    title: win.title,
    icon: (
      <div className="w-full h-full flex items-center justify-center relative">
        {win.icon}
        {win.id === 'messages' && hasMessagesNotification && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-lg">
            1
          </div>
        )}
        {win.id === 'appstore' && appStoreNotificationCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-lg">
            {appStoreNotificationCount}
          </div>
        )}
      </div>
    ),
    onClick: () => {
      const window = windows[win.id];
      if (window.isMinimized) {
        onRestoreWindow(win.id);
      } else if (!window.isOpen) {
        onOpenWindow(win.id);
      } else {
        onFocusWindow(win.id);
      }
    },
    isOpen: win.isOpen,
  }));

  // External link apps (GitHub and LinkedIn) - always show
  const externalApps = [
    {
      title: 'GitHub',
      icon: (
        <div className="w-full h-full flex items-center justify-center">
          <Image
            src="/github-icon.png"
            alt="GitHub"
            width={512}
            height={512}
            className="w-full h-full object-contain"
            priority
            quality={85}
          />
        </div>
      ),
      onClick: () => window.open('https://github.com/KyleziNho', '_blank', 'noopener,noreferrer'),
      isOpen: false,
    },
    {
      title: 'LinkedIn',
      icon: (
        <div className="w-full h-full flex items-center justify-center">
          <Image
            src="/linkedin-icon.png"
            alt="LinkedIn"
            width={512}
            height={512}
            className="w-full h-full object-contain"
            priority
            quality={85}
          />
        </div>
      ),
      onClick: () => window.open('https://www.linkedin.com/in/kos33/', '_blank', 'noopener,noreferrer'),
      isOpen: false,
    },
  ];

  // Add installed apps to dock with Liquid Glass effect - only show if open
  const installedAppItems = installedApps
    .filter((app) => installedAppWindows[app.id]?.isOpen) // Only show open apps
    .map((app) => {
      const windowState = installedAppWindows[app.id];
      const isMinimized = windowState?.isMinimized ?? false;

      return {
        title: app.name,
        icon: (
          <div className="w-full h-full flex items-center justify-center relative">
            {/* Liquid Glass Container - iOS 26 style */}
            <div className="relative w-[85%] h-[85%] rounded-[10px] overflow-hidden">
              {/* Frosted glass backdrop with blur */}
              <div
                className="absolute inset-0 backdrop-blur-md"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                }}
              />

              {/* App icon content */}
              <div className="absolute inset-0 p-[2%]">
                <Image
                  src={`${app.icon}?v=2`}
                  alt={app.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>

              {/* Specular highlight - top left */}
              <div
                className="absolute top-0 left-0 w-[60%] h-[60%] rounded-full blur-xl opacity-40"
                style={{
                  background: 'radial-gradient(circle at top left, rgba(255,255,255,0.8) 0%, transparent 70%)',
                }}
              />

              {/* Glass refraction edge highlight */}
              <div
                className="absolute inset-0 rounded-[10px]"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.1) 100%)',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5), inset 0 -1px 1px rgba(0,0,0,0.2)',
                }}
              />

              {/* Outer glass border */}
              <div
                className="absolute inset-0 rounded-[10px]"
                style={{
                  border: '0.5px solid rgba(255,255,255,0.2)',
                }}
              />
            </div>

            {/* Minimized indicator dot */}
            {isMinimized && (
              <div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.8)',
                  boxShadow: '0 0 3px rgba(0,0,0,0.5)',
                }}
              />
            )}
          </div>
        ),
        onClick: () => {
          if (isMinimized && onRestoreApp) {
            onRestoreApp(app.id);
          } else if (onFocusApp) {
            onFocusApp(app.id);
          }
        },
        isOpen: true,
      };
    });

  const dockItems = [...applicationItems, ...installedAppItems, ...externalApps];

  return (
    <div
      className="fixed bottom-4 left-1/2 z-[100] transition-all duration-300 ease-in-out"
      style={{
        transform: `translate(-50%, ${dockVisible ? '0' : 'calc(100% + 2rem)'})`,
        opacity: dockVisible ? 1 : 0,
      }}
      onMouseEnter={() => setIsHoveringDock(true)}
      onMouseLeave={() => setIsHoveringDock(false)}
    >
      <FloatingDock
        items={dockItems}
        // Note: The background of the Dock bar itself is controlled here.
        // If you want the bar fully transparent, remove bg-black/10 and backdrop-blur.
        desktopClassName="bg-black/10 dark:bg-neutral-900/80 backdrop-blur-2xl border border-white/20 pb-2"
      />
    </div>
  );
};

export default Dock;
