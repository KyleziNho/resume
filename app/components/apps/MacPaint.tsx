'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Pencil, Brush, Eraser, Minus, Square, Circle,
  Type, MousePointer, Hand, PaintBucket,
  RotateCcw, Save, HelpCircle
} from 'lucide-react';

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

  // Pattern cache
  const patternCache = useRef<Map<string, CanvasPattern | null>>(new Map());

  // Initialize Canvas & Load Image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = 'black';
    context.lineWidth = 3;
    setCtx(context);

    // Load initial image if provided
    if (imageSrc) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageSrc;
      img.onload = () => {
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width / 2) - (img.width / 2) * scale;
        const y = (canvas.height / 2) - (img.height / 2) * scale;
        context.drawImage(img, x, y, img.width * scale, img.height * scale);
        saveHistory(context);
      };
    } else {
      // White background default
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      saveHistory(context);
    }
  }, [imageSrc]);

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

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
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
    } else if (tool === 'select' || tool === 'lasso') {
      // Selection tools don't draw yet
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

  // Tool Button Component
  const ToolBtn = ({ id, icon: Icon }: any) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Tool clicked:', id); // Debug log
        setTool(id);
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
      className={`w-8 h-8 flex items-center justify-center border-2 border-r-4 border-b-4 transition-all active:translate-y-1 active:border-b-2 active:border-r-2 cursor-pointer relative z-10 ${
        tool === id
          ? 'bg-black text-white border-black'
          : 'bg-white text-black border-black hover:bg-gray-100'
      }`}
      style={{ pointerEvents: 'auto' }}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-[#c0c0c0] font-sans selection:bg-transparent" style={{ pointerEvents: 'auto' }}>

      {/* 1. Paint Menu Bar */}
      <div className="h-6 bg-white border-b border-black flex items-center px-2 text-[10px] uppercase tracking-wider select-none">
        <span className="mr-4 font-bold">File</span>
        <span className="mr-4">Edit</span>
        <span className="mr-4">Goodies</span>
        <span className="mr-4">Font</span>
        <span className="mr-4">FontSize</span>
        <span className="mr-4">Style</span>
        <div className="flex-1 text-center font-bold italic">{fileName}</div>
      </div>

      <div className="flex flex-1 overflow-hidden p-1 gap-1 relative">

        {/* 2. Left Toolbar */}
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

           {/* Brush Size Slider */}
           <div className="border-2 border-black bg-white p-2 pointer-events-auto">
              <div className="text-[9px] font-bold text-center uppercase leading-none mb-2">Size</div>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-black"
                style={{
                  background: `linear-gradient(to right, #000 0%, #000 ${((brushSize - 1) / 19) * 100}%, #d1d5db ${((brushSize - 1) / 19) * 100}%, #d1d5db 100%)`
                }}
              />
              <div className="text-[8px] text-center mt-1 font-mono">{brushSize}px</div>
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

        {/* 3. Main Workspace */}
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
                className="block mx-auto my-4 bg-white shadow-lg cursor-crosshair"
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
                    width: '200px'
                  }}
                />
              )}
           </div>

           {/* 4. Bottom Pattern Palette */}
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
    </div>
  );
}
