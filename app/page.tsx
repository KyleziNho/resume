'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X, Minus, Maximize2, Wifi, Battery, Search, Command,
  ChevronRight, ChevronLeft, Folder as FolderIcon, FileText,
  Briefcase, Globe, Smartphone, Zap, Layout, ShoppingBag,
  GraduationCap, Award, User, Github, Linkedin, MapPin, Calendar, Cpu, Code, Coffee, Heart
} from 'lucide-react';
import FaultyTerminal from './components/FaultyTerminal';
import MacOSDock from './components/MacOSDock';

// --- 1. UTILITIES & HOOKS ---

// Hook for draggable behavior
const useDraggable = (
  id: string,
  initialPos: { x: number; y: number },
  onFocus: ((id: string) => void) | null,
  isLocked = false
) => {
  const [pos, setPos] = useState(initialPos);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStartOffset = useRef({ x: 0, y: 0 });

  useEffect(() => { setPos(initialPos); }, [initialPos.x, initialPos.y]);

  const startDrag = (clientX: number, clientY: number) => {
    if (isLocked) return;
    if (onFocus) onFocus(id);
    setIsDragging(true);
    dragStartOffset.current = { x: clientX - pos.x, y: clientY - pos.y };
    setDragOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    startDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    if (!isDragging) return;

    const move = (cx: number, cy: number) => {
      const newX = cx - dragStartOffset.current.x;
      const newY = cy - dragStartOffset.current.y;
      setDragOffset({ x: newX - pos.x, y: newY - pos.y });
    };

    const up = (cx: number, cy: number) => {
      const newX = cx - dragStartOffset.current.x;
      const newY = cy - dragStartOffset.current.y;
      setPos({ x: newX, y: newY });
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);
    };

    const onMouseMove = (e: MouseEvent) => move(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => move(e.touches[0].clientX, e.touches[0].clientY);
    const onMouseUp = (e: MouseEvent) => up(e.clientX, e.clientY);
    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches[0]) {
        up(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      } else {
        setIsDragging(false);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, pos.x, pos.y]);

  return { pos, setPos, handleMouseDown, handleTouchStart, isDragging, dragOffset };
};

// Hook for window resizing with position adjustment
const useResizable = (
  initialSize: { width: number; height: number },
  initialPos: { x: number; y: number },
  onPosChange: (pos: { x: number; y: number }) => void,
  minWidth = 300,
  minHeight = 200
) => {
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState('');
  const startState = useRef({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });

  const startResize = (dir: string, clientX: number, clientY: number, currentPos: { x: number; y: number }) => {
    setIsResizing(true);
    setResizeDir(dir);
    startState.current = {
      x: clientX,
      y: clientY,
      width: size.width,
      height: size.height,
      posX: currentPos.x,
      posY: currentPos.y
    };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startState.current.x;
      const deltaY = e.clientY - startState.current.y;

      let newWidth = startState.current.width;
      let newHeight = startState.current.height;
      let newPosX = startState.current.posX;
      let newPosY = startState.current.posY;

      // East - expand right
      if (resizeDir.includes('e')) {
        newWidth = Math.max(minWidth, startState.current.width + deltaX);
      }

      // West - expand left (need to move window left and increase width)
      if (resizeDir.includes('w')) {
        const attemptedWidth = startState.current.width - deltaX;
        if (attemptedWidth >= minWidth) {
          newWidth = attemptedWidth;
          newPosX = startState.current.posX + deltaX;
        } else {
          newWidth = minWidth;
          newPosX = startState.current.posX + (startState.current.width - minWidth);
        }
      }

      // South - expand down
      if (resizeDir.includes('s')) {
        newHeight = Math.max(minHeight, startState.current.height + deltaY);
      }

      // North - expand up (need to move window up and increase height)
      if (resizeDir.includes('n')) {
        const attemptedHeight = startState.current.height - deltaY;
        if (attemptedHeight >= minHeight) {
          newHeight = attemptedHeight;
          newPosY = startState.current.posY + deltaY;
        } else {
          newHeight = minHeight;
          newPosY = startState.current.posY + (startState.current.height - minHeight);
        }
      }

      setSize({ width: newWidth, height: newHeight });

      // Update position if resizing from north or west
      if (resizeDir.includes('n') || resizeDir.includes('w')) {
        onPosChange({ x: newPosX, y: newPosY });
      }
    };

    const handleUp = () => {
      setIsResizing(false);
      setResizeDir('');
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isResizing, resizeDir, minWidth, minHeight, onPosChange]);

  return { size, setSize, startResize, isResizing, resizeDir };
};

