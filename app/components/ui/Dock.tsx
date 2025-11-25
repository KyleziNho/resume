import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FloatingDock } from './floating-dock';
import { MacFolderIcon, MacDocIcon, MacTerminalIcon, MacDriveIcon, MacPreviewIcon, MacSafariIcon, MacMessagesIcon, MacPaintIcon, MacNotesIcon } from './Icons';

type WindowId = 'welcome' | 'finder' | 'preview' | 'resume' | 'terminal' | 'safari' | 'paint' | 'messages';

interface WindowState {
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  title: string;
  iconType: 'drive' | 'folder' | 'terminal' | 'doc' | 'preview' | 'safari' | 'messages' | 'paint' | 'notes';
  pos: { x: number; y: number };
  size: { width: number; height: number };
}

interface DockProps {
  windows: Record<WindowId, WindowState>;
  onOpenWindow: (id: WindowId) => void;
  onRestoreWindow: (id: WindowId) => void;
  onFocusWindow: (id: WindowId) => void;
  hasMessagesNotification?: boolean;
}

const Dock: React.FC<DockProps> = ({ windows, onOpenWindow, onRestoreWindow, onFocusWindow, hasMessagesNotification = false }) => {
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
  const renderIcon = (iconType: 'drive' | 'folder' | 'terminal' | 'doc' | 'preview' | 'safari' | 'messages' | 'paint' | 'notes') => {
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
      default: return <MacFolderIcon />;
    }
  };

  // Create dock items for all windows
  const windowItems: Array<{ id: WindowId; title: string; icon: React.ReactNode; isOpen: boolean }> = [
    { id: 'finder', title: windows.finder.title, icon: renderIcon(windows.finder.iconType), isOpen: windows.finder.isOpen },
    { id: 'safari', title: windows.safari.title, icon: renderIcon(windows.safari.iconType), isOpen: windows.safari.isOpen },
    { id: 'messages', title: windows.messages.title, icon: renderIcon(windows.messages.iconType), isOpen: windows.messages.isOpen },
    { id: 'preview', title: windows.preview.title, icon: renderIcon(windows.preview.iconType), isOpen: windows.preview.isOpen },
    { id: 'paint', title: windows.paint.title, icon: renderIcon(windows.paint.iconType), isOpen: windows.paint.isOpen },
    { id: 'resume', title: windows.resume.title, icon: renderIcon(windows.resume.iconType), isOpen: windows.resume.isOpen },
    { id: 'terminal', title: windows.terminal.title, icon: renderIcon(windows.terminal.iconType), isOpen: windows.terminal.isOpen },
  ];

  const applicationItems = windowItems.map((win) => ({
    title: win.title,
    icon: (
      <div className="w-full h-full flex items-center justify-center relative">
        {win.icon}
        {win.id === 'messages' && hasMessagesNotification && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-lg">
            1
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

  // Permanent dock apps (GitHub and LinkedIn)
  const permanentApps = [
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
          />
        </div>
      ),
      onClick: () => window.open('https://www.linkedin.com/in/kos33/', '_blank', 'noopener,noreferrer'),
      isOpen: false,
    },
  ];

  const dockItems = [...applicationItems, ...permanentApps];

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
