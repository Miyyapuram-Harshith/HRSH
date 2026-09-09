import { useEffect, useRef, useCallback, useState } from 'react';
import { InputManager } from '../../engine/InputManager';
import { TouchControls } from '../../components/game/TouchControls';
import { usePlayerStore } from '../../stores/playerStore';
import type { GameComponentProps, GameResult } from '../../types/game';

// ============================================================
// Snake Game 2.0 — Input buffering, modifiers, curves
// ============================================================

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const CANVAS_W = GRID_SIZE * CELL_SIZE;
const CANVAS_H = GRID_SIZE * CELL_SIZE;

interface Point {
  x: number;
  y: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

type Modifier = 'WRAP' | 'NO_WALLS' | 'DOUBLE_FOOD';
type SpeedSetting = 'SLOW' | 'NORMAL' | 'FAST' | 'INSANE' | 'PROGRESSIVE';

function getSpeedMs(speed: SpeedSetting, moves: number): number {
    switch (speed) {
        case 'SLOW': return 200;
        case 'NORMAL': return 150;
        case 'FAST': return 100;
        case 'INSANE': return 60;
        case 'PROGRESSIVE': return Math.max(50, 180 - (moves * 0.5));
    }
}

function SnakeGame({ mode, onGameStart, onGameEnd, onScoreUpdate, isPaused }: GameComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings } = usePlayerStore();
  
  const savedCustomization = (settings as any)?.customizations?.snake || {};
  const primaryColor = savedCustomization.primaryColor || '#22c55e';
  const secondaryColor = savedCustomization.secondaryColor || '#16a34a';
  const skin = savedCustomization.skin || 'classic';
  const eyeStyle = savedCustomization.eyeStyle || 'cute';
  const headStyle = savedCustomization.headStyle || 'rounded';
  const trail = savedCustomization.trail || 'none';

  const [activeModifiers, setActiveModifiers] = useState<Modifier[]>([]);
  const [speedSetting, setSpeedSetting] = useState<SpeedSetting>('NORMAL');

  const gameState = useRef({
    snake: [{ x: 10, y: 10 }] as Point[],
    food: { x: 15, y: 10 } as Point,
    food2: null as Point | null,
    direction: 'RIGHT' as Direction,
    inputBuffer: [] as Direction[],
    score: 0,
    gameStarted: false,
    gameOver: false,
    startTime: 0,
    moves: 0,
    wrapped: false,
  });

  const tickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrame = useRef<number>(0);
  const [started, setStarted] = useState(false);

  const spawnFood = useCallback((isSecond = false) => {
    const state = gameState.current;
    let food: Point;
    do {
      food = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
        state.snake.some((s) => s.x === food.x && s.y === food.y) || 
        (state.food && state.food.x === food.x && state.food.y === food.y) ||
        (state.food2 && state.food2.x === food.x && state.food2.y === food.y)
    );
    if (isSecond) state.food2 = food;
    else state.food = food;
  }, []);

  const endGame = useCallback(() => {
    const state = gameState.current;
    state.gameOver = true;
    if (tickTimer.current) clearTimeout(tickTimer.current);
    const result: GameResult = {
      gameId: 'snake',
      mode: mode || 'classic',
      score: state.score,
      won: state.score > 0,
      duration: Date.now() - state.startTime,
      moves: state.moves,
      personalBest: false,
      data: { length: state.snake.length, wrapped: state.wrapped, modifiers: activeModifiers, speed: speedSetting },
      timestamp: Date.now(),
    };
    onGameEnd(result);
  }, [mode, onGameEnd, activeModifiers, speedSetting]);

  const tick = useCallback(() => {
    const state = gameState.current;
    if (state.gameOver || isPaused) return;

    // Input buffer logic
    if (state.inputBuffer.length > 0) {
        state.direction = state.inputBuffer.shift()!;
    }

    const head = { ...state.snake[0] };

    switch (state.direction) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    // Wrap / Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        if (activeModifiers.includes('WRAP') || activeModifiers.includes('NO_WALLS')) {
            if (head.x < 0) head.x = GRID_SIZE - 1;
            if (head.x >= GRID_SIZE) head.x = 0;
            if (head.y < 0) head.y = GRID_SIZE - 1;
            if (head.y >= GRID_SIZE) head.y = 0;
            state.wrapped = true;
        } else {
            endGame();
            return;
        }
    }