// --- 2. SKEUOMORPHIC ICONS ---

const MacFolderIcon = () => (
  <div className="w-full h-full relative drop-shadow-lg group-hover:scale-105 transition-transform">
    <div className="absolute bottom-0 w-full h-[85%] bg-[#5aa5e6] rounded-t-sm rounded-b-md shadow-inner"></div>
    <div className="absolute top-[5%] left-0 w-[40%] h-[15%] bg-[#4892d6] rounded-t-md"></div>
    <div className="absolute bottom-0 w-full h-[75%] bg-gradient-to-b from-[#8bc8f7] to-[#4f9de8] rounded-b-md shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] flex items-center justify-center">
       <div className="absolute top-0 w-full h-[2px] bg-white opacity-30"></div>
    </div>
  </div>
);

const MacDriveIcon = () => (
  <div className="w-full h-full relative drop-shadow-lg group-hover:scale-105 transition-transform">
    <div className="w-full h-[80%] mt-[10%] bg-gradient-to-b from-[#e6e6e6] to-[#b3b3b3] rounded shadow-[0_2px_5px_rgba(0,0,0,0.4)] flex items-center justify-center border border-[#999]">
      <div className="w-[80%] h-[40%] bg-[#d0d0d0] shadow-inner border border-[#aaa] flex items-center justify-center">
         <div className="w-full h-[2px] bg-green-400/50 shadow-[0_0_5px_rgba(74,222,128,0.8)]"></div>
      </div>
      <div className="absolute bottom-2 text-[#888]">
        <svg width="12" height="12" viewBox="0 0 170 170" fill="currentColor"><path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.197-2.12-9.973-3.17-14.34-3.17-4.58 0-9.492 1.05-14.746 3.17-5.262 2.13-9.501 3.24-12.742 3.35-4.929.21-9.842-1.96-14.746-6.52-3.13-2.73-7.045-7.41-11.735-14.04-5.032-7.08-9.169-15.29-12.41-24.65-3.471-10.11-5.211-19.9-5.211-29.378 0-10.857 2.346-20.221 7.045-28.068 3.693-6.303 8.606-11.275 14.755-14.925s12.793-5.51 19.948-5.629c3.915 0 9.049 1.211 15.429 3.591 6.362 2.388 10.447 3.599 12.238 3.599 1.339 0 5.877-1.416 13.57-4.239 7.275-2.618 13.415-3.702 18.445-3.275 13.63 1.1 23.87 6.473 30.68 16.153-12.19 7.386-18.22 17.731-18.1 31.002.11 10.337 3.86 18.939 11.23 25.769 3.34 3.17 7.07 5.62 11.22 7.36-.9 2.61-1.85 5.11-2.86 7.51z"/></svg>
      </div>
    </div>
  </div>
);

const MacTerminalIcon = () => (
  <div className="w-full h-full bg-[#222] rounded shadow-lg border border-[#444] flex flex-col overflow-hidden group-hover:scale-105 transition-transform">
     <div className="h-[20%] bg-gradient-to-b from-[#555] to-[#333] border-b border-black flex items-center px-1 gap-[2px]">
        <div className="w-1 h-1 rounded-full bg-red-500"></div>
        <div className="w-1 h-1 rounded-full bg-yellow-500"></div>
        <div className="w-1 h-1 rounded-full bg-green-500"></div>
     </div>
     <div className="flex-1 p-1">
        <div className="text-[6px] text-green-500 font-mono font-bold">_</div>
     </div>
  </div>
);

