'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Pencil, Brush, Eraser, Minus, Square, Circle,
  Type, MousePointer, Hand, PaintBucket,
  RotateCcw, Save, HelpCircle
} from 'lucide-react';
import { haptic } from 'ios-haptics';

// --- CSS PATTERNS FOR RETRO VIBE ---
const PATTERNS = [
  { id: 'solid', style: { background: '#000' } },
  { id: 'gray', style: { backgroundImage: 'radial-gradient(#000 15%, transparent 16%)', backgroundSize: '4px 4px' } },
  { id: 'dots', style: { backgroundImage: 'radial-gradient(#000 15%, transparent 16%)', backgroundSize: '8px 8px' } },
  { id: 'lines-v', style: { backgroundImage: 'repeating-linear-gradient(90deg, #000 0, #000 1px, transparent 0, transparent 4px)' } },
  { id: 'lines-h', style: { backgroundImage: 'repeating-linear-gradient(0deg, #000 0, #000 1px, transparent 0, transparent 4px)' } },
  { id: 'check', style: { backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundPosition: '0 0, 4px 4px', backgroundSize: '8px 8px' } },
  { id: 'diag', style: { backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 6px)' } },
  { id: 'grid', style: { backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '8px 8px' } },
  { id: 'bricks', style: { backgroundImage: 'linear-gradient(335deg, rgba(0,0,0,0) 23px,rgba(0,0,0,1) 23px, rgba(0,0,0,1) 24px, rgba(0,0,0,0) 24px), linear-gradient(155deg, rgba(0,0,0,0) 23px,rgba(0,0,0,1) 23px, rgba(0,0,0,1) 24px, rgba(0,0,0,0) 24px), linear-gradient(335deg, rgba(0,0,0,0) 23px,rgba(0,0,0,1) 23px, rgba(0,0,0,1) 24px, rgba(0,0,0,0) 24px), linear-gradient(155deg, rgba(0,0,0,0) 23px,rgba(0,0,0,1) 23px, rgba(0,0,0,1) 24px, rgba(0,0,0,0) 24px)', backgroundSize: '10px 10px', backgroundColor: '#fff' } },
];

type ToolType = 'pencil' | 'brush' | 'eraser' | 'line' | 'rect' | 'circle' | 'select' | 'lasso' | 'text' | 'fill' | 'hireme';

interface MacPaintProps {
  imageSrc?: string;
  fileName?: string;
}

export default function MacPaint({ imageSrc, fileName = "untitled.paint" }: MacPaintProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  // State
  const [tool, setTool] = useState<ToolType>('brush');
  const [isDrawing, setIsDrawing] = useState(false);
  const [activePattern, setActivePattern] = useState(PATTERNS[0]);
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<ImageData[]>([]);
  const [brushSize, setBrushSize] = useState(3);

  // Selection state
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [lassoPath, setLassoPath] = useState<{ x: number; y: number }[]>([]);

  // Text tool state
  const [textInput, setTextInput] = useState<{ x: number; y: number; text: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Hire Me tool state
  const [lastHireMePos, setLastHireMePos] = useState<{ x: number; y: number } | null>(null);

  // Mobile state
  const [showPatterns, setShowPatterns] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Pattern cache
  const patternCache = useRef<Map<string, CanvasPattern | null>>(new Map());

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize Canvas & Load Image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Small delay to ensure canvas is properly sized in DOM
    const initCanvas = () => {
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;

      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = 'black';
      context.lineWidth = 3;
      setCtx(context);

      // Clear canvas first
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Load initial image if provided
      if (imageSrc) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;
        img.onload = () => {
          // Clear and redraw
          context.fillStyle = 'white';
          context.fillRect(0, 0, canvas.width, canvas.height);

          const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width / 2) - (img.width / 2) * scale;
          const y = (canvas.height / 2) - (img.height / 2) * scale;
          context.drawImage(img, x, y, img.width * scale, img.height * scale);
          saveHistory(context);
        };
        img.onerror = () => {
          console.error('Failed to load image:', imageSrc);
          saveHistory(context);
        };
      } else {
        saveHistory(context);
      }
    };

    // Delay initialization slightly to ensure layout is complete
    const timer = setTimeout(initCanvas, 100);
    return () => clearTimeout(timer);
  }, [imageSrc, isMobile]);

  // Helpers
  const saveHistory = (context: CanvasRenderingContext2D) => {
    if (!canvasRef.current) return;
    const data = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHistory(prev => [...prev.slice(-9), data]); // Keep last 10
  };

  const undo = () => {
    if (history.length <= 1 || !ctx || !canvasRef.current) return;
    const newHistory = [...history];
    newHistory.pop();
    const prevState = newHistory[newHistory.length - 1];
    ctx.putImageData(prevState, 0, 0);
    setHistory(newHistory);
  };

  const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      // For touchend events, use changedTouches
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    } else {
      return { x: 0, y: 0 };
    }

    // Account for canvas scaling
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // Create actual canvas pattern from pattern definition
  const createPattern = (patternObj: typeof PATTERNS[0]): string | CanvasPattern => {
    if (!ctx || !canvasRef.current) return 'black';

    // Use cached pattern if available
    if (patternCache.current.has(patternObj.id)) {
      const cached = patternCache.current.get(patternObj.id);
      return cached || 'black';
    }

    // For solid, just return black
    if (patternObj.id === 'solid') {
      return 'black';
    }

    // Create a small canvas to generate the pattern
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    if (!patternCtx) return 'black';

    // Set canvas size based on pattern
    const size = patternObj.id === 'dots' || patternObj.id === 'grid' ? 8 : 4;
    patternCanvas.width = size;
    patternCanvas.height = size;

    // Fill white background
    patternCtx.fillStyle = 'white';
    patternCtx.fillRect(0, 0, size, size);
    patternCtx.fillStyle = 'black';

    // Draw pattern
    switch (patternObj.id) {
      case 'gray':
        patternCtx.fillRect(0, 0, 1, 1);
        patternCtx.fillRect(2, 2, 1, 1);
        break;
      case 'dots':
        patternCtx.fillRect(1, 1, 2, 2);
        break;
      case 'lines-v':
        patternCtx.fillRect(0, 0, 1, size);
        break;
      case 'lines-h':
        patternCtx.fillRect(0, 0, size, 1);
        break;
      case 'diag':
        for (let i = 0; i < size; i++) {
          patternCtx.fillRect(i, i, 1, 1);
        }
        break;
      case 'check':
        patternCtx.fillRect(0, 0, size/2, size/2);
        patternCtx.fillRect(size/2, size/2, size/2, size/2);
        break;
      case 'grid':
        patternCtx.fillRect(0, 0, size, 1);
        patternCtx.fillRect(0, 0, 1, size);
        break;
      case 'bricks':
        patternCtx.fillRect(0, 0, size, 1);
        patternCtx.fillRect(0, size/2, size, 1);
        patternCtx.fillRect(size/2, 0, 1, size/2);
        patternCtx.fillRect(0, size/2, 1, size/2);
        break;
    }

    const pattern = ctx.createPattern(patternCanvas, 'repeat');
    patternCache.current.set(patternObj.id, pattern);
    return pattern || 'black';
  };

  // Flood fill algorithm for paint bucket
  const floodFill = (startX: number, startY: number) => {
    if (!ctx || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const startPos = (Math.floor(startY) * canvas.width + Math.floor(startX)) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];

    // Fill color (black for now)
    const fillR = 0, fillG = 0, fillB = 0, fillA = 255;

    // Don't fill if clicking on same color
    if (startR === fillR && startG === fillG && startB === fillB && startA === fillA) return;

    const pixelStack: [number, number][] = [[Math.floor(startX), Math.floor(startY)]];
    const visited = new Set<number>();

    while (pixelStack.length > 0) {
      const [x, y] = pixelStack.pop()!;

      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;

      const pos = (y * canvas.width + x) * 4;
      if (visited.has(pos)) continue;

      const r = data[pos];
      const g = data[pos + 1];
      const b = data[pos + 2];
      const a = data[pos + 3];

      if (r === startR && g === startG && b === startB && a === startA) {
        data[pos] = fillR;
        data[pos + 1] = fillG;
        data[pos + 2] = fillB;
        data[pos + 3] = fillA;
        visited.add(pos);

        pixelStack.push([x + 1, y]);
        pixelStack.push([x - 1, y]);
        pixelStack.push([x, y + 1]);
        pixelStack.push([x, y - 1]);
      }
    }

    ctx.putImageData(imageData, 0, 0);
    saveHistory(ctx);
  };

  // Drawing Handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default touch behavior to stop scrolling
    if ('touches' in e) {
      e.preventDefault();
    }

    if (!ctx || !canvasRef.current) return;
    const { x, y } = getMousePos(e);

    // Text tool - place text cursor
    if (tool === 'text') {
      setTextInput({ x, y, text: '' });
      setIsTyping(true);
      return;
    }

    // Fill tool - flood fill
    if (tool === 'fill') {
      floodFill(x, y);
      return;
    }

    // Hire Me tool - start drawing "HIRE ME" text
    if (tool === 'hireme') {
      setIsDrawing(true);
      setLastHireMePos({ x, y });
      ctx.save();
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#ff0000';
      ctx.fillText('HIRE ME', x, y);
      ctx.restore();
      return;
    }

    setIsDrawing(true);
    setStartPos({ x, y });
    setSnapshot(ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));

    // Lasso tool - start path
    if (tool === 'lasso') {
      setLassoPath([{ x, y }]);
      return;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);

    // Tool Styles
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 4; // Eraser is bigger
    } else if (tool === 'select') {
      // Selection tool doesn't draw yet
      return;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = tool === 'pencil' ? Math.max(1, brushSize / 2) : brushSize;

      const pattern = createPattern(activePattern);
      if (typeof pattern === 'string') {
        ctx.strokeStyle = pattern;
        ctx.fillStyle = pattern;
      } else {
        ctx.strokeStyle = pattern;
        ctx.fillStyle = pattern;
      }
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default touch behavior
    if ('touches' in e) {
      e.preventDefault();
    }

    if (!isDrawing || !ctx || !canvasRef.current) return;
    const { x, y } = getMousePos(e);

    // Hire Me tool - draw "HIRE ME" along path
    if (tool === 'hireme') {
      if (lastHireMePos) {
        const distance = Math.sqrt(
          Math.pow(x - lastHireMePos.x, 2) + Math.pow(y - lastHireMePos.y, 2)
        );

        // Only draw if moved at least 40px
        if (distance > 40) {
          ctx.save();
          ctx.font = 'bold 14px Arial';
          ctx.fillStyle = '#ff0000';
          ctx.fillText('HIRE ME', x, y);
          ctx.restore();
          setLastHireMePos({ x, y });
        }
      }
      return;
    }

    if (!snapshot) return;

    // Lasso tool - add to path
    if (tool === 'lasso') {
      setLassoPath(prev => [...prev, { x, y }]);

      // Draw lasso path preview
      ctx.putImageData(snapshot, 0, 0);
      ctx.save();
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      lassoPath.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Select tool - show selection rectangle
    if (tool === 'select') {
      ctx.putImageData(snapshot, 0, 0);
      ctx.save();
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
      ctx.restore();
      return;
    }

    // For Shapes, we clear and redraw from snapshot
    if (['line', 'rect', 'circle'].includes(tool)) {
      ctx.putImageData(snapshot, 0, 0);
      ctx.beginPath();
    }

    switch (tool) {
      case 'pencil':
      case 'brush':
      case 'eraser':
        ctx.lineTo(x, y);
        ctx.stroke();
        break;
      case 'line':
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        break;
      case 'rect':
        ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
        break;
      case 'circle':
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
    }
  };

  const stopDrawing = () => {
    if (!isDrawing || !ctx) return;

    // Hire Me tool - finalize
    if (tool === 'hireme') {
      setIsDrawing(false);
      setLastHireMePos(null);
      saveHistory(ctx);
      return;
    }

    // Finalize selection
    if (tool === 'select' && snapshot) {
      ctx.putImageData(snapshot, 0, 0);
      // Store selection bounds for potential future operations
      setSelection({
        x: Math.min(startPos.x, startPos.x),
        y: Math.min(startPos.y, startPos.y),
        width: Math.abs(startPos.x - startPos.x),
        height: Math.abs(startPos.y - startPos.y)
      });
    }

    // Finalize lasso
    if (tool === 'lasso' && snapshot) {
      ctx.putImageData(snapshot, 0, 0);
      setLassoPath([]);
    }

    ctx.closePath();
    setIsDrawing(false);
    saveHistory(ctx);
  };

  // Handle text input
  const handleTextSubmit = () => {
    if (!ctx || !textInput || !textInput.text.trim()) {
      setTextInput(null);
      setIsTyping(false);
      return;
    }

    ctx.save();
    ctx.font = '16px monospace';
    ctx.fillStyle = 'black';
    ctx.fillText(textInput.text, textInput.x, textInput.y);
    ctx.restore();

    saveHistory(ctx);
    setTextInput(null);
    setIsTyping(false);
  };

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTextSubmit();
    } else if (e.key === 'Escape') {
      setTextInput(null);
      setIsTyping(false);
    }
  };

  // Tool Button Component - Classic MacPaint style
  const ToolBtn = ({ id, icon: Icon, compact = false }: any) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        haptic();
        setTool(id);
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
      className={`${compact ? 'w-11 h-11' : 'w-8 h-8'} flex items-center justify-center border border-black transition-all active:scale-95 cursor-pointer relative z-10 ${
        tool === id
          ? 'bg-black text-white'
          : 'bg-white text-black hover:bg-gray-100'
      }`}
      style={{ pointerEvents: 'auto' }}
    >
      <Icon size={compact ? 22 : 16} strokeWidth={1.5} />
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-[#c0c0c0] font-sans selection:bg-transparent" style={{ pointerEvents: 'auto' }}>

      {/* 1. Paint Menu Bar */}
      <div className="h-6 bg-white border-b border-black flex items-center px-2 text-[10px] uppercase tracking-wider select-none overflow-x-auto">
        <span className="mr-4 font-bold whitespace-nowrap">File</span>
        <span className="mr-4 whitespace-nowrap">Edit</span>
        <span className="mr-4 whitespace-nowrap hidden md:inline">Goodies</span>
        <span className="mr-4 whitespace-nowrap hidden md:inline">Font</span>
        <span className="mr-4 whitespace-nowrap hidden md:inline">FontSize</span>
        <span className="mr-4 whitespace-nowrap hidden md:inline">Style</span>
        <div className="flex-1 text-center font-bold italic truncate">{fileName}</div>
      </div>

      {/* Mobile Layout - Classic MacPaint style */}
      {isMobile && (
        <div className="flex flex-1 overflow-hidden bg-[#c0c0c0]">
          {/* Left Tool Panel */}
          <div className="w-[88px] bg-white border-r-2 border-black flex flex-col shrink-0">
            {/* Tools Grid - 2 columns like original MacPaint */}
            <div className="grid grid-cols-2 border-b-2 border-black">
              <ToolBtn id="select" icon={MousePointer} compact />
              <ToolBtn id="rect" icon={Square} compact />
              <ToolBtn id="lasso" icon={Hand} compact />
              <ToolBtn id="text" icon={Type} compact />
              <ToolBtn id="fill" icon={PaintBucket} compact />
              <ToolBtn id="hireme" icon={HelpCircle} compact />
              <ToolBtn id="pencil" icon={Pencil} compact />
              <ToolBtn id="brush" icon={Brush} compact />
              <ToolBtn id="line" icon={Minus} compact />
              <ToolBtn id="eraser" icon={Eraser} compact />
              <ToolBtn id="rect" icon={Square} compact />
              <ToolBtn id="circle" icon={Circle} compact />
            </div>

            {/* Brush Size Slider - Apple Liquid Glass Style */}
            <div className="px-2 py-4 border-b-2 border-black bg-gradient-to-b from-gray-100 to-gray-200">
              <div className="text-[9px] font-bold text-center uppercase mb-3 text-gray-600">Size: {brushSize}px</div>
              <div
                className="relative h-10 rounded-full mx-1"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(235,235,240,0.9) 100%)',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.15), inset 0 -2px 4px rgba(255,255,255,0.9), 0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(0,0,0,0.12)',
                }}
              >
                {/* Track fill */}
                <div
                  className="absolute top-1.5 bottom-1.5 left-1.5 rounded-full transition-all duration-75 pointer-events-none"
                  style={{
                    width: `calc(${((brushSize - 1) / 19) * 100}%)`,
                    maxWidth: 'calc(100% - 12px)',
                    minWidth: '4px',
                    background: 'linear-gradient(180deg, #5AB0FF 0%, #007AFF 50%, #0062CC 100%)',
                    boxShadow: '0 2px 4px rgba(0,122,255,0.4), inset 0 1px 2px rgba(255,255,255,0.4)',
                  }}
                />
                {/* Thumb */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full transition-all duration-75 pointer-events-none"
                  style={{
                    left: `clamp(4px, calc(${((brushSize - 1) / 19) * 100}% - 16px), calc(100% - 36px))`,
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5FA 100%)',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.15), inset 0 2px 2px rgba(255,255,255,1)',
                    border: '0.5px solid rgba(0,0,0,0.08)',
                  }}
                />
                {/* Invisible range input - larger touch target */}
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushSize}
                  onChange={(e) => {
                    const newValue = Number(e.target.value);
                    if (newValue !== brushSize) {
                      haptic();
                      setBrushSize(newValue);
                    }
                  }}
                  onTouchStart={() => haptic()}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  style={{ touchAction: 'none', margin: 0, padding: 0 }}
                />
              </div>
            </div>

            {/* Undo Button */}
            <button
              onClick={() => {
                haptic();
                undo();
              }}
              className="p-2 bg-white border-b-2 border-black flex items-center justify-center active:bg-gray-200 transition-colors"
              title="Undo"
            >
              <RotateCcw size={20} />
            </button>

            {/* Spacer */}
            <div className="flex-1 bg-white"></div>
          </div>

          {/* Main Canvas Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Canvas */}
            <div className="flex-1 bg-white border-2 border-black overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="block bg-white cursor-crosshair w-full h-full"
                style={{ touchAction: 'none' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />

              {/* Text Input Overlay */}
              {isTyping && textInput && (
                <input
                  type="text"
                  value={textInput.text}
                  onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
                  onBlur={handleTextSubmit}
                  onKeyDown={handleTextKeyDown}
                  autoFocus
                  className="absolute bg-transparent border-none outline-none font-mono text-base p-0"
                  style={{
                    left: `${textInput.x}px`,
                    top: `${textInput.y - 16}px`,
                    color: 'black',
                    width: '200px',
                    fontSize: '16px'
                  }}
                />
              )}
            </div>

            {/* Bottom Pattern Bar */}
            <div className="h-14 bg-white border-t-2 border-black flex items-center px-1">
              {/* Current Pattern Preview */}
              <div
                className="w-12 h-12 border-2 border-black mr-2 shrink-0"
                style={activePattern.style}
              ></div>

              {/* Pattern Options */}
              <div className="flex-1 overflow-x-auto flex gap-px">
                {PATTERNS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      haptic();
                      setActivePattern(p);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      haptic();
                      setActivePattern(p);
                    }}
                    className={`w-10 h-10 border border-black shrink-0 active:scale-95 transition-transform ${
                      activePattern.id === p.id ? 'ring-2 ring-inset ring-blue-500' : ''
                    }`}
                    style={p.style}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Layout */}
      {!isMobile && (
      <div className="flex flex-1 overflow-hidden p-1 gap-1 relative">

        {/* Desktop Left Toolbar */}
        <div className="w-20 bg-[#c0c0c0] border-2 border-black p-1 flex flex-col gap-2 shrink-0 relative z-50">
             {/* Tools Grid */}
             <div
               className="grid grid-cols-2 gap-1 bg-white border-2 border-black p-1 shadow-[2px_2px_0_rgba(0,0,0,0.2)] relative z-10"
               style={{ pointerEvents: 'auto' }}
             >
                <ToolBtn id="pencil" icon={Pencil} />
                <ToolBtn id="brush" icon={Brush} />
                <ToolBtn id="eraser" icon={Eraser} />
                <ToolBtn id="line" icon={Minus} />
                <ToolBtn id="rect" icon={Square} />
                <ToolBtn id="circle" icon={Circle} />
                <ToolBtn id="text" icon={Type} />
                <ToolBtn id="fill" icon={PaintBucket} />
                <ToolBtn id="select" icon={MousePointer} />
                <ToolBtn id="hireme" icon={HelpCircle} />
             </div>

             {/* Brush Size Slider - Apple Liquid Glass Style */}
             <div className="border-2 border-black bg-gradient-to-b from-gray-100 to-gray-200 p-2 pointer-events-auto">
                <div className="text-[9px] font-bold text-center uppercase leading-none mb-2 text-gray-600">Size: {brushSize}px</div>
                <div
                  className="relative h-6 rounded-full"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(235,235,240,0.9) 100%)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.12), inset 0 -1px 2px rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(0,0,0,0.12)',
                  }}
                >
                  {/* Track fill */}
                  <div
                    className="absolute top-1 bottom-1 left-1 rounded-full transition-all duration-75 pointer-events-none"
                    style={{
                      width: `calc(${((brushSize - 1) / 19) * 100}%)`,
                      maxWidth: 'calc(100% - 8px)',
                      minWidth: '4px',
                      background: 'linear-gradient(180deg, #5AB0FF 0%, #007AFF 50%, #0062CC 100%)',
                      boxShadow: '0 1px 3px rgba(0,122,255,0.4), inset 0 1px 1px rgba(255,255,255,0.3)',
                    }}
                  />
                  {/* Thumb */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full transition-all duration-75 pointer-events-none"
                    style={{
                      left: `clamp(2px, calc(${((brushSize - 1) / 19) * 100}% - 10px), calc(100% - 22px))`,
                      background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5FA 100%)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,1)',
                      border: '0.5px solid rgba(0,0,0,0.08)',
                    }}
                  />
                  {/* Invisible range input */}
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
             </div>

             {/* Current Pattern Preview */}
             <div className="mt-auto border-2 border-black bg-white p-1 pointer-events-auto">
                <div className="h-8 w-full border border-black mb-1" style={activePattern.style}></div>
                <div className="text-[9px] font-bold text-center uppercase leading-none">Pattern</div>
             </div>

             {/* Undo/Save Buttons */}
             <div className="grid grid-cols-2 gap-1 pointer-events-auto">
               <button onClick={undo} className="bg-white border-2 border-black p-1 active:bg-black active:text-white" title="Undo">
                  <RotateCcw size={14} className="mx-auto"/>
               </button>
               <button className="bg-white border-2 border-black p-1 active:bg-black active:text-white" title="Save">
                  <Save size={14} className="mx-auto"/>
               </button>
             </div>
          </div>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col gap-1 overflow-hidden relative z-0">

           {/* The Canvas Area */}
           <div
             ref={containerRef}
             className="flex-1 bg-white border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,0.5)] overflow-auto relative"
           >
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="block bg-white shadow-lg cursor-crosshair mx-auto my-4"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />

              {/* Text Input Overlay */}
              {isTyping && textInput && (
                <input
                  type="text"
                  value={textInput.text}
                  onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
                  onBlur={handleTextSubmit}
                  onKeyDown={handleTextKeyDown}
                  autoFocus
                  className="absolute bg-transparent border-none outline-none font-mono text-base p-0"
                  style={{
                    left: `${textInput.x}px`,
                    top: `${textInput.y - 16}px`,
                    color: 'black',
                    width: '200px',
                    fontSize: '16px'
                  }}
                />
              )}
           </div>

           {/* Desktop Bottom Pattern Palette */}
           <div className="h-12 bg-white border-2 border-black flex flex-wrap content-start p-1 overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,0.2)] pointer-events-auto">
              {PATTERNS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePattern(p)}
                  className={`w-8 h-8 border border-gray-400 mr-[1px] mb-[1px] hover:border-black hover:scale-105 transition-transform ${activePattern.id === p.id ? 'ring-2 ring-blue-500 z-10' : ''}`}
                  style={p.style}
                />
              ))}
           </div>
        </div>
      </div>
      )}
    </div>
  );
}
