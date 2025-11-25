'use client';

import React, { useRef, useState } from 'react';
import { Mic, ChevronDown, Undo, Redo } from 'lucide-react';

export default function NotesApp() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedFont, setSelectedFont] = useState('San Francisco');
  const [selectedSize, setSelectedSize] = useState('16px');
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [alignMode, setAlignMode] = useState<'left' | 'center' | 'right'>('left');

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
    <div className="flex flex-col h-full bg-white font-sans">
      {/* Notes Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 bg-white">
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

        {/* Font dropdown */}
        <div className="relative ml-2 flex-shrink-0">
          <button
            onClick={() => setShowFontMenu(!showFontMenu)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <span className="truncate max-w-[120px]">{selectedFont}</span>
            <ChevronDown size={14} className="flex-shrink-0" />
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
        <div className="relative ml-1 flex-shrink-0">
          <button
            onClick={() => setShowSizeMenu(!showSizeMenu)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            {selectedSize}
            <ChevronDown size={14} className="flex-shrink-0" />
          </button>
          {showSizeMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 min-w-[100px]">
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
          className="p-1.5 hover:bg-gray-100 rounded transition-colors ml-2 flex-shrink-0"
          title={`Align ${alignMode === 'left' ? 'Center' : alignMode === 'center' ? 'Right' : 'Left'}`}
        >
          {renderAlignIcon()}
        </button>

        {/* Undo/Redo buttons */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => execCommand('undo')}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
            title="Undo"
          >
            <Undo size={16} className="text-gray-700" />
          </button>
          <button
            onClick={() => execCommand('redo')}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
            title="Redo"
          >
            <Redo size={16} className="text-gray-700" />
          </button>
        </div>

        {/* Microphone button */}
        <button className="ml-2 p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0" title="Dictation">
          <Mic size={16} className="text-gray-700" />
        </button>
      </div>

      {/* Notes Content - Editable */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="flex-1 overflow-y-auto px-12 py-6 bg-white outline-none"
        style={{ fontSize: '16px', fontFamily: 'San Francisco, -apple-system, BlinkMacSystemFont, sans-serif' }}
      >
        <p className="mb-4">
          Hey! I'm Kyle, a CS master's student at the University of Bath finishing in September 2026.
        </p>
        <p className="mb-4">
          I love building things, especially apps with clean UI/UX. I'm obsessed with iOS design and spend way too much time on Twitter looking at interface patterns.
        </p>
        <p className="mb-4">
          Right now I'm working on Frift (a student marketplace app on the App Store), and I've built other projects like Arcadeus (real estate AI) and Kyro (online card game).
        </p>
        <p>
          I'm actively looking for internships and grad roles in software development. Feel free to message me on KyleBOT or connect on LinkedIn!
        </p>
      </div>
    </div>
  );
}
