'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Pencil, Brush, Eraser, Minus, Square, Circle,
  PaintBucket,
  RotateCcw, Save, HelpCircle
} from 'lucide-react';

// --- CSS PATTERNS FOR RETRO VIBE (expanded for 2 rows) ---
const PATTERNS = [
  { id: 'solid', style: { background: '#000' } },
  { id: 'white', style: { background: '#fff' } },
  { id: 'gray', style: { backgroundImage: 'radial-gradient(#000 15%, transparent 16%)', backgroundSize: '4px 4px', backgroundColor: '#fff' } },
  { id: 'gray-dark', style: { backgroundImage: 'radial-gradient(#000 25%, transparent 26%)', backgroundSize: '3px 3px', backgroundColor: '#fff' } },
  { id: 'dots', style: { backgroundImage: 'radial-gradient(#000 20%, transparent 21%)', backgroundSize: '6px 6px', backgroundColor: '#fff' } },
  { id: 'lines-v', style: { backgroundImage: 'repeating-linear-gradient(90deg, #000 0, #000 1px, transparent 0, transparent 4px)', backgroundColor: '#fff' } },
  { id: 'lines-h', style: { backgroundImage: 'repeating-linear-gradient(0deg, #000 0, #000 1px, transparent 0, transparent 4px)', backgroundColor: '#fff' } },
  { id: 'diag-r', style: { backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 4px)', backgroundColor: '#fff' } },
  { id: 'diag-l', style: { backgroundImage: 'repeating-linear-gradient(-45deg, #000 0, #000 1px, transparent 0, transparent 4px)', backgroundColor: '#fff' } },
  { id: 'check', style: { backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundPosition: '0 0, 2px 2px', backgroundSize: '4px 4px', backgroundColor: '#fff' } },
  { id: 'grid', style: { backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '4px 4px', backgroundColor: '#fff' } },
  { id: 'grid-lg', style: { backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '8px 8px', backgroundColor: '#fff' } },
  { id: 'bricks', style: { backgroundImage: 'linear-gradient(#000 1px, transparent 1px)', backgroundSize: '8px 4px', backgroundColor: '#fff' } },
  { id: 'weave', style: { backgroundImage: 'linear-gradient(45deg, #000 12.5%, transparent 12.5%, transparent 37.5%, #000 37.5%, #000 62.5%, transparent 62.5%, transparent 87.5%, #000 87.5%)', backgroundSize: '4px 4px', backgroundColor: '#fff' } },
  { id: 'dots-lg', style: { backgroundImage: 'radial-gradient(#000 30%, transparent 31%)', backgroundSize: '8px 8px', backgroundColor: '#fff' } },
  { id: 'cross', style: { backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '8px 8px', backgroundPosition: '3px 3px', backgroundColor: '#fff' } },
];

type ToolType = 'pencil' | 'brush' | 'eraser' | 'line' | 'rect' | 'circle' | 'fill' | 'hireme';

interface MacPaintProps {
  imageSrc?: string;
  fileName?: string;
}

export default function MacPaint({ imageSrc, fileName = "untitled.paint" }: MacPaintProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  // State
  const [tool, setTool] = useState<ToolType>('hireme');
  const [isDrawing, setIsDrawing] = useState(false);
  const [activePattern, setActivePattern] = useState(PATTERNS[0]);
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<ImageData[]>([]);
  const [brushSize, setBrushSize] = useState(3);

  // Hire Me tool state
  const [lastHireMePos, setLastHireMePos] = useState<{ x: number; y: number } | null>(null);

  // Mobile state
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
    const container = containerRef.current;
    if (!canvas || !container) return;

    const initCanvas = () => {
      // Set canvas size to match container
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

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

          // Scale to fill the entire canvas (cover style)
          const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (canvas.width - scaledWidth) / 2;
          const y = (canvas.height - scaledHeight) / 2;
          context.drawImage(img, x, y, scaledWidth, scaledHeight);
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
    setHistory(prev => [...prev.slice(-9), data]);
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
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    } else {
      return { x: 0, y: 0 };
    }

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

    if (patternCache.current.has(patternObj.id)) {
      const cached = patternCache.current.get(patternObj.id);
      return cached || 'black';
    }

    if (patternObj.id === 'solid') return 'black';
    if (patternObj.id === 'white') return 'white';

    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    if (!patternCtx) return 'black';

    const size = 8;
    patternCanvas.width = size;
    patternCanvas.height = size;

    patternCtx.fillStyle = 'white';
    patternCtx.fillRect(0, 0, size, size);
    patternCtx.fillStyle = 'black';

    switch (patternObj.id) {
      case 'gray':
      case 'gray-dark':
        patternCtx.fillRect(0, 0, 1, 1);
        patternCtx.fillRect(4, 4, 1, 1);
        break;
      case 'dots':
      case 'dots-lg':
        patternCtx.fillRect(3, 3, 2, 2);
        break;
      case 'lines-v':
        patternCtx.fillRect(0, 0, 1, size);
        patternCtx.fillRect(4, 0, 1, size);
        break;
      case 'lines-h':
        patternCtx.fillRect(0, 0, size, 1);
        patternCtx.fillRect(0, 4, size, 1);
        break;
      case 'diag-r':
      case 'diag-l':
        for (let i = 0; i < size; i++) patternCtx.fillRect(i, i, 1, 1);
        break;
      case 'check':
        patternCtx.fillRect(0, 0, 4, 4);
        patternCtx.fillRect(4, 4, 4, 4);
        break;
      case 'grid':
      case 'grid-lg':
        patternCtx.fillRect(0, 0, size, 1);
        patternCtx.fillRect(0, 0, 1, size);
        break;
      default:
        patternCtx.fillRect(0, 0, 1, 1);
    }

    const pattern = ctx.createPattern(patternCanvas, 'repeat');
    patternCache.current.set(patternObj.id, pattern);
    return pattern || 'black';
  };

  // Flood fill algorithm
  const floodFill = (startX: number, startY: number) => {
    if (!ctx || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const sx = Math.floor(startX);
    const sy = Math.floor(startY);

    if (sx < 0 || sx >= canvas.width || sy < 0 || sy >= canvas.height) return;

    const startPos = (sy * canvas.width + sx) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];

    const fillR = 0, fillG = 0, fillB = 0, fillA = 255;
    const tolerance = 32;

    const colorMatch = (r: number, g: number, b: number, a: number) => {
      return Math.abs(r - startR) <= tolerance &&
             Math.abs(g - startG) <= tolerance &&
             Math.abs(b - startB) <= tolerance &&
             Math.abs(a - startA) <= tolerance;
    };

    if (Math.abs(startR - fillR) <= tolerance &&
        Math.abs(startG - fillG) <= tolerance &&
        Math.abs(startB - fillB) <= tolerance) return;

    const pixelStack: [number, number][] = [[sx, sy]];
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

      if (colorMatch(r, g, b, a)) {
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
    if ('touches' in e) e.preventDefault();

    if (!ctx || !canvasRef.current) return;
    const { x, y } = getMousePos(e);

    if (tool === 'fill') {
      floodFill(x, y);
      return;
    }

    if (tool === 'hireme') {
      setIsDrawing(true);
      setLastHireMePos({ x, y });
      const fontSize = 10 + brushSize * 2;
      ctx.save();
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = '#ff0000';
      ctx.fillText('HIRE ME', x, y);
      ctx.restore();
      return;
    }

    setIsDrawing(true);
    setStartPos({ x, y });
    setSnapshot(ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 4;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = tool === 'pencil' ? Math.max(1, brushSize / 2) : brushSize;

      const pattern = createPattern(activePattern);
      ctx.strokeStyle = pattern as string;
      ctx.fillStyle = pattern as string;
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();

    if (!isDrawing || !ctx || !canvasRef.current) return;
    const { x, y } = getMousePos(e);

    if (tool === 'hireme') {
      if (lastHireMePos) {
        const fontSize = 10 + brushSize * 2;
        const distance = Math.sqrt(
          Math.pow(x - lastHireMePos.x, 2) + Math.pow(y - lastHireMePos.y, 2)
        );

        const spacing = fontSize * 3;
        if (distance > spacing) {
          ctx.save();
          ctx.font = `bold ${fontSize}px Arial`;
          ctx.fillStyle = '#ff0000';
          ctx.fillText('HIRE ME', x, y);
          ctx.restore();
          setLastHireMePos({ x, y });
        }
      }
      return;
    }

    if (!snapshot) return;

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

    if (tool === 'hireme') {
      setIsDrawing(false);
      setLastHireMePos(null);
      saveHistory(ctx);
      return;
    }

    ctx.closePath();
    setIsDrawing(false);
    saveHistory(ctx);
  };

  // Tool Button Component - simplified for better mobile performance
  const ToolBtn = ({ id, icon: Icon, compact = false }: any) => (
    <button
      type="button"
      onClick={() => setTool(id)}
      className={`${compact ? 'w-10 h-10' : 'w-8 h-8'} flex items-center justify-center border border-black cursor-pointer ${
        tool === id
          ? 'bg-black text-white'
          : 'bg-white text-black'
      }`}
    >
      <Icon size={compact ? 20 : 16} strokeWidth={1.5} />
    </button>
  );

  // Checkerboard pattern CSS
  const checkerboardStyle = {
    backgroundImage: `
      linear-gradient(45deg, #808080 25%, transparent 25%),
      linear-gradient(-45deg, #808080 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #808080 75%),
      linear-gradient(-45deg, transparent 75%, #808080 75%)
    `,
    backgroundSize: '8px 8px',
    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
    backgroundColor: '#c0c0c0',
  };

  return (
    <div className="flex flex-col h-full font-sans selection:bg-transparent" style={{ ...checkerboardStyle }}>

      {/* Menu Bar */}
      <div className="h-6 bg-white border-b-2 border-black flex items-center px-2 text-[10px] uppercase tracking-wider select-none">
        <span className="mr-4 font-bold">File</span>
        <span className="mr-4">Edit</span>
        <span className="mr-4 hidden md:inline">Goodies</span>
        <span className="mr-4 hidden md:inline">Font</span>
        <span className="mr-4 hidden md:inline">FontSize</span>
        <span className="mr-4 hidden md:inline">Style</span>
        <div className="flex-1 text-center font-bold italic truncate">{fileName}</div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Tool Panel - White with black border */}
        <div className="w-[86px] bg-white border-r-2 border-black flex flex-col shrink-0">
          {/* Tools Grid - 2 columns */}
          <div className="grid grid-cols-2 border-b-2 border-black">
            <ToolBtn id="fill" icon={PaintBucket} compact />
            <ToolBtn id="hireme" icon={HelpCircle} compact />
            <ToolBtn id="pencil" icon={Pencil} compact />
            <ToolBtn id="brush" icon={Brush} compact />
            <ToolBtn id="eraser" icon={Eraser} compact />
            <ToolBtn id="line" icon={Minus} compact />
            <ToolBtn id="rect" icon={Square} compact />
            <ToolBtn id="circle" icon={Circle} compact />
          </div>

          {/* Brush Size Slider - simplified for performance */}
          <div className="border-b-2 border-black bg-white px-1 py-3">
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full h-2 bg-gray-300 rounded appearance-none cursor-pointer"
              style={{
                background: 'linear-gradient(180deg, #999 0%, #ccc 50%, #999 100%)',
              }}
            />
          </div>

          {/* Undo Button */}
          <button
            onClick={undo}
            className="p-3 bg-white border-b-2 border-black flex items-center justify-center"
          >
            <RotateCcw size={20} />
          </button>

          {/* Spacer */}
          <div className="flex-1 bg-white"></div>
        </div>

        {/* Main Area - Canvas + Bottom Patterns */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas Area */}
          <div
            ref={containerRef}
            className="flex-1 bg-white border-2 border-black m-1 overflow-hidden"
          >
            <canvas
              ref={canvasRef}
              className="block w-full h-full cursor-crosshair"
              style={{ touchAction: 'none' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          {/* Bottom Pattern Palette - Two rows */}
          <div className="bg-white border-2 border-black m-1 mt-0 p-1">
            {/* Current pattern preview + patterns grid */}
            <div className="flex items-start gap-1">
              {/* Current Pattern Preview */}
              <div
                className="w-10 h-10 border-2 border-black shrink-0"
                style={activePattern.style}
              ></div>

              {/* Pattern Grid - 2 rows */}
              <div className="flex-1 grid grid-cols-8 gap-px">
                {PATTERNS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePattern(p)}
                    className={`w-5 h-5 border border-black ${
                      activePattern.id === p.id ? 'ring-2 ring-blue-500 ring-inset' : ''
                    }`}
                    style={p.style}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
