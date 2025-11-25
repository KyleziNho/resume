'use client';

import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, Play } from 'lucide-react';
import { haptic } from 'ios-haptics';

// Game configuration
const CELL_SIZE = 50;
const GRID_WIDTH = 11;
const GRID_HEIGHT = 12;

type LaneType = 'grass' | 'road' | 'water';
type ObstacleType = 'bug' | 'meeting' | 'deadline' | 'coffee' | 'skill';

interface Lane {
  type: LaneType;
  speed: number;
  obstacles: Obstacle[];
}

interface Obstacle {
  x: number;
  type: ObstacleType;
  color: string;
}

interface Player {
  x: number;
  y: number;
}

const OBSTACLE_CONFIG = {
  bug: { color: '#ef4444', label: 'BUG', deadly: true },
  meeting: { color: '#8b5cf6', label: 'MTG', deadly: true },
  deadline: { color: '#f59e0b', label: 'DL', deadly: true },
  coffee: { color: '#10b981', label: '☕', deadly: false },
  skill: { color: '#3b82f6', label: '+1', deadly: false }
};

export default function CrossyRoad() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [skills, setSkills] = useState(0);

  const playerRef = useRef<Player>({ x: Math.floor(GRID_WIDTH / 2), y: GRID_HEIGHT - 2 });
  const lanesRef = useRef<Lane[]>([]);
  const cameraYRef = useRef(0);
  const animationRef = useRef<number | undefined>(undefined);

  const initGame = () => {
    playerRef.current = { x: Math.floor(GRID_WIDTH / 2), y: GRID_HEIGHT - 2 };
    cameraYRef.current = 0;
    setScore(0);
    setSkills(0);

    // Generate lanes
    const lanes: Lane[] = [];
    for (let i = 0; i < 30; i++) {
      lanes.push(generateLane(i));
    }
    lanesRef.current = lanes;
    setGameState('playing');
    haptic();
  };

  const generateLane = (index: number): Lane => {
    if (index < 3) {
      return { type: 'grass', speed: 0, obstacles: [] };
    }

    const rand = Math.random();
    const type: LaneType = rand > 0.7 ? 'water' : rand > 0.4 ? 'road' : 'grass';
    const speed = type === 'road' || type === 'water' ? (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1) : 0;

    const obstacles: Obstacle[] = [];
    if (type !== 'grass') {
      const count = Math.floor(Math.random() * 2) + 2;
      const obstacleTypes: ObstacleType[] = type === 'water'
        ? ['bug', 'deadline']
        : ['bug', 'meeting', 'deadline', 'coffee', 'skill'];

      for (let i = 0; i < count; i++) {
        const obsType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        obstacles.push({
          x: Math.random() * GRID_WIDTH,
          type: obsType,
          color: OBSTACLE_CONFIG[obsType].color
        });
      }
    }

    return { type, speed, obstacles };
  };

  const movePlayer = (dx: number, dy: number) => {
    if (gameState !== 'playing') return;

    const player = playerRef.current;
    const newX = Math.max(0, Math.min(GRID_WIDTH - 1, player.x + dx));
    const newY = player.y + dy;

    // Check bounds
    if (newY < 0 || newY >= lanesRef.current.length) return;

    player.x = newX;
    player.y = newY;

    // Update score when moving forward
    if (dy < 0 && newY < cameraYRef.current + 5) {
      setScore(s => Math.max(s, cameraYRef.current + (GRID_HEIGHT - 2) - newY));
    }

    haptic();
  };

  const update = () => {
    if (gameState !== 'playing') return;

    const player = playerRef.current;

    // Update camera
    const targetY = Math.max(0, player.y - (GRID_HEIGHT - 5));
    cameraYRef.current += (targetY - cameraYRef.current) * 0.1;

    // Generate new lanes
    while (lanesRef.current.length < cameraYRef.current + 30) {
      lanesRef.current.push(generateLane(lanesRef.current.length));
    }

    // Update obstacles and check collisions
    lanesRef.current.forEach((lane, index) => {
      lane.obstacles.forEach(obs => {
        obs.x += lane.speed * 0.02;
        if (obs.x > GRID_WIDTH + 1) obs.x = -1;
        if (obs.x < -1) obs.x = GRID_WIDTH + 1;

        // Collision detection
        if (Math.abs(obs.x - player.x) < 0.6 && Math.abs(index - player.y) < 0.6) {
          if (OBSTACLE_CONFIG[obs.type].deadly) {
            gameOver();
          } else if (obs.type === 'skill') {
            setSkills(s => s + 1);
            obs.x = -999; // Remove
            haptic();
          } else if (obs.type === 'coffee') {
            setScore(s => s + 5);
            obs.x = -999;
            haptic();
          }
        }
      });
    });
  };

  const gameOver = () => {
    setGameState('gameover');
    if (score > highScore) setHighScore(score);
    try { haptic.error(); } catch {}
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const offsetY = cameraYRef.current;
    const player = playerRef.current;

    // Draw lanes
    for (let i = Math.floor(offsetY); i < Math.floor(offsetY) + GRID_HEIGHT; i++) {
      if (i < 0 || i >= lanesRef.current.length) continue;

      const lane = lanesRef.current[i];
      const y = (i - offsetY) * CELL_SIZE;

      // Lane background
      ctx.fillStyle = lane.type === 'grass' ? '#22c55e'
        : lane.type === 'road' ? '#374151'
        : '#3b82f6';
      ctx.fillRect(0, y, canvas.width, CELL_SIZE);

      // Road lines
      if (lane.type === 'road') {
        ctx.strokeStyle = '#fbbf24';
        ctx.setLineDash([10, 10]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y + CELL_SIZE / 2);
        ctx.lineTo(canvas.width, y + CELL_SIZE / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw obstacles
      lane.obstacles.forEach(obs => {
        if (obs.x < -1 || obs.x > GRID_WIDTH) return;

        const x = obs.x * CELL_SIZE + CELL_SIZE / 2;
        const config = OBSTACLE_CONFIG[obs.type];

        ctx.fillStyle = config.color;
        ctx.fillRect(x - 20, y + 5, 40, 40);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(config.label, x, y + 30);
      });
    }

    // Draw player
    const px = player.x * CELL_SIZE + CELL_SIZE / 2;
    const py = (player.y - offsetY) * CELL_SIZE + CELL_SIZE / 2;

    // Player shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(px, py + 20, 15, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Player body
    ctx.fillStyle = '#f97316';
    ctx.fillRect(px - 18, py - 25, 36, 36);

    ctx.fillStyle = '#ea580c';
    ctx.fillRect(px - 18, py - 25, 36, 4);

    // Eyes
    ctx.fillStyle = 'white';
    ctx.fillRect(px - 10, py - 15, 8, 8);
    ctx.fillRect(px + 2, py - 15, 8, 8);
    ctx.fillStyle = 'black';
    ctx.fillRect(px - 7, py - 12, 4, 4);
    ctx.fillRect(px + 5, py - 12, 4, 4);

    // Smile
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py - 5, 8, 0, Math.PI);
    ctx.stroke();
  };

  const gameLoop = () => {
    update();
    draw();
    animationRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = GRID_WIDTH * CELL_SIZE;
    canvas.height = GRID_HEIGHT * CELL_SIZE;

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      if (e.key === 'ArrowUp' || e.key === 'w') movePlayer(0, -1);
      if (e.key === 'ArrowDown' || e.key === 's') movePlayer(0, 1);
      if (e.key === 'ArrowLeft' || e.key === 'a') movePlayer(-1, 0);
      if (e.key === 'ArrowRight' || e.key === 'd') movePlayer(1, 0);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-sky-200 to-sky-100 flex flex-col items-center justify-center overflow-hidden">

      {/* HUD */}
      <div className="absolute top-4 left-4 flex gap-3 z-20">
        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg">
          <div className="text-xs text-gray-500 font-bold">SCORE</div>
          <div className="text-2xl font-black text-gray-900">{score}</div>
        </div>
        <div className="bg-white/70 backdrop-blur px-4 py-2 rounded-lg">
          <div className="text-xs text-gray-500 font-bold">SKILLS</div>
          <div className="text-2xl font-black text-blue-600">{skills}</div>
        </div>
        <div className="bg-white/70 backdrop-blur px-3 py-2 rounded-lg">
          <div className="text-xs text-gray-400 font-bold">BEST</div>
          <div className="text-xl font-bold text-gray-600">{highScore}</div>
        </div>
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} className="border-4 border-white shadow-2xl rounded-lg" />

      {/* Menu */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md text-center">
            <div className="text-6xl mb-4">👨‍💻</div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">kyle's career path</h1>
            <p className="text-gray-600 mb-6">
              navigate through your career! avoid bugs, meetings, and deadlines.
              collect skills (+1) and coffee (☕) for bonus points.
            </p>
            <button
              onClick={initGame}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Play size={20} /> start journey
            </button>
          </div>
        </div>
      )}

      {/* Game Over */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center border-4 border-red-200">
            <div className="text-6xl mb-3">💥</div>
            <h2 className="text-2xl font-black text-gray-900 mb-1">career setback!</h2>
            <p className="text-gray-500 text-sm mb-6">you hit a {Math.random() > 0.5 ? 'critical bug' : 'impossible deadline'}!</p>

            <div className="flex justify-center gap-6 mb-6 border-t border-b py-4">
              <div>
                <div className="text-xs text-gray-400 font-bold">SCORE</div>
                <div className="text-3xl font-black text-gray-900">{score}</div>
              </div>
              <div>
                <div className="text-xs text-blue-500 font-bold">SKILLS</div>
                <div className="text-3xl font-black text-blue-600">{skills}</div>
              </div>
              <div>
                <div className="text-xs text-orange-500 font-bold">BEST</div>
                <div className="text-3xl font-black text-orange-500">{Math.max(score, highScore)}</div>
              </div>
            </div>

            <button
              onClick={initGame}
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <RotateCcw size={18} /> try again
            </button>
          </div>
        </div>
      )}

      {/* Mobile Controls */}
      {gameState === 'playing' && (
        <div className="absolute bottom-4 right-4 grid grid-cols-3 gap-2 z-20 md:hidden">
          <div></div>
          <button onTouchStart={() => movePlayer(0, -1)} className="bg-white/80 p-4 rounded-lg shadow-lg active:scale-95">⬆️</button>
          <div></div>
          <button onTouchStart={() => movePlayer(-1, 0)} className="bg-white/80 p-4 rounded-lg shadow-lg active:scale-95">⬅️</button>
          <div></div>
          <button onTouchStart={() => movePlayer(1, 0)} className="bg-white/80 p-4 rounded-lg shadow-lg active:scale-95">➡️</button>
          <div></div>
          <button onTouchStart={() => movePlayer(0, 1)} className="bg-white/80 p-4 rounded-lg shadow-lg active:scale-95">⬇️</button>
          <div></div>
        </div>
      )}

      {/* Legend */}
      {gameState === 'playing' && (
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur p-3 rounded-lg shadow-lg text-xs z-20">
          <div className="font-bold mb-2">LEGEND:</div>
          <div className="flex gap-2 items-center mb-1">
            <span className="w-4 h-4 bg-red-500 rounded"></span> BUG (avoid)
          </div>
          <div className="flex gap-2 items-center mb-1">
            <span className="w-4 h-4 bg-purple-500 rounded"></span> MEETING (avoid)
          </div>
          <div className="flex gap-2 items-center mb-1">
            <span className="w-4 h-4 bg-orange-500 rounded"></span> DEADLINE (avoid)
          </div>
          <div className="flex gap-2 items-center mb-1">
            <span className="w-4 h-4 bg-green-500 rounded"></span> COFFEE (+5)
          </div>
          <div className="flex gap-2 items-center">
            <span className="w-4 h-4 bg-blue-500 rounded"></span> SKILL (+1)
          </div>
        </div>
      )}
    </div>
  );
}
