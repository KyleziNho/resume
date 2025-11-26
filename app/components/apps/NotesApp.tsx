'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown, Undo, Redo } from 'lucide-react';

export default function NotesApp() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedFont, setSelectedFont] = useState('San Francisco');
  const [selectedSize, setSelectedSize] = useState('16px');
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [alignMode, setAlignMode] = useState<'left' | 'center' | 'right'>('left');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fonts = [
    'San Francisco',
    'Helvetica Neue',
    'Arial',
    'Times New Roman',
    'Georgia',
    'Courier New',
  ];

  const sizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px'];

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleFontChange = (font: string) => {
    setSelectedFont(font);
    execCommand('fontName', font);
    setShowFontMenu(false);
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    execCommand('fontSize', '7'); // Use size 7 then manually adjust
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = size;
      range.surroundContents(span);
    }
    setShowSizeMenu(false);
  };

  const toggleAlign = () => {
    let nextMode: 'left' | 'center' | 'right';
    if (alignMode === 'left') {
      nextMode = 'center';
      execCommand('justifyCenter');
    } else if (alignMode === 'center') {
      nextMode = 'right';
      execCommand('justifyRight');
    } else {
      nextMode = 'left';
      execCommand('justifyLeft');
    }
    setAlignMode(nextMode);
  };

  const renderAlignIcon = () => {
    if (alignMode === 'center') {
      return (
        <div className="flex flex-col gap-0.5 items-center">
          <div className="w-3 h-0.5 bg-gray-700"></div>
          <div className="w-4 h-0.5 bg-gray-700"></div>
          <div className="w-3 h-0.5 bg-gray-700"></div>
        </div>
      );
    } else if (alignMode === 'right') {
      return (
        <div className="flex flex-col gap-0.5 items-end">
          <div className="w-4 h-0.5 bg-gray-700"></div>
          <div className="w-3 h-0.5 bg-gray-700"></div>
          <div className="w-4 h-0.5 bg-gray-700"></div>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col gap-0.5">
          <div className="w-4 h-0.5 bg-gray-700"></div>
          <div className="w-3 h-0.5 bg-gray-700"></div>
          <div className="w-4 h-0.5 bg-gray-700"></div>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full font-sans relative" style={{ backgroundColor: '#f5f0d0' }}>
      {/* Subtle pinstripe background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 11px, #d4c89a 11px, #d4c89a 12px)',
        }}
      />
      {/* Notes Toolbar */}
      <div className={`relative z-10 flex items-center gap-1 ${isMobile ? 'px-2 py-1.5' : 'px-4 py-2'} border-b border-[#d4d0c4]`} style={{ backgroundColor: '#f5f3eb' }}>
        {/* Format buttons */}
        <button
          onClick={() => execCommand('bold')}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
          title="Bold"
        >
          <span className="font-bold text-gray-700 text-sm">B</span>
        </button>
        <button
          onClick={() => execCommand('italic')}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
          title="Italic"
        >
          <span className="italic text-gray-700 text-sm">I</span>
        </button>
        <button
          onClick={() => execCommand('underline')}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
          title="Underline"
        >
          <span className="underline text-gray-700 text-sm">U</span>
        </button>

        {/* Font dropdown - shorter on mobile */}
        <div className="relative ml-1 flex-shrink-0">
          <button
            onClick={() => setShowFontMenu(!showFontMenu)}
            className={`${isMobile ? 'px-1.5 py-1' : 'px-3 py-1'} border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center gap-1 whitespace-nowrap`}
          >
            <span className={`truncate ${isMobile ? 'max-w-[50px] text-xs' : 'max-w-[120px]'}`}>{isMobile ? 'Aa' : selectedFont}</span>
            <ChevronDown size={12} className="flex-shrink-0" />
          </button>
          {showFontMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 min-w-[150px]">
              {fonts.map((font) => (
                <button
                  key={font}
                  onClick={() => handleFontChange(font)}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  style={{ fontFamily: font }}
                >
                  {font}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Size dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowSizeMenu(!showSizeMenu)}
            className={`${isMobile ? 'px-1.5 py-1 text-xs' : 'px-3 py-1'} border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center gap-1 whitespace-nowrap`}
          >
            {isMobile ? selectedSize.replace('px', '') : selectedSize}
            <ChevronDown size={12} className="flex-shrink-0" />
          </button>
          {showSizeMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 min-w-[80px]">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeChange(size)}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Alignment toggle button */}
        <button
          onClick={toggleAlign}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
          title={`Align ${alignMode === 'left' ? 'Center' : alignMode === 'center' ? 'Right' : 'Left'}`}
        >
          {renderAlignIcon()}
        </button>

        {/* Undo/Redo buttons */}
        <div className="flex items-center gap-0.5 ml-auto">
          <button
            onClick={() => execCommand('undo')}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
            title="Undo"
          >
            <Undo size={isMobile ? 14 : 16} className="text-gray-700" />
          </button>
          <button
            onClick={() => execCommand('redo')}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
            title="Redo"
          >
            <Redo size={isMobile ? 14 : 16} className="text-gray-700" />
          </button>
        </div>
      </div>

      {/* Notes Content - Editable */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className={`relative z-10 flex-1 overflow-y-auto ${isMobile ? 'px-4 py-4' : 'px-12 py-6'} outline-none`}
        style={{ fontSize: isMobile ? '14px' : '16px', fontFamily: 'San Francisco, -apple-system, BlinkMacSystemFont, sans-serif', backgroundColor: 'transparent' }}
      >
        {/* Image */}
        <img
          src="/me.png"
          alt="Kyle"
          className={`${isMobile ? 'w-24 h-24' : 'w-32 h-32'} rounded-lg object-cover mb-4 float-right ml-4`}
        />
        <p>
          hey, i'm kyle. currently doing a CS masters at bath uni, looking for a grad role in 2026. i love building things - check out my apps in the finder or chat with me via kylebot!
        </p>
      </div>
    </div>
  );
}
