import React, { useRef, useEffect, useMemo } from 'react';

export interface ContextMenuItem {
  label: string;
  action: () => void;
  shortcut?: string;
  separator?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position if menu would go off-screen
  const adjustedStyle = useMemo(() => {
    if (typeof window === 'undefined') return { left: x, top: y };

    const menuWidth = 200;
    const menuHeight = items.length * 28 + 8;

    let left = x;
    let top = y;

    if (x + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 10;
    }

    if (y + menuHeight > window.innerHeight) {
      top = window.innerHeight - menuHeight - 10;
    }

    return { left, top };
  }, [x, y, items.length]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[200px] py-1 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.2)] border border-[#555] animate-scale-in"
      style={{
        left: `${adjustedStyle.left}px`,
        top: `${adjustedStyle.top}px`,
        background: 'rgba(40, 40, 40, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, idx) => (
        item.separator ? (
          <div key={idx} className="h-[1px] bg-[#555] my-1 mx-2"></div>
        ) : (
          <div
            key={idx}
            className={`px-3 py-1.5 flex items-center justify-between text-[13px] cursor-pointer ${
              item.disabled
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-white hover:bg-blue-600'
            }`}
            onClick={() => {
              if (!item.disabled) {
                item.action();
                onClose();
              }
            }}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-gray-400 ml-4">{item.shortcut}</span>
            )}
          </div>
        )
      ))}
    </div>
  );
};

export default ContextMenu;
