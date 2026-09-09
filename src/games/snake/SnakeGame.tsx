import { useEffect, useRef, useCallback, useState } from 'react';
import { InputManager } from '../../engine/InputManager';
import { TouchControls } from '../../components/game/TouchControls';
import { usePlayerStore } from '../../stores/playerStore';
import type { GameComponentProps, GameResult } from '../../types/game';

// ============================================================
// Snake Game — Canvas-based, 60fps, responsive with customization
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

  const baseSpeed = mode === 'speed' ? 95 : 150;
  const speedIncrease = mode === 'speed' ? 3 : 2;

  const gameState = useRef({
    snake: [{ x: 10, y: 10 }] as Point[],
    food: { x: 15, y: 10 } as Point,
    direction: 'RIGHT' as Direction,
    nextDirection: 'RIGHT' as Direction,
    score: 0,
    speed: baseSpeed,
    gameStarted: false,
    gameOver: false,
    startTime: 0,
    moves: 0,
  });

  const tickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrame = useRef<number>(0);
  const [started, setStarted] = useState(false);

  const spawnFood = useCallback(() => {
    const state = gameState.current;
    let food: Point;
    do {
      food = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (state.snake.some((s) => s.x === food.x && s.y === food.y));
    state.food = food;
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
      data: { length: state.snake.length },
      timestamp: Date.now(),
    };
    onGameEnd(result);
  }, [mode, onGameEnd]);

  const tick = useCallback(() => {
    const state = gameState.current;
    if (state.gameOver || isPaused) return;

    state.direction = state.nextDirection;
    const head = { ...state.snake[0] };

    switch (state.direction) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      endGame();
      return;
    }

    // Self collision
    if (state.snake.some((s) => s.x === head.x && s.y === head.y)) {
      endGame();
      return;
    }

    state.snake.unshift(head);
    state.moves++;

    // Food collision
    if (head.x === state.food.x && head.y === state.food.y) {
      state.score += 10;
      state.speed = Math.max(40, state.speed - speedIncrease);
      onScoreUpdate(state.score);
      spawnFood();
    } else {
      state.snake.pop();
    }

    tickTimer.current = setTimeout(tick, state.speed);
  }, [isPaused, endGame, onScoreUpdate, spawnFood, speedIncrease]);

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

    // Food
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(
      state.food.x * CELL_SIZE + CELL_SIZE / 2,
      state.food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0; // reset shadow

    // Snake with custom colors, skins, and eyes
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
    state.nextDirection = 'RIGHT';
    state.score = 0;
    state.speed = baseSpeed;
    state.gameOver = false;
    state.startTime = Date.now();
    state.moves = 0;
    spawnFood();
    onGameStart();
    onScoreUpdate(0);
    setStarted(true);
    tick();
    render();
  }, [baseSpeed, spawnFood, onGameStart, onScoreUpdate, tick, render]);

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
      if (newDir && opposite[newDir] !== state.direction) {
        state.nextDirection = newDir;
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

  return (
    <div>
      <div className="game-canvas-container" style={{ maxWidth: CANVAS_W, aspectRatio: '1 / 1' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="rounded-xl border border-border-default shadow-lg"
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

