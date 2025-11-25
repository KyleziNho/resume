import React, { useState, useEffect, useRef } from 'react';
import { MacDriveIcon, MacFolderIcon, MacTerminalIcon, MacDocIcon, MacSafariIcon, MacPaintIcon, MacPreviewIcon, MacMessagesIcon, MacNotesIcon, MacAppStoreIcon, AppIcon } from './Icons';
import { haptic } from 'ios-haptics';

interface DesktopIconProps {
  id: string;
  label: string;
  type: 'drive' | 'folder' | 'terminal' | 'doc' | 'safari' | 'paint' | 'preview' | 'messages' | 'notes' | 'appstore' | 'app';
  initialPos: { x: number; y: number };
  scale?: number;
  iconSrc?: string; // For app type icons
  onDoubleClick: () => void;
  onRename: (id: string, newLabel: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string, label: string, startRename: () => void) => void;
}

const DesktopIcon: React.FC<DesktopIconProps> = ({
  id,
  label,
  type,
  initialPos,
  scale = 1,
  iconSrc,
  onDoubleClick,
  onRename,
  onContextMenu
}) => {
  const [pos, setPos] = useState(initialPos);
  const [isDragging, setIsDragging] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [editedLabel, setEditedLabel] = useState(label);
  const [isMobile, setIsMobile] = useState(false);
  const iconRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentPosRef = useRef(initialPos);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const dragStartMouseRef = useRef({ x: 0, y: 0 });

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setEditedLabel(label);
  }, [label]);

  // Sync currentPosRef with state
  useEffect(() => {
    currentPosRef.current = pos;
  }, [pos]);

  // Sync initialPos changes
  useEffect(() => {
    setPos(initialPos);
    currentPosRef.current = initialPos;
  }, [initialPos.x, initialPos.y]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  // Always keep DOM transform in sync
  useEffect(() => {
    if (iconRef.current && !isDragging) {
      iconRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${scale})`;
      currentPosRef.current = pos;
    }
  }, [pos.x, pos.y, scale, isDragging]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!iconRef.current) return;

      const deltaX = e.clientX - dragStartMouseRef.current.x;
      const deltaY = e.clientY - dragStartMouseRef.current.y;

      const newX = dragStartPosRef.current.x + deltaX;
      const newY = dragStartPosRef.current.y + deltaY;

      currentPosRef.current = { x: newX, y: newY };

      // Update DOM directly - no state update
      iconRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0) scale(${scale})`;
    };

    const handleMouseUp = () => {
      // Update state to match current visual position
      setPos({ ...currentPosRef.current });
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, scale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();

    dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
    dragStartPosRef.current = { ...currentPosRef.current };
    setIsDragging(true);
  };

  const handleRename = () => {
    if (editedLabel.trim() && editedLabel !== label) {
      onRename(id, editedLabel);
    }
    setIsRenaming(false);
  };

  const handleContextMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, id, label, () => setIsRenaming(true));
  };

  // Handle single tap on mobile
  const handleTap = () => {
    if (isMobile) {
      haptic();
      onDoubleClick();
    }
  };

  const renderIcon = () => {
    switch (type) {
      case 'drive': return <MacDriveIcon />;
      case 'folder': return <MacFolderIcon />;
      case 'terminal': return <MacTerminalIcon />;
      case 'doc': return <MacDocIcon />;
      case 'safari': return <MacSafariIcon />;
      case 'paint': return <MacPaintIcon />;
      case 'preview': return <MacPreviewIcon />;
      case 'messages': return <MacMessagesIcon />;
      case 'notes': return <MacNotesIcon />;
      case 'appstore': return <MacAppStoreIcon />;
      case 'app': return iconSrc ? <AppIcon iconSrc={iconSrc} /> : <MacFolderIcon />;
      default: return <MacFolderIcon />;
    }
  };

  return (
    <div
      ref={iconRef}
      style={{
        transformOrigin: 'top left',
        willChange: isDragging ? 'transform' : 'auto'
      }}
      className={`absolute w-20 flex flex-col items-center gap-1 cursor-default select-none z-10 ${isDragging ? 'opacity-80 cursor-grabbing' : ''}`}
      onMouseDown={handleMouseDown}
      onDoubleClick={onDoubleClick}
      onClick={handleTap}
      onContextMenu={handleContextMenuClick}
    >
      <div className="w-16 h-16 group active:brightness-75">
        {renderIcon()}
      </div>
      {isRenaming ? (
        <input
          ref={inputRef}
          type="text"
          value={editedLabel}
          onChange={(e) => setEditedLabel(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename();
            if (e.key === 'Escape') {
              setEditedLabel(label);
              setIsRenaming(false);
            }
          }}
          className="text-white text-xs font-medium px-2 py-0.5 rounded bg-white/20 text-center border border-blue-500 outline-none w-full"
          style={{ fontSize: '16px' }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="text-white text-xs font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] px-2 py-0.5 rounded-full bg-black/10 group-hover:bg-[#2b63ff] group-hover:text-white text-center leading-tight">
          {editedLabel}
        </span>
      )}
    </div>
  );
};

export default DesktopIcon;
