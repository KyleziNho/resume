import React, { useState, useEffect, useRef } from 'react';
import { useDraggable } from './hooks';
import { MacDriveIcon, MacFolderIcon, MacTerminalIcon, MacDocIcon, MacSafariIcon } from './Icons';

interface DesktopIconProps {
  id: string;
  label: string;
  type: 'drive' | 'folder' | 'terminal' | 'doc' | 'safari';
  initialPos: { x: number; y: number };
  scale?: number;
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
  onDoubleClick,
  onRename,
  onContextMenu
}) => {
  const { pos, handleMouseDown, handleTouchStart, isDragging, dragOffset } = useDraggable(id, initialPos, null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [editedLabel, setEditedLabel] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedLabel(label);
  }, [label]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

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

  const renderIcon = () => {
    switch (type) {
      case 'drive': return <MacDriveIcon />;
      case 'folder': return <MacFolderIcon />;
      case 'terminal': return <MacTerminalIcon />;
      case 'doc': return <MacDocIcon />;
      case 'safari': return <MacSafariIcon />;
      default: return <MacFolderIcon />;
    }
  };

  return (
    <div
      style={{
        transform: `translate3d(${pos.x + (isDragging ? dragOffset.x : 0)}px, ${pos.y + (isDragging ? dragOffset.y : 0)}px, 0) scale(${scale})`,
        transformOrigin: 'top left'
      }}
      className={`absolute w-20 flex flex-col items-center gap-1 cursor-default select-none z-10 ${isDragging ? 'opacity-80' : ''}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onDoubleClick={onDoubleClick}
      onContextMenu={handleContextMenuClick}
    >
      <div className="w-16 h-16 group transition-transform active:brightness-75">
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