const MacDocIcon = () => (
  <div className="w-[85%] h-full mx-auto bg-white relative shadow-lg flex flex-col group-hover:scale-105 transition-transform">
     <div className="absolute top-0 right-0 w-4 h-4 bg-[#ddd] shadow-sm" style={{ clipPath: 'polygon(0 0, 0% 100%, 100% 100%)'}}></div>
     <div className="mt-4 px-1 space-y-1">
       <div className="w-[90%] h-[2px] bg-gray-300"></div>
       <div className="w-[80%] h-[2px] bg-gray-300"></div>
       <div className="w-[85%] h-[2px] bg-gray-300"></div>
       <div className="w-[60%] h-[2px] bg-gray-300"></div>
     </div>
     <div className="mt-auto mb-2 flex justify-center text-gray-400">
       <FileText size={12} />
     </div>
  </div>
);

// --- 3. COMPONENTS ---

const DesktopIcon = ({ id, label, type, initialPos, onDoubleClick }: any) => {
  const { pos, handleMouseDown, handleTouchStart, isDragging, dragOffset } = useDraggable(id, initialPos, null);

  const renderIcon = () => {
    switch (type) {
      case 'drive': return <MacDriveIcon />;
      case 'folder': return <MacFolderIcon />;
      case 'terminal': return <MacTerminalIcon />;
      case 'doc': return <MacDocIcon />;
      default: return <MacFolderIcon />;
    }
  };

  return (
    <div
      style={{ transform: `translate3d(${pos.x + (isDragging ? dragOffset.x : 0)}px, ${pos.y + (isDragging ? dragOffset.y : 0)}px, 0)` }}
      className={`absolute w-20 flex flex-col items-center gap-1 cursor-default select-none z-10 ${isDragging ? 'opacity-80' : ''}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onDoubleClick={onDoubleClick}
    >
      <div className="w-16 h-16 group transition-transform active:brightness-75">
        {renderIcon()}
      </div>
      <span className="text-white text-xs font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] px-2 py-0.5 rounded-full bg-black/10 group-hover:bg-[#2b63ff] group-hover:text-white text-center leading-tight">
        {label}
      </span>
    </div>
  );
};

// Advanced Mac Window with Resize
const MacWindow = ({
  id, title, isOpen, isMinimized, isMaximized, zIndex, pos, size,
  onClose, onMinimize, onMaximize, onFocus, children
}: any) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const { pos: currentPos, setPos, handleMouseDown, handleTouchStart, isDragging, dragOffset } = useDraggable(id, pos, onFocus);
  const { size: currentSize, setSize, startResize, isResizing, resizeDir } = useResizable(size, currentPos, setPos);

  if (!isOpen || isMinimized) return null;

  const ResizeHandle = ({ direction, cursor, className }: any) => (
    <div
      className={`absolute ${className} z-30`}
      style={{ cursor }}
      onMouseDown={(e) => {
        e.stopPropagation();
        startResize(direction, e.clientX, e.clientY, currentPos);
      }}
    />
  );

  const windowStyle = isMaximized ? {
    transform: 'translate3d(0px, 24px, 0)',
    width: '100vw',
    height: 'calc(100vh - 24px)',
  } : {
    transform: `translate3d(${currentPos.x + (isDragging ? dragOffset.x : 0)}px, ${currentPos.y + (isDragging ? dragOffset.y : 0)}px, 0)`,
    width: `${currentSize.width}px`,
    height: `${currentSize.height}px`,
  };

  return (
    <div
      ref={windowRef}
      style={{ ...windowStyle, zIndex }}
      className={`fixed top-0 left-0 flex flex-col rounded-t-lg rounded-b-md shadow-[0_25px_60px_-12px_rgba(0,0,0,0.6)] transition-all ${
        isMinimized ? 'animate-minimize' : isMaximized ? 'duration-300' : ''
      } ${isDragging ? 'cursor-grabbing' : ''}`}
      onMouseDown={() => onFocus(id)}
      onTouchStart={() => onFocus(id)}
    >
      {/* Resize Handles - 4 Corners */}
      {!isMaximized && (
        <>
          <ResizeHandle direction="nw" cursor="nw-resize" className="top-0 left-0 w-3 h-3" />
          <ResizeHandle direction="ne" cursor="ne-resize" className="top-0 right-0 w-3 h-3" />
          <ResizeHandle direction="sw" cursor="sw-resize" className="bottom-0 left-0 w-3 h-3" />
          <ResizeHandle direction="se" cursor="se-resize" className="bottom-0 right-0 w-3 h-3" />

          {/* 4 Edges */}
          <ResizeHandle direction="n" cursor="n-resize" className="top-0 left-3 right-3 h-1" />
          <ResizeHandle direction="s" cursor="s-resize" className="bottom-0 left-3 right-3 h-1" />
          <ResizeHandle direction="w" cursor="w-resize" className="left-0 top-3 bottom-3 w-1" />
          <ResizeHandle direction="e" cursor="e-resize" className="right-0 top-3 bottom-3 w-1" />
        </>
      )}

      {/* Title Bar */}
      <div
        onMouseDown={isMaximized ? undefined : handleMouseDown}
        onTouchStart={isMaximized ? undefined : handleTouchStart}
        className="h-8 rounded-t-lg border-b border-[#666] flex items-center relative select-none cursor-move"
        style={{
          background: 'linear-gradient(to bottom, #e6e6e6 0%, #dcdcdc 50%, #c8c8c8 50%, #b4b4b4 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)'
        }}
      >
        <div className="absolute left-2 flex gap-2 z-20" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
          <button onClick={() => onClose(id)} className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#b93a35] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] hover:brightness-90 active:brightness-75 flex items-center justify-center group">
             <X size={6} className="text-black/50 opacity-0 group-hover:opacity-100" strokeWidth={3} />
          </button>
          <button onClick={() => onMinimize(id)} className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#c99627] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] hover:brightness-90 active:brightness-75 flex items-center justify-center group">
             <Minus size={6} className="text-black/50 opacity-0 group-hover:opacity-100" strokeWidth={3} />
          </button>
          <button onClick={() => onMaximize(id)} className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1c8a23] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] hover:brightness-90 active:brightness-75 flex items-center justify-center group">
             <Maximize2 size={5} className="text-black/50 opacity-0 group-hover:opacity-100" strokeWidth={3} />
          </button>
        </div>

        <div className="w-full text-center drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">
          <span className="text-xs font-bold text-[#444] tracking-wide">{title}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-[#ece9d8] rounded-b-md overflow-hidden flex flex-col relative border-l border-r border-b border-[#888]">
        <div className="absolute inset-0 pointer-events-none opacity-5" style={{backgroundImage: 'linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '3px 100%'}}></div>

        <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

// Dock Component - macOS style
const Dock = ({ minimizedWindows, onRestore }: any) => {
  // Permanent dock apps (GitHub and LinkedIn)
  const permanentApps = [
    {
      id: 'github',
      name: 'GitHub',
      icon: (
        <div className="w-full h-full bg-[#24292e] rounded-lg flex items-center justify-center shadow-lg">
          <Github size={32} className="text-white" />
        </div>
      ),
      isPermanent: true,
      url: 'https://github.com/KyleziNho'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: (
        <div className="w-full h-full bg-[#0077b5] rounded-lg flex items-center justify-center shadow-lg">
          <Linkedin size={32} className="text-white" />
        </div>
      ),
      isPermanent: true,
      url: 'https://www.linkedin.com/in/kos33/'
    }
  ];

  // Transform minimized windows into dock apps format
  const minimizedApps = minimizedWindows.map((win: any) => ({
    id: win.id,
    name: win.title,
    icon: win.icon,
    isPermanent: false
  }));

  // Combine permanent apps with minimized windows
  const dockApps = [...minimizedApps, ...permanentApps];

  const handleAppClick = (id: string) => {
    const app = dockApps.find(a => a.id === id);
    if (app && app.isPermanent && app.url) {
      window.open(app.url, '_blank', 'noopener,noreferrer');
    } else {
      onRestore(id);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
      <MacOSDock
        apps={dockApps}
        onAppClick={handleAppClick}
        openApps={minimizedWindows.map((w: any) => w.id)}
      />
    </div>
  );
};

// --- 4. APP CONTENT ---

const ProjectItem = ({ title, role, desc, icon: Icon, color, tags }: any) => (
    <div className="flex items-start gap-4 p-4 border-b border-[#ccc] bg-white hover:bg-blue-50 transition-colors">
        <div className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-gray-200 ${color} bg-gradient-to-br from-white to-gray-100`}>
            <Icon size={28} />
        </div>
        <div>
            <div className="flex justify-between w-full">
                <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
                <span className="text-[10px] text-blue-600 font-bold uppercase bg-blue-100 px-1 rounded">{role}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{desc}</p>
            <div className="flex gap-1 mt-2 flex-wrap">
                {tags.map((t: string) => <span key={t} className="text-[9px] bg-[#eee] border border-[#ccc] px-1.5 py-0.5 rounded text-gray-600">{t}</span>)}
            </div>
        </div>
    </div>
);

// Finder Window Content
const FinderContent = ({ folderName, items }: { folderName: string; items: any[] }) => (
  <div className="flex flex-col h-full bg-white">
    {/* Finder Toolbar */}
    <div className="h-10 bg-[#e8e8e8] border-b border-[#ccc] flex items-center px-2 gap-2 shadow-sm">
      <div className="flex gap-1">
        <button className="p-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 active:bg-gray-200">
          <ChevronLeft size={14} className="text-gray-500" />
        </button>
        <button className="p-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 active:bg-gray-200">
          <ChevronRight size={14} className="text-gray-500" />
        </button>
      </div>
      <div className="flex-1"></div>
      <div className="bg-white border border-gray-300 rounded-full px-2 py-0.5 flex items-center w-40 shadow-inner">
        <Search size={12} className="text-gray-400 mr-1" />
        <span className="text-xs text-gray-400">Search</span>
      </div>
    </div>

    {/* Sidebar / Content Layout */}
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <div className="w-32 bg-[#f1f5fa] border-r border-[#ccc] p-2 space-y-4 pt-4">
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase mb-1 pl-2">Favorites</p>
          <div className="flex items-center gap-2 px-2 py-1 bg-[#dcdfe5] rounded text-xs text-gray-700">
            <FolderIcon size={12} className="text-blue-400" /> {folderName}
          </div>
          <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 rounded cursor-pointer">
            <FolderIcon size={12} className="text-blue-400" /> Desktop
          </div>
          <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 rounded cursor-pointer">
            <FolderIcon size={12} className="text-blue-400" /> Documents
          </div>
        </div>
      </div>

      {/* Main View - Icon Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-3 gap-4">
          {items.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-16 h-16 flex items-center justify-center">
                {item.type === 'folder' ? (
                  <MacFolderIcon />
                ) : (
                  <MacDocIcon />
                )}
              </div>
              <span className="text-xs text-center text-gray-800 group-hover:bg-blue-500 group-hover:text-white px-1 rounded max-w-full truncate">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// --- 5. MAIN APP ---

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

type WindowId = 'welcome' | 'projects' | 'resume' | 'terminal' | 'contact';

export default function MacOsPortfolio() {
  const [booted, setBooted] = useState(false);
  const [time, setTime] = useState('');
  const [zIndex, setZIndex] = useState(10);

  // Finder items data
  const workItems = [
    { name: 'Frift.app', type: 'folder' },
    { name: 'Arcadeus.app', type: 'folder' },
    { name: 'Marvellous Maps.app', type: 'folder' },
    { name: 'README.txt', type: 'file' },
    { name: 'Projects', type: 'folder' },
    { name: 'Code Samples', type: 'folder' }
  ];

  const contactItems = [
    { name: 'Email.txt', type: 'file' },
    { name: 'LinkedIn.url', type: 'file' },
    { name: 'GitHub.url', type: 'file' },
    { name: 'Resume.pdf', type: 'file' }
  ];

  const [windows, setWindows] = useState({
    welcome: {
      isOpen: true, isMinimized: false, isMaximized: false, zIndex: 10,
      title: 'About Kyle',
      iconType: 'drive',
      pos: { x: 300, y: 100 }, size: { width: 380, height: 400 }
    },
    projects: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'My Work',
      iconType: 'folder',
      pos: { x: 350, y: 150 }, size: { width: 700, height: 500 }
    },
    resume: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'Bio.pdf',
      iconType: 'doc',
      pos: { x: 400, y: 100 }, size: { width: 600, height: 600 }
    },
    terminal: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'Terminal',
      iconType: 'terminal',
      pos: { x: 100, y: 400 }, size: { width: 500, height: 350 }
    },
    contact: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'Contact',
      iconType: 'folder',
      pos: { x: 200, y: 300 }, size: { width: 400, height: 450 }
    }
  });

  const [iconPos] = useState({
    hd: { x: 20, y: 40 },
    projects: { x: 20, y: 150 },
    resume: { x: 20, y: 260 },
    terminal: { x: 20, y: 370 },
    contact: { x: 20, y: 480 }
  });

  useEffect(() => {
    const timer = setInterval(() => {
        const now = new Date();
        setTime(now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    }, 1000);
    setTimeout(() => setBooted(true), 3000);
    return () => clearInterval(timer);
  }, []);

  const focusWindow = (id: WindowId) => {
    setZIndex(z => z + 1);
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], zIndex: zIndex + 1 } }));
  };

  const openWindow = (id: WindowId) => {
    focusWindow(id);
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], isOpen: true, isMinimized: false } }));
  };

  const closeWindow = (id: WindowId) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], isOpen: false } }));
  };

  const minimizeWindow = (id: WindowId) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], isMinimized: true } }));
  };

  const restoreWindow = (id: WindowId) => {
    focusWindow(id);
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], isMinimized: false } }));
  };

  const maximizeWindow = (id: WindowId) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], isMaximized: !prev[id].isMaximized } }));
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'drive': return <MacDriveIcon />;
      case 'folder': return <MacFolderIcon />;
      case 'terminal': return <MacTerminalIcon />;
      case 'doc': return <MacDocIcon />;
      default: return <MacFolderIcon />;
    }
  };

  const minimizedWindows = Object.entries(windows)
    .filter(([_, win]) => win.isOpen && win.isMinimized)
    .map(([id, win]) => ({ id, title: win.title, icon: renderIcon(win.iconType) }));

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
      {/* FaultyTerminal Background */}
      <TerminalBackground />

      {/* Menu Bar */}
      <div className="absolute top-0 w-full h-6 bg-gradient-to-b from-[#e6e6e6] to-[#a8a8a8] border-b border-[#444] shadow-md flex items-center justify-between px-4 z-50 text-xs font-bold text-[#222] drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]">
         <div className="flex gap-4">
            <span className="text-sm hover:text-blue-700"></span>
            <span className="hover:text-white hover:bg-blue-600 px-2 rounded-[3px] cursor-pointer">Finder</span>
            <span className="hover:text-white hover:bg-blue-600 px-2 rounded-[3px] cursor-pointer">File</span>
            <span className="hover:text-white hover:bg-blue-600 px-2 rounded-[3px] cursor-pointer">Edit</span>
            <span className="hover:text-white hover:bg-blue-600 px-2 rounded-[3px] cursor-pointer">View</span>
            <span className="hover:text-white hover:bg-blue-600 px-2 rounded-[3px] cursor-pointer">Go</span>
         </div>
         <div className="flex gap-3 items-center">
            <a href="https://github.com/KyleziNho" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
              <Github size={14} />
            </a>
            <a href="https://www.linkedin.com/in/kos33/" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
              <Linkedin size={14} />
            </a>
            <Wifi size={14} />
            <span className="">{time}</span>
            <span className="flex items-center gap-1"><Search size={12} strokeWidth={3} /> Kyle O.</span>
         </div>
      </div>

      {/* Desktop Icons */}
      <div className="absolute top-8 left-0 z-0 w-full h-full pointer-events-auto">
         <DesktopIcon id="hd" label="About Kyle" type="drive" initialPos={iconPos.hd} onDoubleClick={() => openWindow('welcome')} />
         <DesktopIcon id="projects" label="My Work" type="folder" initialPos={iconPos.projects} onDoubleClick={() => openWindow('projects')} />
         <DesktopIcon id="resume" label="Bio.pdf" type="doc" initialPos={iconPos.resume} onDoubleClick={() => openWindow('resume')} />
         <DesktopIcon id="terminal" label="Terminal" type="terminal" initialPos={iconPos.terminal} onDoubleClick={() => openWindow('terminal')} />
         <DesktopIcon id="contact" label="Contact" type="folder" initialPos={iconPos.contact} onDoubleClick={() => openWindow('contact')} />
      </div>

      {/* Dock */}
      <Dock minimizedWindows={minimizedWindows} onRestore={restoreWindow} />

      {/* --- WINDOWS --- */}

      {/* 1. WELCOME */}
      {/* 1. WELCOME - Revamped as "System Settings / Apple ID" style */}
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
         {/* Apple System Settings Theme Background */}
         <div className="flex flex-col h-full bg-[#F5F5F7] text-[#1d1d1f] font-sans">
            
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              
              {/* Profile Header (Apple ID Style) */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-b from-gray-200 to-gray-300 shadow-md border-4 border-white overflow-hidden mb-3">
                    {/* TIP: Use a Memoji here for the true macOS feel */}
                    <img 
                      src="/me.png" 
                      alt="Kyle" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                         // Fallback if image fails
                         e.currentTarget.style.display='none';
                         e.currentTarget.parentElement.innerHTML = '<svg class="w-12 h-12 text-gray-400 m-auto mt-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                      }}
                    />
                  </div>
                  <div className="absolute bottom-3 right-0 w-6 h-6 bg-green-500 border-2 border-white rounded-full" title="Online / Open to work"></div>
                </div>
                
                <h1 className="text-xl font-bold tracking-tight text-black">Kyle O'Sullivan</h1>
                <p className="text-sm text-gray-500 font-medium">Apple ID: kyle@bath.ac.uk</p>
              </div>

              {/* Card 1: The Narrative (About) */}
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

              {/* Card 2: Technical Specs (Skills) */}
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

              {/* Card 3: Personal (Interests) */}
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

            {/* Footer */}
            <div className="p-3 text-center border-t border-gray-200 bg-gray-50/50 rounded-b-md">
               <p className="text-[10px] text-gray-400 font-medium">Designed in Bath • {new Date().getFullYear()}</p>
            </div>
         </div>
      </MacWindow>

      {/* 2. MY WORK (FINDER) */}
      <MacWindow
        id="projects"
        title={windows.projects.title}
        isOpen={windows.projects.isOpen}
        isMinimized={windows.projects.isMinimized}
        isMaximized={windows.projects.isMaximized}
        zIndex={windows.projects.zIndex}
        pos={windows.projects.pos}
        size={windows.projects.size}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
      >
         <FinderContent folderName="My Work" items={workItems} />
      </MacWindow>

      {/* 3. RESUME */}
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

      {/* 4. TERMINAL */}
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

      {/* 5. CONTACT (FINDER) */}
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
         <FinderContent folderName="Contact" items={contactItems} />
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
