'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Pencil, Brush, Eraser, Minus, Square, Circle,
  PaintBucket,
  RotateCcw, Sparkles
} from 'lucide-react';
import { haptic } from 'ios-haptics';

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

// Hire me phrases with colors
const HIRE_ME_PHRASES = [
  { text: 'HIRE ME', color: '#ff0000' },
  { text: 'BEST DEV', color: '#ff6600' },
  { text: 'AMAZING UI', color: '#9900ff' },
  { text: 'WOW', color: '#00cc00' },
  { text: 'HIRE KYLE', color: '#0066ff' },
  { text: 'SO COOL', color: '#ff0099' },
  { text: '10/10', color: '#00cccc' },
  { text: 'LEGEND', color: '#ff3366' },
  { text: 'NEVER SEEN ANYTHING LIKE IT', color: '#ff4400' },
  { text: 'CRAZY UX', color: '#6600ff' },
];

type ToolType = 'pencil' | 'brush' | 'eraser' | 'line' | 'rect' | 'circle' | 'fill' | 'hireme';

interface MacPaintProps {
  imageSrc?: string;
  fileName?: string;
}

export default function MacPaint({ imageSrc, fileName = "untitled.paint" }: MacPaintProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // State
  const [tool, setTool] = useState<ToolType>('hireme');
  const [activePatternId, setActivePatternId] = useState('solid');
  const [brushSize, setBrushSize] = useState(3);
  const [, forceUpdate] = useState({});

  // Refs for drawing state (avoid re-renders during draw)
  const isDrawingRef = useRef(false);
  const snapshotRef = useRef<ImageData | null>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const historyRef = useRef<ImageData[]>([]);
  const lastHireMePosRef = useRef<{ x: number; y: number } | null>(null);
  const hireMeIndexRef = useRef(0);
  const patternCacheRef = useRef<Map<string, CanvasPattern | null>>(new Map());
  const isMobileRef = useRef(false);

  // Get active pattern
  const activePattern = useMemo(() =>
    PATTERNS.find(p => p.id === activePatternId) || PATTERNS[0],
    [activePatternId]
  );

  // Detect mobile on mount
  useEffect(() => {
    isMobileRef.current = window.innerWidth < 768;
  }, []);

  // Initialize Canvas & Load Image
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const initCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;

      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = 'black';
      context.lineWidth = 3;
      ctxRef.current = context;

      // Clear canvas first
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Load initial image if provided
      if (imageSrc) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;
        img.onload = () => {
          context.fillStyle = 'white';
          context.fillRect(0, 0, canvas.width, canvas.height);

          // Use "cover" style on mobile (fills canvas, may crop)
          // Use "contain" style on desktop (shows full image)
          const isMobile = window.innerWidth < 768;
          const scale = isMobile
            ? Math.max(canvas.width / img.width, canvas.height / img.height)
            : Math.min(canvas.width / img.width, canvas.height / img.height);

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

    const timer = setTimeout(initCanvas, 100);
    return () => clearTimeout(timer);
  }, [imageSrc]);

  // Helpers
  const saveHistory = useCallback((context: CanvasRenderingContext2D) => {
    if (!canvasRef.current) return;
    const data = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    historyRef.current = [...historyRef.current.slice(-9), data];
  }, []);

  const undo = useCallback(() => {
    const ctx = ctxRef.current;
    if (historyRef.current.length <= 1 || !ctx || !canvasRef.current) return;
    historyRef.current.pop();
    const prevState = historyRef.current[historyRef.current.length - 1];
    ctx.putImageData(prevState, 0, 0);
    forceUpdate({});
  }, []);

  const getMousePos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
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
  }, []);

  // Create actual canvas pattern from pattern definition
  const createPattern = useCallback((patternObj: typeof PATTERNS[0]): string | CanvasPattern => {
    const ctx = ctxRef.current;
    if (!ctx || !canvasRef.current) return 'black';

    if (patternCacheRef.current.has(patternObj.id)) {
      const cached = patternCacheRef.current.get(patternObj.id);
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
    patternCacheRef.current.set(patternObj.id, pattern);
    return pattern || 'black';
  }, []);

  // Flood fill algorithm
  const floodFill = useCallback((startX: number, startY: number) => {
    const ctx = ctxRef.current;
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
  }, [saveHistory]);

  // Get next hire me phrase
  const getNextHireMePhrase = useCallback(() => {
    const phrase = HIRE_ME_PHRASES[hireMeIndexRef.current];
    hireMeIndexRef.current = (hireMeIndexRef.current + 1) % HIRE_ME_PHRASES.length;
    return phrase;
  }, []);

  // Drawing Handlers
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();

    const ctx = ctxRef.current;
    if (!ctx || !canvasRef.current) return;
    const { x, y } = getMousePos(e);

    if (tool === 'fill') {
      floodFill(x, y);
      return;
    }

    if (tool === 'hireme') {
      isDrawingRef.current = true;
      lastHireMePosRef.current = { x, y };
      const fontSize = 10 + brushSize * 2;
      const phrase = getNextHireMePhrase();
      haptic();
      ctx.save();
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = phrase.color;
      ctx.fillText(phrase.text, x, y);
      ctx.restore();
      return;
    }

    isDrawingRef.current = true;
    startPosRef.current = { x, y };
    snapshotRef.current = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);

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
  }, [tool, brushSize, activePattern, getMousePos, floodFill, createPattern, getNextHireMePhrase]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();

    const ctx = ctxRef.current;
    if (!isDrawingRef.current || !ctx || !canvasRef.current) return;
    const { x, y } = getMousePos(e);

    if (tool === 'hireme') {
      if (lastHireMePosRef.current) {
        const fontSize = 10 + brushSize * 2;
        const distance = Math.sqrt(
          Math.pow(x - lastHireMePosRef.current.x, 2) + Math.pow(y - lastHireMePosRef.current.y, 2)
        );

        const spacing = fontSize * 3;
        if (distance > spacing) {
          const phrase = getNextHireMePhrase();
          haptic();
          ctx.save();
          ctx.font = `bold ${fontSize}px Arial`;
          ctx.fillStyle = phrase.color;
          ctx.fillText(phrase.text, x, y);
          ctx.restore();
          lastHireMePosRef.current = { x, y };
        }
      }
      return;
    }

    if (!snapshotRef.current) return;

    if (['line', 'rect', 'circle'].includes(tool)) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.beginPath();
    }

    const startPos = startPosRef.current;

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
  }, [tool, brushSize, getMousePos, getNextHireMePhrase]);

  const stopDrawing = useCallback(() => {
    const ctx = ctxRef.current;
    if (!isDrawingRef.current || !ctx) return;

    if (tool === 'hireme') {
      isDrawingRef.current = false;
      lastHireMePosRef.current = null;
      saveHistory(ctx);
      return;
    }

    ctx.closePath();
    isDrawingRef.current = false;
    saveHistory(ctx);
  }, [tool, saveHistory]);

  // Memoized handlers for tools to prevent re-renders
  const handleToolClick = useCallback((id: ToolType) => {
    haptic();
    setTool(id);
  }, []);

  const handlePatternClick = useCallback((id: string) => {
    haptic();
    setActivePatternId(id);
  }, []);

  const handleBrushSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBrushSize(Number(e.target.value));
  }, []);

  const handleUndo = useCallback(() => {
    haptic();
    undo();
  }, [undo]);

  // Checkerboard pattern CSS
  const checkerboardStyle = useMemo(() => ({
    backgroundImage: `
      linear-gradient(45deg, #808080 25%, transparent 25%),
      linear-gradient(-45deg, #808080 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #808080 75%),
      linear-gradient(-45deg, transparent 75%, #808080 75%)
    `,
    backgroundSize: '8px 8px',
    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
    backgroundColor: '#c0c0c0',
  }), []);

  // Tool buttons data
  const tools: { id: ToolType; icon: typeof Pencil }[] = [
    { id: 'fill', icon: PaintBucket },
    { id: 'hireme', icon: Sparkles },
    { id: 'pencil', icon: Pencil },
    { id: 'brush', icon: Brush },
    { id: 'eraser', icon: Eraser },
    { id: 'line', icon: Minus },
    { id: 'rect', icon: Square },
    { id: 'circle', icon: Circle },
  ];

  return (
    <div className="flex flex-col h-full font-sans selection:bg-transparent" style={checkerboardStyle}>

      {/* Menu Bar */}
      <div className="h-6 bg-white border-b-2 border-black flex items-center px-2 text-[10px] uppercase tracking-wider select-none">
        <div className="flex-1 text-center font-bold italic truncate">{fileName}</div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Tool Panel - White with black border */}
        <div className="w-[86px] bg-white border-r-2 border-black flex flex-col shrink-0">
          {/* Tools Grid - 2 columns */}
          <div className="grid grid-cols-2 border-b-2 border-black">
            {tools.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleToolClick(id)}
                className={`w-10 h-10 flex items-center justify-center border border-black cursor-pointer ${
                  tool === id ? 'bg-black text-white' : 'bg-white text-black'
                }`}
              >
                <Icon size={20} strokeWidth={1.5} />
              </button>
            ))}
          </div>

          {/* Brush Size Slider */}
          <div className="border-b-2 border-black bg-white px-2 py-3">
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={handleBrushSizeChange}
              className="w-full h-3 rounded appearance-none cursor-pointer"
              style={{
                background: 'linear-gradient(180deg, #999 0%, #ccc 50%, #999 100%)',
                WebkitAppearance: 'none',
              }}
            />
          </div>

          {/* Undo Button */}
          <button
            type="button"
            onClick={handleUndo}
            className="p-3 bg-white border-b-2 border-black flex items-center justify-center cursor-pointer active:bg-gray-200"
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
                    onClick={() => handlePatternClick(p.id)}
                    className={`w-5 h-5 border border-black ${
                      activePatternId === p.id ? 'ring-2 ring-blue-500 ring-inset' : ''
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
