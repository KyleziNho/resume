'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPin, Calendar, Cpu, Heart } from 'lucide-react';
import FaultyTerminal from './components/FaultyTerminal';
import MacWindow from './components/ui/MacWindow';
import DesktopIcon from './components/ui/DesktopIcon';
import ContextMenu, { ContextMenuItem } from './components/ui/ContextMenu';
import Dock from './components/ui/Dock';
import PreviewWindow from './components/apps/PreviewWindow';
import Finder from './components/apps/Finder';
import Safari from './components/apps/Safari';
import MacPaint from './components/apps/MacPaint';
import MessagesApp from './components/apps/MessagesApp';
import NotesApp from './components/apps/NotesApp';
import LetterGlitch from './components/ui/LetterGlitch';
import { projects } from './data/projects';
import { haptic } from 'ios-haptics';

// Memoized background component to prevent restarts
const TerminalBackground = React.memo(() => {
  const gridMul = useMemo(() => [2, 1] as [number, number], []);

  return (
    <div className="fixed inset-0 z-0">
      <FaultyTerminal
        scale={1.5}
        gridMul={gridMul}
        digitSize={1.2}
        timeScale={0.2}
        pause={false}
        scanlineIntensity={0.3}
        glitchAmount={0.3}
        flickerAmount={0.2}
        noiseAmp={0.5}
        chromaticAberration={0}
        dither={0}
        curvature={0}
        tint="#cccccc"
        mouseReact={false}
        mouseStrength={0}
        pageLoadAnimation={false}
        brightness={0.3}
      />
    </div>
  );
});

TerminalBackground.displayName = 'TerminalBackground';

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

