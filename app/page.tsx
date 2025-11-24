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
import Messages from './components/apps/Messages';
import LetterGlitch from './components/ui/LetterGlitch';
import { projects } from './data/projects';

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

type WindowId = 'welcome' | 'finder' | 'preview' | 'resume' | 'terminal' | 'contact' | 'safari' | 'paint' | 'messages';

interface WindowState {
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  title: string;
  iconType: 'drive' | 'folder' | 'terminal' | 'doc' | 'preview' | 'safari';
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
      iconType: 'drive' as const,
      pos: { x: 300, y: 100 }, size: { width: 380, height: 400 }
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
    contact: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'Contact',
      iconType: 'folder' as const,
      pos: { x: 200, y: 300 }, size: { width: 400, height: 450 }
    },
    safari: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'Safari',
      iconType: 'safari' as const,
      pos: { x: 150, y: 120 }, size: { width: 900, height: 600 }
    },
    paint: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'MacPaint',
      iconType: 'doc' as const,
      pos: { x: 180, y: 90 }, size: { width: 900, height: 650 }
    },
    messages: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'Messages',
      iconType: 'folder' as const,
      pos: { x: 150, y: 80 }, size: { width: 850, height: 600 }
    }
  });

  const [iconPos, setIconPos] = useState({
    hd: { x: 20, y: 40 },
    finder: { x: 20, y: 150 },
    resume: { x: 20, y: 260 },
    terminal: { x: 20, y: 370 },
    contact: { x: 20, y: 480 },
    safari: { x: 20, y: 590 },
    paint: { x: 20, y: 700 },
    messages: { x: 20, y: 810 }
  });

  const [iconScale, setIconScale] = useState(1);

  const [iconLabels, setIconLabels] = useState({
    hd: 'About Kyle',
    finder: 'My Work',
    resume: 'Bio.pdf',
    terminal: 'Terminal',
    contact: 'Contact',
    safari: 'Safari',
    paint: 'MacPaint',
    messages: 'Messages'
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

  // Responsive desktop icons - adjust positions and scale based on window height
  useEffect(() => {
    const calculateIconLayout = () => {
      const viewportHeight = window.innerHeight;
      const menuBarHeight = 24; // Top menu bar
      const dockHeight = 80; // Bottom dock area
      const availableHeight = viewportHeight - menuBarHeight - dockHeight;

      const iconCount = 8; // Number of desktop icons
      const baseIconHeight = 110; // Base height per icon (icon + label + gap)
      const minIconHeight = 70; // Minimum height per icon
      const topPadding = 40;

      // Calculate required height for all icons
      const requiredHeight = (iconCount * baseIconHeight) + topPadding;

      let scale = 1;
      let iconSpacing = baseIconHeight;

      // If icons don't fit, scale them down
      if (requiredHeight > availableHeight) {
        const maxSpacing = (availableHeight - topPadding) / iconCount;
        iconSpacing = Math.max(minIconHeight, maxSpacing);
        scale = Math.max(0.6, iconSpacing / baseIconHeight);
      }

      // Update icon positions
      setIconPos({
        hd: { x: 20, y: topPadding },
        finder: { x: 20, y: topPadding + iconSpacing },
        resume: { x: 20, y: topPadding + iconSpacing * 2 },
        terminal: { x: 20, y: topPadding + iconSpacing * 3 },
        contact: { x: 20, y: topPadding + iconSpacing * 4 },
        safari: { x: 20, y: topPadding + iconSpacing * 5 },
        paint: { x: 20, y: topPadding + iconSpacing * 6 },
        messages: { x: 20, y: topPadding + iconSpacing * 7 }
      });

      setIconScale(scale);
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
    setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], isOpen: true, isMinimized: false } }));
  };

  const closeWindow = (id: string) => {
    const windowId = id as WindowId;
    setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], isOpen: false } }));
  };

  const minimizeWindow = (id: string) => {
    const windowId = id as WindowId;
    setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], isMinimized: true } }));
  };

  const restoreWindow = (id: string) => {
    const windowId = id as WindowId;
    focusWindow(id);
    setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], isMinimized: false } }));
  };

  const maximizeWindow = (id: string) => {
    const windowId = id as WindowId;
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
      contact: 'contact'
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
              onClick={() => setShowAppleMenu(!showAppleMenu)}
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
           type="drive"
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
           id="contact"
           label={iconLabels.contact}
           type="folder"
           initialPos={iconPos.contact}
           scale={iconScale}
           onDoubleClick={() => openWindow('contact')}
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
           type="doc"
           initialPos={iconPos.paint}
           scale={iconScale}
           onDoubleClick={() => openWindow('paint')}
           onRename={handleIconRename}
           onContextMenu={handleIconContextMenu}
         />
         <DesktopIcon
           id="messages"
           label={iconLabels.messages}
           type="folder"
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
         <div className="flex flex-col h-full bg-[#F5F5F7] text-[#1d1d1f] font-sans">
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-b from-gray-200 to-gray-300 shadow-md border-4 border-white overflow-hidden mb-3">
                    <img src="/me.png" alt="Kyle" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute bottom-3 right-0 w-6 h-6 bg-green-500 border-2 border-white rounded-full" title="Online / Open to work"></div>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-black">Kyle O'Sullivan</h1>
                <p className="text-sm text-gray-500 font-medium">Apple ID: kyle@bath.ac.uk</p>
              </div>

              <div className="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.06)] overflow-hidden mb-4 border border-gray-200/60">
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Overview</h3>
                  <p className="text-[13px] leading-relaxed text-gray-700">
                    I'm a Master's student in Computer Science at the <span className="font-semibold text-black">University of Bath</span>. 
                    I bridge the gap between complex backend logic and clean, Apple-inspired frontend design.
                    Currently exploring how AI can optimize strategic decision-making.
                  </p>
                </div>
                <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 flex justify-between items-center">
                   <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin size={12} /> Bath, United Kingdom
                   </div>
                   <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar size={12} /> Class of 2026
                   </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.06)] mb-4 border border-gray-200/60">
                <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                   <Cpu size={14} className="text-blue-500" />
                   <span className="text-sm font-semibold">System Specifications</span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-y-3 gap-x-2">
                   <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Core</span>
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] rounded font-medium border border-blue-100">React</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] rounded font-medium border border-blue-100">Next.js</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] rounded font-medium border border-blue-100">TS</span>
                      </div>
                   </div>
                   <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Memory</span>
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[11px] rounded font-medium border border-purple-100">Python</span>
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[11px] rounded font-medium border border-purple-100">SQL</span>
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[11px] rounded font-medium border border-purple-100">AI/ML</span>
                      </div>
                   </div>
                   <div className="col-span-2">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Architecture</span>
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded border border-gray-200">Flutter</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded border border-gray-200">Firebase</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded border border-gray-200">Tailwind</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded border border-gray-200">Git</span>
                      </div>
                   </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-gray-200/60">
                 <div className="p-3 flex items-center gap-2 border-b border-gray-100">
                    <Heart size={14} className="text-red-500" />
                    <span className="text-sm font-semibold">User Data</span>
                 </div>
                 <div className="p-4 flex justify-between items-center text-xs">
                    <div className="flex flex-col items-center gap-1 text-gray-600">
                       <span className="text-lg">✈️</span>
                       <span>Travel</span>
                    </div>
                     <div className="w-[1px] h-8 bg-gray-200"></div>
                    <div className="flex flex-col items-center gap-1 text-gray-600">
                       <span className="text-lg">🏸</span>
                       <span>Sports</span>
                    </div>
                    <div className="w-[1px] h-8 bg-gray-200"></div>
                    <div className="flex flex-col items-center gap-1 text-gray-600">
                       <span className="text-lg">☕</span>
                       <span>Coffee</span>
                    </div>
                    <div className="w-[1px] h-8 bg-gray-200"></div>
                    <div className="flex flex-col items-center gap-1 text-gray-600">
                       <span className="text-lg">🎮</span>
                       <span>Gaming</span>
                    </div>
                 </div>
              </div>
            </div>

            <div className="p-3 text-center border-t border-gray-200 bg-gray-50/50 rounded-b-md">
               <p className="text-[10px] text-gray-400 font-medium">Designed in Bath • {new Date().getFullYear()}</p>
            </div>
         </div>
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

      {/* CONTACT WINDOW (Placeholder) */}
      <MacWindow
        id="contact"
        title={windows.contact.title}
        isOpen={windows.contact.isOpen}
        isMinimized={windows.contact.isMinimized}
        isMaximized={windows.contact.isMaximized}
        zIndex={windows.contact.zIndex}
        pos={windows.contact.pos}
        size={windows.contact.size}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
      >
         <div className="p-10 text-center">
            <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
            <p className="text-gray-600">kyle@bath.ac.uk</p>
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
         <Messages />
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
