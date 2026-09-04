import { useEffect, useRef, useCallback, useState } from 'react';
import { InputManager } from '../../engine/InputManager';
import { TouchControls } from '../../components/game/TouchControls';
import type { GameComponentProps, GameResult } from '../../types/game';

// ============================================================
// Snake Game — Canvas-based, 60fps, responsive
// ============================================================

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const CANVAS_W = GRID_SIZE * CELL_SIZE;
const CANVAS_H = GRID_SIZE * CELL_SIZE;
const INITIAL_SPEED = 150; // ms per tick
const SPEED_INCREASE = 2; // ms faster per food eaten

interface Point {
  x: number;
  y: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

function SnakeGame({ onGameStart, onGameEnd, onScoreUpdate, isPaused }: GameComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameState = useRef({
    snake: [{ x: 10, y: 10 }] as Point[],
    food: { x: 15, y: 10 } as Point,
    direction: 'RIGHT' as Direction,
    nextDirection: 'RIGHT' as Direction,
    score: 0,
    speed: INITIAL_SPEED,
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
      mode: 'classic',
      score: state.score,
      won: state.score > 0,
      duration: Date.now() - state.startTime,
      moves: state.moves,
      personalBest: false,
      data: { length: state.snake.length },
      timestamp: Date.now(),
    };
    onGameEnd(result);
  }, [onGameEnd]);

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
      state.speed = Math.max(50, state.speed - SPEED_INCREASE);
      onScoreUpdate(state.score);
      spawnFood();
    } else {
      state.snake.pop();
    }

    tickTimer.current = setTimeout(tick, state.speed);
  }, [isPaused, endGame, onScoreUpdate, spawnFood]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = gameState.current;

    // Background
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid lines (subtle)
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
    ctx.beginPath();
    ctx.arc(
      state.food.x * CELL_SIZE + CELL_SIZE / 2,
      state.food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Snake
    state.snake.forEach((segment, i) => {
      const isHead = i === 0;
      ctx.fillStyle = isHead ? '#22c55e' : '#16a34a';
      const padding = isHead ? 1 : 2;
      ctx.beginPath();
      ctx.roundRect(
        segment.x * CELL_SIZE + padding,
        segment.y * CELL_SIZE + padding,
        CELL_SIZE - padding * 2,
        CELL_SIZE - padding * 2,
        isHead ? 4 : 3
      );
      ctx.fill();
    });

    // Game Over overlay
    if (state.gameOver) {
      ctx.fillStyle = 'rgba(9, 9, 11, 0.7)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    animFrame.current = requestAnimationFrame(render);
  }, []);

  const startGameLoop = useCallback(() => {
    const state = gameState.current;
    state.snake = [{ x: 10, y: 10 }];
    state.direction = 'RIGHT';
    state.nextDirection = 'RIGHT';
    state.score = 0;
    state.speed = INITIAL_SPEED;
    state.gameOver = false;
    state.startTime = Date.now();
    state.moves = 0;
    spawnFood();
    onGameStart();
    onScoreUpdate(0);
    setStarted(true);
    tick();
    render();
  }, [spawnFood, onGameStart, onScoreUpdate, tick, render]);

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
          className="rounded-xl border border-border-default"
          style={{ imageRendering: 'auto' }}
        />

        {/* Start overlay */}
        {!started && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-base/60 backdrop-blur-sm rounded-xl">
            <button
              onClick={startGameLoop}
              className="px-8 py-3 bg-status-success hover:bg-status-success/90 text-white font-semibold rounded-xl text-sm transition-all active:scale-[0.97]"
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