export default function MacOsPortfolio() {
  const [booted, setBooted] = useState(false);
  const [time, setTime] = useState('');
  const [zIndex, setZIndex] = useState(10);
  const [activeProject, setActiveProject] = useState<any>(null);
  const [showAppleMenu, setShowAppleMenu] = useState(false);
  const appleMenuRef = useRef<HTMLDivElement>(null);

  // Project rename state - maps project IDs to custom names
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});
  const [paintImage, setPaintImage] = useState('/me.png');

  const [windows, setWindows] = useState<Record<WindowId, WindowState>>({
    welcome: {
      isOpen: true, isMinimized: false, isMaximized: false, zIndex: 10,
      title: 'About Kyle',
      iconType: 'notes' as const,
      pos: { x: 300, y: 100 }, size: { width: 600, height: 500 }
    },
    finder: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'Finder',
      iconType: 'folder' as const,
      pos: { x: 100, y: 100 }, size: { width: 700, height: 500 }
    },
    preview: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'Preview',
      iconType: 'preview' as const,
      pos: { x: 200, y: 100 }, size: { width: 850, height: 550 }
    },
    resume: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'Bio.pdf',
      iconType: 'doc' as const,
      pos: { x: 400, y: 100 }, size: { width: 600, height: 600 }
    },
    terminal: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'Terminal',
      iconType: 'terminal' as const,
      pos: { x: 100, y: 400 }, size: { width: 500, height: 350 }
    },
    safari: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'Safari',
      iconType: 'safari' as const,
      pos: { x: 150, y: 120 }, size: { width: 900, height: 600 }
    },
    paint: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'Paint',
      iconType: 'paint' as const,
      pos: { x: 180, y: 90 }, size: { width: 900, height: 650 }
    },
    messages: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'KyleBOT',
      iconType: 'messages' as const,
      pos: { x: 150, y: 80 }, size: { width: 850, height: 600 }
    }
  });

  const [hasMessagesNotification, setHasMessagesNotification] = useState(true);

  const [iconPos, setIconPos] = useState({
    hd: { x: 20, y: 40 },
    finder: { x: 20, y: 150 },
    resume: { x: 20, y: 260 },
    terminal: { x: 20, y: 370 },
    safari: { x: 20, y: 480 },
    paint: { x: 20, y: 590 },
    messages: { x: 20, y: 700 }
  });

  const [iconScale, setIconScale] = useState(1);

  const [iconLabels, setIconLabels] = useState({
    hd: 'intro',
    finder: 'my apps',
    resume: 'resume.pdf',
    terminal: 'Terminal',
    safari: 'Safari',
    paint: 'Paint',
    messages: 'KyleBOT'
  });

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
        const now = new Date();
        setTime(now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    }, 1000);
    setTimeout(() => setBooted(true), 3000);
    return () => clearInterval(timer);
  }, []);

  // Prevent pull-to-refresh on mobile
  useEffect(() => {
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].pageY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].pageY;

      // Prevent pull-to-refresh when at top and pulling down
      if (window.scrollY <= 0 && currentY > startY) {
        e.preventDefault();
      }
    };

    // Must use passive: false to allow preventDefault on iOS
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Position initial welcome window on mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const menuBarHeight = 24;
      const dockHeight = 80;

      const availableWidth = viewportWidth - 40;
      const availableHeight = viewportHeight - menuBarHeight - dockHeight - 40;

      const welcomeWindow = windows.welcome;
      const windowWidth = Math.min(welcomeWindow.size.width, availableWidth);
      const windowHeight = Math.min(welcomeWindow.size.height, availableHeight);

      const centerX = (viewportWidth - windowWidth) / 2;
      const centerY = menuBarHeight + ((availableHeight - windowHeight) / 2);

      setWindows(prev => ({
        ...prev,
        welcome: {
          ...prev.welcome,
          pos: { x: Math.max(0, centerX), y: Math.max(menuBarHeight, centerY) },
          size: { width: windowWidth, height: windowHeight }
        }
      }));
    }
  }, []);

  // Close Apple menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (appleMenuRef.current && !appleMenuRef.current.contains(e.target as Node)) {
        setShowAppleMenu(false);
      }
    };

    if (showAppleMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAppleMenu]);

  // Responsive desktop icons - adjust positions and scale based on window size
  useEffect(() => {
    const calculateIconLayout = () => {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const menuBarHeight = 24; // Top menu bar
      const dockHeight = 80; // Bottom dock area
      const availableHeight = viewportHeight - menuBarHeight - dockHeight;

      const iconCount = 7; // Number of desktop icons
      const isMobile = viewportWidth < 768;

      if (isMobile) {
        // Mobile: Grid layout (2-3 columns)
        const cols = viewportWidth < 400 ? 2 : 3;
        const rows = Math.ceil(iconCount / cols);
        const baseIconWidth = 90;
        const baseIconHeight = 90;
        const horizontalPadding = 15;
        const topPadding = 30;

        const availableWidth = viewportWidth - (horizontalPadding * 2);
        const iconWidth = availableWidth / cols;
        const scale = Math.min(1, iconWidth / baseIconWidth);

        const icons = [
          'hd', 'finder', 'resume', 'terminal',
          'safari', 'paint', 'messages'
        ];

        const newPositions: any = {};
        icons.forEach((icon, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          newPositions[icon] = {
            x: horizontalPadding + (col * iconWidth),
            y: topPadding + (row * baseIconHeight * scale)
          };
        });

        setIconPos(newPositions);
        setIconScale(scale);
      } else {
        // Desktop: Single column
        const baseIconHeight = 110;
        const minIconHeight = 70;
        const topPadding = 40;
        const requiredHeight = (iconCount * baseIconHeight) + topPadding;

        let scale = 1;
        let iconSpacing = baseIconHeight;

        if (requiredHeight > availableHeight) {
          const maxSpacing = (availableHeight - topPadding) / iconCount;
          iconSpacing = Math.max(minIconHeight, maxSpacing);
          scale = Math.max(0.6, iconSpacing / baseIconHeight);
        }

        setIconPos({
          hd: { x: 20, y: topPadding },
          finder: { x: 20, y: topPadding + iconSpacing },
          resume: { x: 20, y: topPadding + iconSpacing * 2 },
          terminal: { x: 20, y: topPadding + iconSpacing * 3 },
          safari: { x: 20, y: topPadding + iconSpacing * 4 },
          paint: { x: 20, y: topPadding + iconSpacing * 5 },
          messages: { x: 20, y: topPadding + iconSpacing * 6 }
        });

        setIconScale(scale);
      }
    };

    calculateIconLayout();
    window.addEventListener('resize', calculateIconLayout);

    return () => window.removeEventListener('resize', calculateIconLayout);
  }, []);

  const focusWindow = (id: string) => {
    const windowId = id as WindowId;
    setZIndex(z => z + 1);
    setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], zIndex: zIndex + 1 } }));
  };

  const openWindow = (id: string) => {
    const windowId = id as WindowId;
    focusWindow(id);

    // Haptic feedback for opening app
    haptic();

    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // On mobile, center window and size it appropriately for mobile screens
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const menuBarHeight = 24;
      const dockHeight = 80;

      // App-specific sizing for better mobile experience
      let mobileWindowWidth: number;
      let mobileWindowHeight: number;

      switch (windowId) {
        case 'paint':
        case 'safari':
        case 'messages':
          // Larger content apps - use more screen space but still contained
          mobileWindowWidth = Math.min(viewportWidth - 30, 380);
          mobileWindowHeight = Math.min(viewportHeight - menuBarHeight - dockHeight - 50, 550);
          break;
        case 'finder':
        case 'preview':
          // Medium-sized apps
          mobileWindowWidth = Math.min(viewportWidth - 40, 350);
          mobileWindowHeight = Math.min(viewportHeight - menuBarHeight - dockHeight - 60, 500);
          break;
        default:
          // Smaller apps (terminal, resume, welcome)
          mobileWindowWidth = Math.min(viewportWidth - 50, 320);
          mobileWindowHeight = Math.min(viewportHeight - menuBarHeight - dockHeight - 70, 480);
      }

      // Center the window
      const centerX = (viewportWidth - mobileWindowWidth) / 2;
      const centerY = menuBarHeight + ((viewportHeight - menuBarHeight - dockHeight - mobileWindowHeight) / 2);

      setWindows(prev => ({
        ...prev,
        [windowId]: {
          ...prev[windowId],
          isOpen: true,
          isMinimized: false,
          pos: { x: Math.max(0, centerX), y: Math.max(menuBarHeight + 10, centerY) },
          size: { width: mobileWindowWidth, height: mobileWindowHeight }
        }
      }));
    } else {
      setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], isOpen: true, isMinimized: false } }));
    }

    // Clear messages notification when opened
    if (windowId === 'messages') {
      setHasMessagesNotification(false);
    }
  };

  const closeWindow = (id: string) => {
    const windowId = id as WindowId;

    // Haptic feedback for closing app
    haptic();

    setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], isOpen: false } }));
  };

  const minimizeWindow = (id: string) => {
    const windowId = id as WindowId;

    // Haptic feedback for minimizing app
    haptic();

    setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], isMinimized: true } }));
  };

  const restoreWindow = (id: string) => {
    const windowId = id as WindowId;
    focusWindow(id);

    // Haptic feedback for restoring app
    haptic();

    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // On mobile, re-center window when restoring with appropriate sizes
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const menuBarHeight = 24;
      const dockHeight = 80;

      // App-specific sizing for better mobile experience
      let mobileWindowWidth: number;
      let mobileWindowHeight: number;

      switch (windowId) {
        case 'paint':
        case 'safari':
        case 'messages':
          // Larger content apps - use more screen space but still contained
          mobileWindowWidth = Math.min(viewportWidth - 30, 380);
          mobileWindowHeight = Math.min(viewportHeight - menuBarHeight - dockHeight - 50, 550);
          break;
        case 'finder':
        case 'preview':
          // Medium-sized apps
          mobileWindowWidth = Math.min(viewportWidth - 40, 350);
          mobileWindowHeight = Math.min(viewportHeight - menuBarHeight - dockHeight - 60, 500);
          break;
        default:
          // Smaller apps (terminal, resume, welcome)
          mobileWindowWidth = Math.min(viewportWidth - 50, 320);
          mobileWindowHeight = Math.min(viewportHeight - menuBarHeight - dockHeight - 70, 480);
      }

      // Center the window
      const centerX = (viewportWidth - mobileWindowWidth) / 2;
      const centerY = menuBarHeight + ((viewportHeight - menuBarHeight - dockHeight - mobileWindowHeight) / 2);

      setWindows(prev => ({
        ...prev,
        [windowId]: {
          ...prev[windowId],
          isMinimized: false,
          pos: { x: Math.max(0, centerX), y: Math.max(menuBarHeight + 10, centerY) },
          size: { width: mobileWindowWidth, height: mobileWindowHeight }
        }
      }));
    } else {
      setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], isMinimized: false } }));
    }
  };

  const maximizeWindow = (id: string) => {
    const windowId = id as WindowId;

    // Pulsing haptic feedback during resize animation
    // Uses three rapid haptics for a pulsing feel
    haptic.error();

    setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], isMaximized: !prev[windowId].isMaximized } }));
  };

  const openProjectPreview = (project: any) => {
    setActiveProject(project);
    setWindows(prev => ({
      ...prev,
      preview: { ...prev.preview, isOpen: true, title: `Preview — ${project.title}`, isMinimized: false, zIndex: zIndex + 1 }
    }));
  };

  const renameProject = (projectId: string, newName: string) => {
    setProjectNames(prev => ({ ...prev, [projectId]: newName }));
    // If this project is currently previewed, update the window title
    if (activeProject && activeProject.id === projectId) {
      setWindows(prev => ({
        ...prev,
        preview: { ...prev.preview, title: `Preview — ${newName}` }
      }));
      setActiveProject((prev: any) => ({ ...prev, title: newName }));
    }
  };

  // Create enriched projects with custom names
  const enrichedProjects = projects.map(project => ({
    ...project,
    title: projectNames[project.id] || project.title
  }));

  const handleIconRename = (iconId: string, newLabel: string) => {
    setIconLabels(prev => ({ ...prev, [iconId]: newLabel }));
  };

  const handleIconContextMenu = (e: React.MouseEvent, iconId: string, label: string, startRename: () => void) => {
    const iconToWindowMap: Record<string, WindowId> = {
      hd: 'welcome',
      finder: 'finder',
      resume: 'resume',
      terminal: 'terminal',
      safari: 'safari',
      paint: 'paint',
      messages: 'messages',
    };

    const items: ContextMenuItem[] = [
      {
        label: 'Open',
        action: () => {
          const windowId = iconToWindowMap[iconId];
          if (windowId) openWindow(windowId);
        },
        shortcut: '⌘O'
      },
      { separator: true } as ContextMenuItem,
      {
        label: 'Get Info',
        action: () => console.log('Get Info for', label),
        shortcut: '⌘I'
      },
      {
        label: 'Rename',
        action: startRename
      },
      { separator: true } as ContextMenuItem,
      {
        label: 'Duplicate',
        action: () => console.log('Duplicate', label),
        disabled: true
      },
      {
        label: 'Move to Trash',
        action: () => console.log('Delete', label),
        disabled: true
      }
    ];

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items
    });
  };

  if (!booted) {
    return (
        <div className="h-screen w-screen bg-[#ddd] flex flex-col items-center justify-center cursor-wait">
            <div className="text-[#555] mb-8">
                <svg width="80" height="80" viewBox="0 0 170 170" fill="currentColor"><path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.197-2.12-9.973-3.17-14.34-3.17-4.58 0-9.492 1.05-14.746 3.17-5.262 2.13-9.501 3.24-12.742 3.35-4.929.21-9.842-1.96-14.746-6.52-3.13-2.73-7.045-7.41-11.735-14.04-5.032-7.08-9.169-15.29-12.41-24.65-3.471-10.11-5.211-19.9-5.211-29.378 0-10.857 2.346-20.221 7.045-28.068 3.693-6.303 8.606-11.275 14.755-14.925s12.793-5.51 19.948-5.629c3.915 0 9.049 1.211 15.429 3.591 6.362 2.388 10.447 3.599 12.238 3.599 1.339 0 5.877-1.416 13.57-4.239 7.275-2.618 13.415-3.702 18.445-3.275 13.63 1.1 23.87 6.473 30.68 16.153-12.19 7.386-18.22 17.731-18.1 31.002.11 10.337 3.86 18.939 11.23 25.769 3.34 3.17 7.07 5.62 11.22 7.36-.9 2.61-1.85 5.11-2.86 7.51zM119.11 7.24c0 8.102-2.96 15.667-8.86 22.669-7.12 8.324-15.732 13.134-25.071 12.375a25.222 25.222 0 0 1-.188-3.07c0-7.778 3.386-16.102 9.399-22.908 3.002-3.446 6.82-6.311 11.45-8.597 4.62-2.252 8.99-3.497 13.1-3.71.12 1.083.17 2.166.17 3.24z"/></svg>
            </div>
            <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden font-sans text-[#333] select-none">
      <TerminalBackground />

      {/* Menu Bar */}
      <div className="absolute top-0 w-full h-6 bg-gradient-to-b from-[#e6e6e6] to-[#a8a8a8] border-b border-[#444] shadow-md flex items-center justify-between px-4 z-50 text-xs font-bold text-[#222] drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]">
         <div className="relative" ref={appleMenuRef}>
            <div
              className="flex gap-2 items-center cursor-pointer hover:bg-blue-600/20 px-2 py-0.5 rounded-[3px] transition-colors"
              onClick={() => {
                haptic();
                setShowAppleMenu(!showAppleMenu);
              }}
            >
               <svg width="14" height="14" viewBox="0 0 170 170" fill="currentColor">
                 <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.197-2.12-9.973-3.17-14.34-3.17-4.58 0-9.492 1.05-14.746 3.17-5.262 2.13-9.501 3.24-12.742 3.35-4.929.21-9.842-1.96-14.746-6.52-3.13-2.73-7.045-7.41-11.735-14.04-5.032-7.08-9.169-15.29-12.41-24.65-3.471-10.11-5.211-19.9-5.211-29.378 0-10.857 2.346-20.221 7.045-28.068 3.693-6.303 8.606-11.275 14.755-14.925s12.793-5.51 19.948-5.629c3.915 0 9.049 1.211 15.429 3.591 6.362 2.388 10.447 3.599 12.238 3.599 1.339 0 5.877-1.416 13.57-4.239 7.275-2.618 13.415-3.702 18.445-3.275 13.63 1.1 23.87 6.473 30.68 16.153-12.19 7.386-18.22 17.731-18.1 31.002.11 10.337 3.86 18.939 11.23 25.769 3.34 3.17 7.07 5.62 11.22 7.36-.9 2.61-1.85 5.11-2.86 7.51zM119.11 7.24c0 8.102-2.96 15.667-8.86 22.669-7.12 8.324-15.732 13.134-25.071 12.375a25.222 25.222 0 0 1-.188-3.07c0-7.778 3.386-16.102 9.399-22.908 3.002-3.446 6.82-6.311 11.45-8.597 4.62-2.252 8.99-3.497 13.1-3.71.12 1.083.17 2.166.17 3.24z"/>
               </svg>
               <span className="font-bold">KyleOS</span>
            </div>

            {/* Apple Menu Dropdown with LetterGlitch */}
            {showAppleMenu && (
              <div className="absolute top-full left-0 mt-1 w-[280px] h-[320px] bg-[#1a1a1a]/95 backdrop-blur-xl rounded-lg shadow-2xl border border-white/10 overflow-hidden">
                <LetterGlitch
                  glitchSpeed={50}
                  centerVignette={true}
                  outerVignette={false}
                  smooth={true}
                />
                {/* Text Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none">
                  <div className="bg-black/80 backdrop-blur-sm rounded-lg p-6 border border-white/20 shadow-2xl pointer-events-auto">
                    <p className="text-white text-center text-lg font-semibold mb-4 leading-relaxed">
                      Hire me to create a<br />resume website :)
                    </p>
                    <a
                      href="https://www.linkedin.com/in/kos33/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-[#0077b5] hover:bg-[#006396] text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      Connect on LinkedIn
                    </a>
                  </div>
                </div>
              </div>
            )}
         </div>

         <div className="flex gap-3 items-center">
            <span className="">{time}</span>
         </div>
      </div>

      {/* Desktop Icons */}
      <div className="absolute top-8 left-0 z-0 w-full h-full pointer-events-auto">
         <DesktopIcon
           id="hd"
           label={iconLabels.hd}
           type="notes"
           initialPos={iconPos.hd}
           scale={iconScale}
           onDoubleClick={() => openWindow('welcome')}
           onRename={handleIconRename}
           onContextMenu={handleIconContextMenu}
         />
         <DesktopIcon
           id="finder"
           label={iconLabels.finder}
           type="folder"
           initialPos={iconPos.finder}
           scale={iconScale}
           onDoubleClick={() => openWindow('finder')}
           onRename={handleIconRename}
           onContextMenu={handleIconContextMenu}
         />
         <DesktopIcon
           id="resume"
           label={iconLabels.resume}
           type="doc"
           initialPos={iconPos.resume}
           scale={iconScale}
           onDoubleClick={() => openWindow('resume')}
           onRename={handleIconRename}
           onContextMenu={handleIconContextMenu}
         />
         <DesktopIcon
           id="terminal"
           label={iconLabels.terminal}
           type="terminal"
           initialPos={iconPos.terminal}
           scale={iconScale}
           onDoubleClick={() => openWindow('terminal')}
           onRename={handleIconRename}
           onContextMenu={handleIconContextMenu}
         />
         <DesktopIcon
           id="safari"
           label={iconLabels.safari}
           type="safari"
           initialPos={iconPos.safari}
           scale={iconScale}
           onDoubleClick={() => openWindow('safari')}
           onRename={handleIconRename}
           onContextMenu={handleIconContextMenu}
         />
         <DesktopIcon
           id="paint"
           label={iconLabels.paint}
           type="paint"
           initialPos={iconPos.paint}
           scale={iconScale}
           onDoubleClick={() => openWindow('paint')}
           onRename={handleIconRename}
           onContextMenu={handleIconContextMenu}
         />
         <DesktopIcon
           id="messages"
           label={iconLabels.messages}
           type="messages"
           initialPos={iconPos.messages}
           scale={iconScale}
           onDoubleClick={() => openWindow('messages')}
           onRename={handleIconRename}
           onContextMenu={handleIconContextMenu}
         />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Dock */}
      <Dock
        windows={windows}
        onOpenWindow={openWindow}
        onRestoreWindow={restoreWindow}
        onFocusWindow={focusWindow}
        hasMessagesNotification={hasMessagesNotification}
      />

      {/* --- WINDOWS --- */}

      {/* WELCOME WINDOW */}
      <MacWindow
        id="welcome"
        title={windows.welcome.title}
        isOpen={windows.welcome.isOpen}
        isMinimized={windows.welcome.isMinimized}
        isMaximized={windows.welcome.isMaximized}
        zIndex={windows.welcome.zIndex}
        pos={windows.welcome.pos}
        size={windows.welcome.size}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
      >
        <NotesApp />
      </MacWindow>

      {/* FINDER WINDOW */}
      <MacWindow
        id="finder"
        title={windows.finder.title}
        isOpen={windows.finder.isOpen}
        isMinimized={windows.finder.isMinimized}
        isMaximized={windows.finder.isMaximized}
        zIndex={windows.finder.zIndex}
        pos={windows.finder.pos}
        size={windows.finder.size}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
      >
         <Finder items={enrichedProjects} onNavigate={openProjectPreview} onRename={renameProject} />
      </MacWindow>

      {/* PREVIEW WINDOW */}
      <MacWindow
        id="preview"
        title={windows.preview.title}
        isOpen={windows.preview.isOpen}
        isMinimized={windows.preview.isMinimized}
        isMaximized={windows.preview.isMaximized}
        zIndex={windows.preview.zIndex}
        pos={windows.preview.pos}
        size={windows.preview.size}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
      >
         <PreviewWindow project={activeProject} />
      </MacWindow>

      {/* RESUME WINDOW */}
      <MacWindow
        id="resume"
        title={windows.resume.title}
        isOpen={windows.resume.isOpen}
        isMinimized={windows.resume.isMinimized}
        isMaximized={windows.resume.isMaximized}
        zIndex={windows.resume.zIndex}
        pos={windows.resume.pos}
        size={windows.resume.size}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
      >
          <div className="bg-[#555] p-4 h-full flex justify-center">
              <div className="bg-white w-full max-w-md shadow-2xl p-8 text-xs font-serif text-gray-900 overflow-y-auto">
                  <div className="text-center border-b border-gray-300 pb-4 mb-4">
                     <h1 className="text-2xl font-bold uppercase tracking-widest">Kyle O'Sullivan</h1>
                     <p className="text-gray-500 italic mt-1">MSc Computer Science • Bath, UK</p>
                  </div>

                  <div className="space-y-4">
                     <section>
                        <h3 className="font-sans font-bold text-gray-500 uppercase border-b border-gray-200 mb-2">Education</h3>
                        <div className="mb-2">
                           <div className="flex justify-between font-bold"><span>University of Bath</span> <span>2025-26</span></div>
                           <p>MSc Computer Science (£15k Scholarship)</p>
                        </div>
                        <div className="mb-2">
                           <div className="flex justify-between font-bold"><span>University of Bath</span> <span>2022-25</span></div>
                           <p>BSc Management (First Class). #1 in Strategy w/ AI.</p>
                        </div>
                     </section>

                     <section>
                        <h3 className="font-sans font-bold text-gray-500 uppercase border-b border-gray-200 mb-2">Experience</h3>
                        <div className="mb-2">
                           <div className="flex justify-between font-bold"><span>180 Degrees Consulting</span> <span>2024</span></div>
                           <p>Strategy Consultant. Market analysis for Museums.</p>
                        </div>
                        <div className="mb-2">
                           <div className="flex justify-between font-bold"><span>SOBIC</span> <span>2024</span></div>
                           <p>Global Markets Researcher. Financial Modelling (DCF).</p>
                        </div>
                     </section>

                     <section>
                        <h3 className="font-sans font-bold text-gray-500 uppercase border-b border-gray-200 mb-2">Awards</h3>
                        <ul className="list-disc pl-4">
                           <li>Gold Scholarship (Top 50 recipients)</li>
                           <li>$7,000+ Won in Esports Competitions</li>
                        </ul>
                     </section>
                  </div>
              </div>
          </div>
      </MacWindow>

      {/* TERMINAL WINDOW */}
      <MacWindow
        id="terminal"
        title={windows.terminal.title}
        isOpen={windows.terminal.isOpen}
        isMinimized={windows.terminal.isMinimized}
        isMaximized={windows.terminal.isMaximized}
        zIndex={windows.terminal.zIndex}
        pos={windows.terminal.pos}
        size={windows.terminal.size}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
      >
         <div className="bg-black p-2 font-mono text-xs text-white h-full selection:bg-gray-500">
             <p>Last login: {time} on ttys000</p>
             <br/>
             <p>Kyles-MacBook-Pro:~ kyle$ <span className="text-yellow-400">cat skills.json</span></p>
             <pre className="text-green-400 mt-1">
{`{
  "languages": ["Python", "SQL", "R", "Dart", "JavaScript"],
  "frameworks": ["Flutter", "React", "Next.js", "Firebase"],
  "tools": ["LangGraph", "Office.js", "Excel"],
  "soft_skills": ["Strategy", "Public Speaking"]
}`}
             </pre>
             <p className="mt-2">Kyles-MacBook-Pro:~ kyle$ <span className="animate-pulse">_</span></p>
         </div>
      </MacWindow>

      {/* SAFARI WINDOW */}
      <MacWindow
        id="safari"
        title={windows.safari.title}
        isOpen={windows.safari.isOpen}
        isMinimized={windows.safari.isMinimized}
        isMaximized={windows.safari.isMaximized}
        zIndex={windows.safari.zIndex}
        pos={windows.safari.pos}
        size={windows.safari.size}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
      >
         <Safari initialUrl="https://www.kyro.onl" />
      </MacWindow>

      {/* PAINT WINDOW */}
      <MacWindow
        id="paint"
        title={windows.paint.title}
        isOpen={windows.paint.isOpen}
        isMinimized={windows.paint.isMinimized}
        isMaximized={windows.paint.isMaximized}
        zIndex={windows.paint.zIndex}
        pos={windows.paint.pos}
        size={windows.paint.size}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
      >
         <MacPaint imageSrc={paintImage} fileName="me.paint" />
      </MacWindow>

      {/* MESSAGES WINDOW */}
      <MacWindow
        id="messages"
        title={windows.messages.title}
        isOpen={windows.messages.isOpen}
        isMinimized={windows.messages.isMinimized}
        isMaximized={windows.messages.isMaximized}
        zIndex={windows.messages.zIndex}
        pos={windows.messages.pos}
        size={windows.messages.size}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
      >
         <MessagesApp />
      </MacWindow>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes minimize {
          from { transform: scale(1); opacity: 1; }
          to { transform: scale(0.1) translateY(100vh); opacity: 0; }
        }
        .animate-minimize {
          animation: minimize 0.4s cubic-bezier(0.4, 0.0, 1, 1) forwards;
        }
        @keyframes slide-up {
          from {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        }
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.15s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #e8e8e8;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}
