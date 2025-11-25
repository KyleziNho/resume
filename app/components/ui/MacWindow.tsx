import React, { useRef, useState, useEffect } from 'react';
import { X, Minus, Maximize2 } from 'lucide-react';
import { useDraggable, useResizable } from './hooks';

interface MacWindowProps {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  pos: { x: number; y: number };
  size: { width: number; height: number };
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  children: React.ReactNode;
  flashCloseButton?: boolean; // Flash the close button to show interactivity
}

const MacWindow: React.FC<MacWindowProps> = ({
  id,
  title,
  isOpen,
  isMinimized,
  isMaximized,
  zIndex,
  pos,
  size,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  children,
  flashCloseButton = false
}) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const { pos: currentPos, setPos, handleMouseDown, handleTouchStart, isDragging, dragOffset } = useDraggable(id, pos, onFocus);
  const { size: currentSize, setSize, startResize, isResizing, resizeDir } = useResizable(size, currentPos, setPos);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [viewportOffsetY, setViewportOffsetY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const [isFlashing, setIsFlashing] = useState(false);
  const [hasBeenClosed, setHasBeenClosed] = useState(false);
  const [wasEverOpen, setWasEverOpen] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Track if window has been closed after being open
  useEffect(() => {
    if (isOpen) {
      setWasEverOpen(true);
    } else if (wasEverOpen) {
      setHasBeenClosed(true);
    }
  }, [isOpen, wasEverOpen]);

  // Flash close button repeatedly every 5 seconds (only if never closed)
  useEffect(() => {
    if (!flashCloseButton || !isOpen || isMinimized || hasBeenClosed) {
      return;
    }

    const doFlash = () => {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 2000);
    };

    // Initial flash after 3.5 seconds
    const initialTimer = setTimeout(doFlash, 3500);

    // Then repeat every 1.5 seconds
    const intervalTimer = setInterval(doFlash, 1500);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [flashCloseButton, isOpen, isMinimized, hasBeenClosed]);

  // Track visual viewport height changes (for mobile keyboard)
  useEffect(() => {
    if (!isMaximized) return;

    const updateViewportHeight = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
        setViewportOffsetY(window.visualViewport.offsetTop);
      } else {
        setViewportHeight(window.innerHeight);
        setViewportOffsetY(0);
      }
    };

    // Initial set
    updateViewportHeight();

    // Listen for viewport changes (keyboard open/close)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
    }

    window.addEventListener('resize', updateViewportHeight);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
        window.visualViewport.removeEventListener('scroll', updateViewportHeight);
      }
      window.removeEventListener('resize', updateViewportHeight);
    };
  }, [isMaximized]);

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
    height: viewportHeight > 0 ? `${viewportHeight - 24}px` : 'calc(100dvh - 24px)',
    maxHeight: 'calc(100vh - 24px)',
    position: 'fixed' as const,
    top: 0,
  } : {
    transform: `translate3d(${currentPos.x + (isDragging ? dragOffset.x : 0)}px, ${currentPos.y + (isDragging ? dragOffset.y : 0)}px, 0)`,
    width: `${currentSize.width}px`,
    height: `${currentSize.height}px`,
    willChange: isDragging ? 'transform' : 'auto',
  };

  return (
    <div
      ref={windowRef}
      style={{ ...windowStyle, zIndex }}
      className={`fixed top-0 left-0 flex flex-col rounded-t-lg rounded-b-md shadow-[0_25px_60px_-12px_rgba(0,0,0,0.6)] ${
        isMinimized ? 'animate-minimize' : isMaximized ? 'transition-all duration-200 ease-out' : ''
      } ${isDragging ? 'cursor-grabbing' : isResizing ? '' : ''}`}
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
        <div className={`absolute left-2 flex ${isMobile ? 'gap-3' : 'gap-2'} z-20`} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
          <button
            onClick={() => onClose(id)}
            className={`${isMobile ? 'w-5 h-5' : 'w-3 h-3'} rounded-full bg-[#ff5f57] border border-[#b93a35] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] hover:brightness-90 active:brightness-75 flex items-center justify-center group ${isMobile ? 'active:scale-90' : ''} ${isFlashing ? 'animate-pulse' : ''}`}
            style={isFlashing ? { animation: 'flash-button 0.5s ease-in-out infinite' } : {}}
          >
             <X size={isMobile ? 12 : 6} className={`text-black/60 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ${isFlashing ? 'opacity-100' : ''}`} strokeWidth={3} />
          </button>
          <button
            onClick={() => onMinimize(id)}
            className={`${isMobile ? 'w-5 h-5' : 'w-3 h-3'} rounded-full bg-[#febc2e] border border-[#c99627] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] hover:brightness-90 active:brightness-75 flex items-center justify-center group ${isMobile ? 'active:scale-90' : ''}`}
          >
             <Minus size={isMobile ? 12 : 6} className={`text-black/60 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} strokeWidth={3} />
          </button>
          <button
            onClick={() => onMaximize(id)}
            className={`${isMobile ? 'w-5 h-5' : 'w-3 h-3'} rounded-full bg-[#28c840] border border-[#1c8a23] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] hover:brightness-90 active:brightness-75 flex items-center justify-center group ${isMobile ? 'active:scale-90' : ''}`}
          >
             <Maximize2 size={isMobile ? 10 : 5} className={`text-black/60 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} strokeWidth={3} />
          </button>
        </div>

        <div className="w-full text-center drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">
          <span className="text-xs font-bold text-[#444] tracking-wide">{title}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-[#ece9d8] rounded-b-md overflow-hidden flex flex-col relative border-l border-r border-b border-[#888]">
        <div className="absolute inset-0 pointer-events-none opacity-5" style={{backgroundImage: 'linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '3px 100%'}}></div>

        <div
          className="relative z-10 flex-1 overflow-y-auto custom-scrollbar"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default MacWindow;
