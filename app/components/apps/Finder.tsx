import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, LayoutGrid, List } from 'lucide-react';
import { MacPreviewIcon } from '../ui/Icons';
import ContextMenu, { ContextMenuItem } from '../ui/ContextMenu';

interface FinderProps {
  items: any[];
  onNavigate: (item: any) => void;
  onRename: (itemId: string, newName: string) => void;
}

export default function Finder({ items, onNavigate, onRename }: FinderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId: string; itemTitle: string } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (renamingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renamingId]);

  // Handle clicking outside to deselect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(e.target as Node)) {
        setSelectedId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRename = (itemId: string) => {
    if (editedName.trim() && editedName !== items.find(i => i.id === itemId)?.title) {
      onRename(itemId, editedName.trim());
    }
    setRenamingId(null);
    setEditedName('');
  };

  const handleSingleClick = (item: any) => {
    setSelectedId(item.id);
  };

  const handleDoubleClick = (item: any) => {
    onNavigate(item);
  };

  const handleContextMenu = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(item.id);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      itemId: item.id,
      itemTitle: item.title
    });
  };

  const startRename = (itemId: string, currentTitle: string) => {
    setRenamingId(itemId);
    setEditedName(currentTitle);
    setContextMenu(null);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Finder Toolbar */}
      <div className="h-12 bg-[#f4f4f4] border-b border-[#d1d1d1] flex items-center px-3 gap-4 shadow-sm z-10">
        <div className="flex gap-1">
          <button className="p-1 text-gray-400 hover:text-gray-600"><ChevronLeft size={18} /></button>
          <button className="p-1 text-gray-400 hover:text-gray-600"><ChevronRight size={18} /></button>
        </div>
        <span className="font-semibold text-sm text-gray-700">My Work</span>
        <div className="flex-1"></div>

        {/* View Toggle */}
        <div className="flex bg-gray-200/50 rounded-md p-0.5 border border-gray-300/50">
           <button
             onClick={() => setViewMode('grid')}
             className={`p-1 rounded transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
           >
             <LayoutGrid size={14} className={viewMode === 'grid' ? 'text-gray-600' : 'text-gray-500'}/>
           </button>
           <button
             onClick={() => setViewMode('list')}
             className={`p-1 rounded transition-all ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
           >
             <List size={14} className={viewMode === 'list' ? 'text-gray-600' : 'text-gray-500'}/>
           </button>
        </div>

        <div className="bg-white border border-gray-300 rounded px-2 py-0.5 flex items-center w-32 shadow-inner">
          <Search size={12} className="text-gray-400 mr-1" />
          <input type="text" placeholder="Search" className="w-full text-xs bg-transparent outline-none placeholder:text-gray-400" style={{ fontSize: '16px' }} />
        </div>
      </div>

      {/* Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-36 bg-[#f6f6f6]/90 backdrop-blur-xl border-r border-[#d1d1d1] p-3 space-y-4 pt-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase pl-2 mb-1">Favorites</p>
            <div className="flex items-center gap-2 px-2 py-1 bg-[#dcdfe5] rounded text-xs text-black font-medium">
               <span className="text-blue-500">📂</span> My Work
            </div>
            <div className="flex items-center gap-2 px-2 py-1 hover:bg-gray-200 rounded text-xs text-gray-700 cursor-pointer">
               <span className="text-blue-500">🖥️</span> Desktop
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div
          ref={gridRef}
          className="flex-1 bg-white overflow-y-auto"
          onClick={(e) => {
            setSelectedId(null);
            setContextMenu(null);
          }}
        >
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="p-6 animate-fadeIn">
              <div className="grid gap-6 content-start" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
                {items.map((item: any) => {
                  const isSelected = selectedId === item.id;
                  const isRenaming = renamingId === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSingleClick(item);
                      }}
                      onDoubleClick={() => handleDoubleClick(item)}
                      onContextMenu={(e) => handleContextMenu(e, item)}
                      className={`
                        flex flex-col items-center gap-1 p-1.5 rounded cursor-default select-none
                        transition-all duration-75
                        ${isSelected
                          ? 'bg-[#0063e1]/90'
                          : 'hover:bg-black/5 active:bg-black/10'
                        }
                      `}
                    >
                      <div className="w-16 h-16">
                        <MacPreviewIcon />
                      </div>

                      {isRenaming ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          onBlur={() => handleRename(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(item.id);
                            if (e.key === 'Escape') {
                              setRenamingId(null);
                              setEditedName('');
                            }
                          }}
                          className="text-xs text-center font-medium px-1.5 py-0.5 rounded outline-none w-full max-w-[100px] bg-white text-black border border-blue-500"
                          style={{ fontSize: '16px' }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className={`
                          text-[11px] text-center font-medium px-1.5 py-0.5 rounded leading-tight max-w-[100px]
                          break-words transition-colors
                          ${isSelected ? 'text-white bg-[#0063e1]/90' : 'text-gray-800'}
                        `}>
                          {item.title}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="animate-fadeIn">
              {/* List Header */}
              <div className="sticky top-0 bg-gradient-to-b from-[#f0f0f0] to-[#e8e8e8] border-b border-[#d1d1d1] px-4 py-1 flex items-center text-[11px] font-semibold text-gray-700 z-10 min-w-[200px]">
                <div className="flex-1" style={{ minWidth: '150px' }}>Name</div>
                <div className="w-28 text-right flex-shrink-0 hidden [@media(min-width:450px)]:block">Date</div>
                <div className="w-20 text-right flex-shrink-0 hidden [@media(min-width:550px)]:block">Size</div>
                <div className="w-24 text-right flex-shrink-0 hidden [@media(min-width:650px)]:block">Kind</div>
              </div>

              {/* List Items */}
              <div className="divide-y divide-gray-100">
                {items.map((item: any) => {
                  const isSelected = selectedId === item.id;
                  const isRenaming = renamingId === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSingleClick(item);
                      }}
                      onDoubleClick={() => handleDoubleClick(item)}
                      onContextMenu={(e) => handleContextMenu(e, item)}
                      className={`
                        flex items-center px-4 py-1.5 cursor-default select-none transition-colors min-w-[200px]
                        ${isSelected
                          ? 'bg-[#0063e1]/90 text-white'
                          : 'hover:bg-gray-100'
                        }
                      `}
                    >
                      {/* Icon + Name */}
                      <div className="flex items-center gap-2 overflow-hidden" style={{ flex: '1 1 0', minWidth: '150px' }}>
                        <div className="w-4 h-4 flex-shrink-0">
                          <MacPreviewIcon />
                        </div>
                        {isRenaming ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onBlur={() => handleRename(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(item.id);
                              if (e.key === 'Escape') {
                                setRenamingId(null);
                                setEditedName('');
                              }
                            }}
                            className="text-xs font-medium px-1 py-0.5 rounded outline-none bg-white text-black border border-blue-500 flex-1 min-w-[60px]"
                            style={{ fontSize: '16px' }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="text-xs font-medium truncate flex-1" title={item.title}>{item.title}</span>
                        )}
                      </div>

                      {/* Date Modified */}
                      <div className="w-28 text-right text-[11px] flex-shrink-0 truncate hidden [@media(min-width:450px)]:block">
                        {item.date || 'Oct 24, 2024'}
                      </div>

                      {/* Size */}
                      <div className="w-20 text-right text-[11px] flex-shrink-0 hidden [@media(min-width:550px)]:block">
                        {item.size || '45 MB'}
                      </div>

                      {/* Kind */}
                      <div className="w-24 text-right text-[11px] flex-shrink-0 truncate hidden [@media(min-width:650px)]:block">
                        {item.category || 'Document'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={[
            {
              label: 'Open',
              action: () => {
                const item = items.find(i => i.id === contextMenu.itemId);
                if (item) onNavigate(item);
              }
            },
            {
              label: 'Get Info',
              action: () => {
                const item = items.find(i => i.id === contextMenu.itemId);
                if (item) onNavigate(item);
              },
              shortcut: '⌘I'
            },
            { separator: true } as ContextMenuItem,
            {
              label: 'Rename',
              action: () => startRename(contextMenu.itemId, contextMenu.itemTitle)
            }
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