    // Self collision
    if (state.snake.some((s) => s.x === head.x && s.y === head.y)) {
      endGame();
      return;
    }

    state.snake.unshift(head);
    state.moves++;

    // Food collision
    let ate = false;
    if (head.x === state.food.x && head.y === state.food.y) {
      state.score += 10;
      ate = true;
      spawnFood(false);
    } else if (state.food2 && head.x === state.food2.x && head.y === state.food2.y) {
      state.score += 10;
      ate = true;
      spawnFood(true);
    }

    if (ate) {
        onScoreUpdate(state.score);
    } else {
      state.snake.pop();
    }

    tickTimer.current = setTimeout(tick, getSpeedMs(speedSetting, state.moves));
  }, [isPaused, endGame, onScoreUpdate, spawnFood, activeModifiers, speedSetting]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = gameState.current;

    // Background
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Subtle Grid
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_W, i * CELL_SIZE);
      ctx.stroke();
    }

    const drawFood = (food: Point, color: string) => {
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(
          food.x * CELL_SIZE + CELL_SIZE / 2,
          food.y * CELL_SIZE + CELL_SIZE / 2,
          CELL_SIZE / 2 - 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;
    };

    if (state.food) drawFood(state.food, '#ef4444');
    if (state.food2) drawFood(state.food2, '#eab308'); // Golden second food

    // Snake
    state.snake.forEach((segment, i) => {
      const isHead = i === 0;
      const x = segment.x * CELL_SIZE;
      const y = segment.y * CELL_SIZE;

      ctx.fillStyle = isHead ? primaryColor : secondaryColor;

      if (trail === 'glow' || skin === 'neon') {
        ctx.shadowColor = isHead ? primaryColor : secondaryColor;
        ctx.shadowBlur = isHead ? 10 : 6;
      }

      const padding = isHead ? 1 : 2;
      const radius = headStyle === 'square' ? 1 : isHead ? 5 : 3;

      ctx.beginPath();
      ctx.roundRect(
        x + padding,
        y + padding,
        CELL_SIZE - padding * 2,
        CELL_SIZE - padding * 2,
        radius
      );
      ctx.fill();

      // Border accents for cyber or galaxy skins
      if (skin === 'cyber') {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (skin === 'galaxy') {
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Render Eyes on Head
      if (isHead) {
        ctx.fillStyle = eyeStyle === 'glow' ? '#38bdf8' : eyeStyle === 'slits' ? '#f59e0b' : '#ffffff';
        ctx.shadowBlur = eyeStyle === 'glow' ? 4 : 0;
        
        let eyeOffset1 = { x: 5, y: 5 };
        let eyeOffset2 = { x: 13, y: 5 };

        if (state.direction === 'DOWN') {
          eyeOffset1 = { x: 5, y: 13 };
          eyeOffset2 = { x: 13, y: 13 };
        } else if (state.direction === 'LEFT') {
          eyeOffset1 = { x: 5, y: 5 };
          eyeOffset2 = { x: 5, y: 13 };
        } else if (state.direction === 'RIGHT') {
          eyeOffset1 = { x: 13, y: 5 };
          eyeOffset2 = { x: 13, y: 13 };
        }

        const eyeRadius = eyeStyle === 'slits' ? 1 : 1.5;

        ctx.beginPath();
        ctx.arc(x + eyeOffset1.x, y + eyeOffset1.y, eyeRadius, 0, Math.PI * 2);
        ctx.arc(x + eyeOffset2.x, y + eyeOffset2.y, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
    });

    // Game Over overlay
    if (state.gameOver) {
      ctx.fillStyle = 'rgba(9, 9, 11, 0.7)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    animFrame.current = requestAnimationFrame(render);
  }, [primaryColor, secondaryColor, skin, eyeStyle, headStyle, trail]);

  const startGameLoop = useCallback(() => {
    const state = gameState.current;
    state.snake = [{ x: 10, y: 10 }];
    state.direction = 'RIGHT';
    state.inputBuffer = [];
    state.score = 0;
    state.gameOver = false;
    state.startTime = Date.now();
    state.moves = 0;
    state.wrapped = false;
    spawnFood();
    if (activeModifiers.includes('DOUBLE_FOOD')) spawnFood(true);
    else state.food2 = null;

    onGameStart();
    onScoreUpdate(0);
    setStarted(true);
    tick();
    render();
  }, [spawnFood, onGameStart, onScoreUpdate, tick, render, activeModifiers]);

  // Input handling
  useEffect(() => {
    const unsubscribe = InputManager.subscribe((event) => {
      const state = gameState.current;
      if (!state.gameStarted && !started) return;
      if (state.gameOver) return;

      const opposite: Record<Direction, Direction> = {
        UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT',
      };

      const dirMap: Record<string, Direction> = {
        MOVE_UP: 'UP', MOVE_DOWN: 'DOWN', MOVE_LEFT: 'LEFT', MOVE_RIGHT: 'RIGHT',
      };

      const newDir = dirMap[event.action];
      if (newDir) {
          // Buffer input to prevent self-collision from rapid double presses
          const lastDir = state.inputBuffer.length > 0 
            ? state.inputBuffer[state.inputBuffer.length - 1] 
            : state.direction;

          if (opposite[newDir] !== lastDir && newDir !== lastDir) {
            state.inputBuffer.push(newDir);
          }
      }
    });

    InputManager.start();
    return () => {
      unsubscribe();
      InputManager.stop();
    };
  }, [started]);

  // Pause/resume
  useEffect(() => {
    if (isPaused) {
      if (tickTimer.current) clearTimeout(tickTimer.current);
    } else if (started && !gameState.current.gameOver) {
      tick();
    }
  }, [isPaused, started, tick]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (tickTimer.current) clearTimeout(tickTimer.current);
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, []);

  const toggleModifier = (mod: Modifier) => {
      setActiveModifiers(prev => prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]);
  };

  return (
    <div>
      {/* Settings Overlay for Solo mode */}
      {!started && (
          <div className="mb-4 space-y-4">
              <div className="flex flex-wrap justify-center gap-2">
                  {(['SLOW', 'NORMAL', 'FAST', 'INSANE', 'PROGRESSIVE'] as SpeedSetting[]).map(s => (
                       <button
                       key={s}
                       onClick={() => setSpeedSetting(s)}
                       className={`px-3 py-1 rounded-full text-xs font-bold transition-colors border ${speedSetting === s ? 'bg-hrsh-accent text-white border-hrsh-accent' : 'bg-transparent text-text-muted border-border-default hover:text-text-primary'}`}
                     >
                         {s}
                     </button>
                  ))}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                  {(['WRAP', 'DOUBLE_FOOD'] as Modifier[]).map(m => (
                       <button
                       key={m}
                       onClick={() => toggleModifier(m)}
                       className={`px-3 py-1 rounded-full text-xs font-bold transition-colors border ${activeModifiers.includes(m) ? 'bg-purple-500 text-white border-purple-500' : 'bg-transparent text-text-muted border-border-default hover:text-text-primary'}`}
                     >
                         {m.replace('_', ' ')}
                     </button>
                  ))}
              </div>
          </div>
      )}

      <div className="game-canvas-container relative select-none" style={{ maxWidth: CANVAS_W, aspectRatio: '1 / 1', touchAction: 'none', overscrollBehavior: 'none' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className={`rounded-xl border shadow-lg ${activeModifiers.includes('WRAP') ? 'border-purple-500/50 shadow-purple-500/20' : 'border-border-default'}`}
          style={{ imageRendering: 'auto' }}
        />

        {/* Start overlay */}
        {!started && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-base/60 backdrop-blur-sm rounded-xl">
            <button
              onClick={startGameLoop}
              className="px-8 py-3 bg-status-success hover:bg-status-success/90 text-white font-semibold rounded-xl text-sm transition-all active:scale-[0.97] shadow-lg shadow-status-success/20"
              autoFocus
            >
              Start Game
            </button>
          </div>
        )}
      </div>

      {started && <TouchControls type="dpad" />}

      {/* Controls hint */}
      <div className="hidden lg:block mt-3 text-center text-text-muted text-xs">
        Arrow keys or WASD to move
      </div>
    </div>
  );
}

export default SnakeGame;
