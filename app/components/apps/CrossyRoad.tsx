'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Trophy, Play } from 'lucide-react';
import { haptic } from 'ios-haptics';

// --- CONFIGURATION ---
const TILE_SIZE = 40;
const MAP_WIDTH = 15; // Number of tiles wide
const MAP_HEIGHT = 15; // Number of tiles visible
const COLORS = {
  grass: '#3b82f6', // macOS Blue
  road: '#333333',
  player: '#ffffff',
  playerShadow: 'rgba(0,0,0,0.2)',
  text: '#1d1d1f'
};

// --- TYPES ---
type LaneType = 'grass' | 'road';
interface Lane {
  id: number;
  type: LaneType;
  y: number; // Grid Y position
  speed: number; // For roads
  obstacles: Obstacle[];
}

interface Obstacle {
  x: number;
  type: 'bug' | 'packet';
}

// --- HAPTICS HELPER ---
const triggerHaptic = (type: 'light' | 'heavy' | 'success' | 'error') => {
  try {
    if (type === 'light') haptic();
    if (type === 'heavy') haptic();
    if (type === 'success') haptic();
    if (type === 'error') haptic.error();
  } catch (e) {
    // Fail silently if haptics not supported
  }
};

export default function KernelCrossing() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);

  // Game State
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Game Logic Refs (Mutable to avoid re-renders)
  const player = useRef({ x: 7, y: 0, hop: 0, targetX: 7, targetY: 0, isDead: false });
  const lanes = useRef<Lane[]>([]);
  const cameraY = useRef(0);
  const frameCount = useRef(0);

  // --- ENGINE: INITIALIZATION ---
  const initGame = () => {
    player.current = { x: Math.floor(MAP_WIDTH / 2), y: 0, hop: 0, targetX: Math.floor(MAP_WIDTH / 2), targetY: 0, isDead: false };
    cameraY.current = 0;
    setScore(0);

    // Generate initial lanes
    const newLanes: Lane[] = [];
    for (let i = -5; i < 20; i++) {
      newLanes.push(generateLane(i));
    }
    lanes.current = newLanes;
    setGameState('playing');
    triggerHaptic('success');
  };

  const generateLane = (yIndex: number): Lane => {
    // First few lanes are always grass
    if (yIndex < 3) return { id: yIndex, type: 'grass', y: yIndex, speed: 0, obstacles: [] };

    const isRoad = Math.random() > 0.4;
    const speed = isRoad ? (Math.random() * 0.08 + 0.03) * (Math.random() > 0.5 ? 1 : -1) : 0;

    // Generate Obstacles
    const obstacles: Obstacle[] = [];
    if (isRoad) {
      const count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < count; i++) {
        obstacles.push({
          x: Math.floor(Math.random() * MAP_WIDTH),
          type: Math.random() > 0.5 ? 'bug' : 'packet'
        });
      }
    }

    return {
      id: yIndex,
      type: isRoad ? 'road' : 'grass',
      y: yIndex,
      speed,
      obstacles
    };
  };

  // --- ENGINE: UPDATE LOOP ---
  const update = () => {
    if (gameState !== 'playing') return;

    frameCount.current++;
    const p = player.current;

    // 1. Move Player Animation (Linear Interpolation)
    const speed = 0.2;
    if (p.x !== p.targetX) p.x += (p.targetX - p.x) * speed;
    if (p.y !== p.targetY) p.y += (p.targetY - p.y) * speed;

    // Hop Animation (Sine wave)
    const dist = Math.sqrt(Math.pow(p.x - p.targetX, 2) + Math.pow(p.y - p.targetY, 2));
    p.hop = dist > 0.05 ? Math.sin(dist * Math.PI) * 15 : 0;

    // Snap to grid when close
    if (Math.abs(p.x - p.targetX) < 0.05) p.x = p.targetX;
    if (Math.abs(p.y - p.targetY) < 0.05) p.y = p.targetY;

    // 2. Camera Follow
    const targetCamY = p.y - 4;
    cameraY.current += (targetCamY - cameraY.current) * 0.1;

    // 3. Update Obstacles & Lanes
    lanes.current.forEach(lane => {
      if (lane.type === 'road') {
        lane.obstacles.forEach(obs => {
          obs.x += lane.speed;
          // Wrap around
          if (obs.x > MAP_WIDTH + 2) obs.x = -2;
          if (obs.x < -2) obs.x = MAP_WIDTH + 2;

          // COLLISION DETECTION
          // Simple box collision on the grid
          if (
            Math.abs(obs.x - p.x) < 0.7 && // Width tolerance
            Math.round(lane.y) === Math.round(p.y) && // Same Row
            !p.isDead
          ) {
            die();
          }
        });
      }
    });

    // 4. Infinite Lane Generation
    const lastLane = lanes.current[lanes.current.length - 1];
    if (lastLane.y < cameraY.current + MAP_HEIGHT + 2) {
      lanes.current.push(generateLane(lastLane.y + 1));
    }
    // Cleanup old lanes
    if (lanes.current.length > 30) lanes.current.shift();

    // 5. Update Score
    if (Math.round(p.y) > score) {
       setScore(Math.round(p.y));
    }
  };

  const die = () => {
    player.current.isDead = true;
    setGameState('gameover');
    if (score > highScore) setHighScore(score);
    triggerHaptic('error');
  };

  // --- ENGINE: RENDER LOOP ---
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Isometric Projection Helpers
    const offsetX = canvas.width / 2;
    const offsetY = 200; // Vertical offset

    const toIso = (x: number, y: number) => {
      return {
        x: (x - y) * TILE_SIZE + offsetX,
        y: (x + y) * (TILE_SIZE / 2) - (cameraY.current * TILE_SIZE) + offsetY
      };
    };

    // Draw Lanes (Painter's Algorithm: Back to Front)
    lanes.current.forEach(lane => {
      // Optimization: Don't draw if off screen
      const isoStart = toIso(0, lane.y);
      if (isoStart.y < -100 || isoStart.y > canvas.height + 100) return;

      // Draw Ground
      ctx.fillStyle = lane.type === 'grass' ? COLORS.grass : COLORS.road;

      // Draw the row as a single polygon for performance
      const p1 = toIso(0, lane.y);
      const p2 = toIso(MAP_WIDTH, lane.y);
      const p3 = toIso(MAP_WIDTH, lane.y + 1);
      const p4 = toIso(0, lane.y + 1);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fill();

      // Lane Details (Road Lines)
      if (lane.type === 'road') {
         ctx.strokeStyle = '#555';
         ctx.setLineDash([10, 10]);
         ctx.beginPath();
         const m1 = toIso(0, lane.y + 0.5);
         const m2 = toIso(MAP_WIDTH, lane.y + 0.5);
         ctx.moveTo(m1.x, m1.y);
         ctx.lineTo(m2.x, m2.y);
         ctx.stroke();
         ctx.setLineDash([]);
      }

      // Draw Obstacles
      lane.obstacles.forEach(obs => {
         const pos = toIso(obs.x, lane.y + 0.5); // Center in lane
         drawEntity(ctx, pos.x, pos.y, obs.type);
      });
    });

    // Draw Player
    if (!player.current.isDead || Math.floor(Date.now() / 100) % 2 === 0) {
      const p = player.current;
      const pos = toIso(p.x, p.y + 0.5);
      drawPlayer(ctx, pos.x, pos.y - p.hop);
    }
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Shadow
    ctx.fillStyle = COLORS.playerShadow;
    ctx.beginPath();
    ctx.ellipse(x, y + 15, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (White Cube - File Icon style)
    const size = 26;
    y -= 10; // Lift up

    // Main face
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - size/2, y - size, size, size);

    // Side (3D effect)
    ctx.fillStyle = '#ccc';
    ctx.beginPath();
    ctx.moveTo(x + size/2, y - size);
    ctx.lineTo(x + size/2 + 5, y - size - 5);
    ctx.lineTo(x + size/2 + 5, y - 5);
    ctx.lineTo(x + size/2, y);
    ctx.fill();

    // Top
    ctx.fillStyle = '#eee';
    ctx.beginPath();
    ctx.moveTo(x - size/2, y - size);
    ctx.lineTo(x - size/2 + 5, y - size - 5);
    ctx.lineTo(x + size/2 + 5, y - size - 5);
    ctx.lineTo(x + size/2, y - size);
    ctx.fill();

    // "File" Fold
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(x + size/2 - 8, y - size);
    ctx.lineTo(x + size/2, y - size + 8);
    ctx.lineTo(x + size/2, y - size);
    ctx.fill();

    // Eyes (Cute face)
    ctx.fillStyle = '#333';
    if (gameState === 'gameover') {
       // X eyes
       ctx.font = '10px Arial';
       ctx.fillText('x  x', x - 8, y - 8);
    } else {
       ctx.beginPath();
       ctx.arc(x - 5, y - 8, 2, 0, Math.PI * 2); // Left
       ctx.arc(x + 5, y - 8, 2, 0, Math.PI * 2); // Right
       ctx.fill();
    }
  };

  const drawEntity = (ctx: CanvasRenderingContext2D, x: number, y: number, type: string) => {
    // Determine color/shape
    const color = type === 'bug' ? '#ef4444' : '#10b981'; // Red Bug or Green Packet

    // Draw simple isometric box car
    const w = 24;
    const h = 16;
    y -= 8;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = color;
    // Front face
    ctx.fillRect(x - w/2, y - h, w, h);
    // Top face
    ctx.fillStyle = changeColor(color, 40);
    ctx.beginPath();
    ctx.moveTo(x - w/2, y - h);
    ctx.lineTo(x - w/2 + 5, y - h - 5);
    ctx.lineTo(x + w/2 + 5, y - h - 5);
    ctx.lineTo(x + w/2, y - h);
    ctx.fill();
    // Side face
    ctx.fillStyle = changeColor(color, -20);
    ctx.beginPath();
    ctx.moveTo(x + w/2, y - h);
    ctx.lineTo(x + w/2 + 5, y - h - 5);
    ctx.lineTo(x + w/2 + 5, y - 5);
    ctx.lineTo(x + w/2, y);
    ctx.fill();

    // Text label for "Tech" feel
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '8px monospace';
    ctx.fillText(type === 'bug' ? 'BUG' : 'DATA', x - 8, y - 4);
  };

  const changeColor = (hex: string, amt: number) => {
     // Quick hex lighten/darken helper
     let usePound = false;
     if (hex[0] === "#") { hex = hex.slice(1); usePound = true; }
     let num = parseInt(hex, 16);
     let r = (num >> 16) + amt;
     if (r > 255) r = 255; else if (r < 0) r = 0;
     let b = ((num >> 8) & 0x00FF) + amt;
     if (b > 255) b = 255; else if (b < 0) b = 0;
     let g = (num & 0x0000FF) + amt;
     if (g > 255) g = 255; else if (g < 0) g = 0;
     return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
  };

  // --- CONTROLS ---
  const handleInput = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (gameState !== 'playing' || player.current.isDead) return;

    const p = player.current;

    // Only allow move if mostly finished previous move
    if (Math.abs(p.x - p.targetX) > 0.2 || Math.abs(p.y - p.targetY) > 0.2) return;

    let moved = false;
    if (dir === 'up') { p.targetY += 1; moved = true; }
    if (dir === 'down' && p.targetY > cameraY.current - 2) { p.targetY -= 1; moved = true; }
    if (dir === 'left' && p.targetX > 0) { p.targetX -= 1; moved = true; }
    if (dir === 'right' && p.targetX < MAP_WIDTH) { p.targetX += 1; moved = true; }

    if (moved) triggerHaptic('light');

  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') handleInput('up');
      if (e.key === 'ArrowDown' || e.key === 's') handleInput('down');
      if (e.key === 'ArrowLeft' || e.key === 'a') handleInput('left');
      if (e.key === 'ArrowRight' || e.key === 'd') handleInput('right');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput]);

  // --- GAME LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size based on container
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth || 800;
        canvas.height = container.clientHeight || 600;
      }
    };
    updateCanvasSize();

    const tick = () => {
      update();
      draw();
      requestRef.current = requestAnimationFrame(tick);
    };
    requestRef.current = requestAnimationFrame(tick);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameState, score]);

  return (
    <div className="relative w-full h-full bg-[#a5d5f2] overflow-hidden select-none font-sans">

      {/* BACKGROUND DECORATION */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#bfdbfe] to-[#a5d5f2]"></div>

      {/* CANVAS LAYER */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: 'crisp-edges' }}
      />

      {/* UI OVERLAY: HUD */}
      <div className="absolute top-4 left-4 flex gap-4 z-20">
        <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/50">
           <span className="text-xs text-blue-500 font-bold uppercase block">Current Score</span>
           <span className="text-2xl font-black text-gray-800">{score}</span>
        </div>
        <div className="bg-white/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30">
           <span className="text-xs text-gray-500 font-bold uppercase block">Best</span>
           <span className="text-xl font-bold text-gray-600">{highScore}</span>
        </div>
      </div>

      {/* UI OVERLAY: MENU */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm border border-white/20">
            <div className="w-16 h-16 bg-blue-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg transform -rotate-6">
                <span className="text-3xl">📂</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Kernel Crossing</h1>
            <p className="text-gray-500 mb-6">Help the file escape the infinite data stream! Use arrow keys to move.</p>
            <button
              onClick={initGame}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Play size={20} fill="currentColor" /> Start Process
            </button>
          </div>
        </div>
      )}

      {/* UI OVERLAY: GAME OVER */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-red-500/20 backdrop-blur-sm flex items-center justify-center z-30 animate-fade-in">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center border-4 border-red-100">
            <div className="text-6xl mb-2">💥</div>
            <h2 className="text-2xl font-black text-gray-800 mb-1">Process Terminated</h2>
            <p className="text-gray-500 text-sm mb-6 uppercase tracking-wider font-bold">You hit a bug!</p>

            <div className="flex justify-center gap-8 mb-8 border-t border-b border-gray-100 py-4">
               <div>
                 <div className="text-xs text-gray-400 font-bold uppercase">Score</div>
                 <div className="text-3xl font-black text-gray-800">{score}</div>
               </div>
               <div>
                 <div className="text-xs text-yellow-500 font-bold uppercase flex items-center gap-1"><Trophy size={10} /> High</div>
                 <div className="text-3xl font-black text-yellow-500">{Math.max(score, highScore)}</div>
               </div>
            </div>

            <button
              onClick={initGame}
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Reboot System
            </button>
          </div>
        </div>
      )}

      {/* MOBILE CONTROLS (Invisible Touch Zones) */}
      {gameState === 'playing' && (
        <div className="absolute inset-0 z-0 grid grid-rows-3 grid-cols-3 opacity-0">
           {/* Top for Up */}
           <div className="col-start-2 row-start-1" onTouchStart={() => handleInput('up')}></div>
           {/* Bottom for Down */}
           <div className="col-start-2 row-start-3" onTouchStart={() => handleInput('down')}></div>
           {/* Left */}
           <div className="row-start-2 col-start-1" onTouchStart={() => handleInput('left')}></div>
           {/* Right */}
           <div className="row-start-2 col-start-3" onTouchStart={() => handleInput('right')}></div>
           {/* Center (Tap to go up too) */}
           <div className="row-start-2 col-start-2" onTouchStart={() => handleInput('up')}></div>
        </div>
      )}
    </div>
  );
}
