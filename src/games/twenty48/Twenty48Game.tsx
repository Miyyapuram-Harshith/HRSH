import { useState, useCallback, useEffect, useRef } from 'react';
import { InputManager } from '../../engine/InputManager';
import type { GameComponentProps, GameResult } from '../../types/game';

// ============================================================
// 2048 Game
// ============================================================

type Board = number[][];

const SIZE = 4;

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: '#27272a', text: 'transparent' },
  2: { bg: '#3f3f46', text: '#fafafa' },
  4: { bg: '#52525b', text: '#fafafa' },
  8: { bg: '#f97316', text: '#ffffff' },
  16: { bg: '#ea580c', text: '#ffffff' },
  32: { bg: '#ef4444', text: '#ffffff' },
  64: { bg: '#dc2626', text: '#ffffff' },
  128: { bg: '#f59e0b', text: '#ffffff' },
  256: { bg: '#eab308', text: '#ffffff' },
  512: { bg: '#84cc16', text: '#ffffff' },
  1024: { bg: '#22c55e', text: '#ffffff' },
  2048: { bg: '#3b82f6', text: '#ffffff' },
  4096: { bg: '#8b5cf6', text: '#ffffff' },
  8192: { bg: '#ec4899', text: '#ffffff' },
};

function createEmptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function addRandomTile(board: Board): Board {
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newBoard = board.map((row) => [...row]);
  newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newBoard;
}

function slideRow(row: number[]): { row: number[]; score: number } {
  const filtered = row.filter((v) => v !== 0);
  let score = 0;
  const merged: number[] = [];
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const val = filtered[i] * 2;
      merged.push(val);
      score += val;
      i += 2;
    } else {
      merged.push(filtered[i]);
      i++;
    }
  }
  while (merged.length < SIZE) merged.push(0);
  return { row: merged, score };
}

function moveBoard(board: Board, direction: string): { board: Board; score: number; moved: boolean } {
  let totalScore = 0;
  let moved = false;
  const newBoard = createEmptyBoard();

  const getLine = (i: number): number[] => {
    switch (direction) {
      case 'LEFT': return board[i].slice();
      case 'RIGHT': return board[i].slice().reverse();
      case 'UP': return board.map((row) => row[i]);
      case 'DOWN': return board.map((row) => row[i]).reverse();
      default: return [];
    }
  };

  const setLine = (i: number, line: number[]) => {
    switch (direction) {
      case 'LEFT': newBoard[i] = line; break;
      case 'RIGHT': newBoard[i] = line.reverse(); break;
      case 'UP': line.forEach((v, r) => { newBoard[r][i] = v; }); break;
      case 'DOWN': line.reverse().forEach((v, r) => { newBoard[r][i] = v; }); break;
    }
  };

  for (let i = 0; i < SIZE; i++) {
    const line = getLine(i);
    const { row, score } = slideRow(line);
    setLine(i, row);
    totalScore += score;
    if (!moved && line.some((v, idx) => v !== row[idx])) moved = true;
  }

  return { board: newBoard, score: totalScore, moved };
}

function canMove(board: Board): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (c + 1 < SIZE && board[r][c] === board[r][c + 1]) return true;
      if (r + 1 < SIZE && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

function getBestTile(board: Board): number {
  return Math.max(...board.flat());
}

function Twenty48Game({ onGameStart, onGameEnd, onScoreUpdate, isPaused }: GameComponentProps) {
  const [board, setBoard] = useState<Board>(() => {
    let b = createEmptyBoard();
    b = addRandomTile(b);
    b = addRandomTile(b);
    return b;
  });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [started, setStarted] = useState(false);
  const moves = useRef(0);
  const startTime = useRef(0);

  const handleMove = useCallback((direction: string) => {
    if (gameOver || isPaused) return;

    if (!started) {
      setStarted(true);
      startTime.current = Date.now();
      onGameStart();
    }

    const result = moveBoard(board, direction);
    if (!result.moved) return;

    moves.current++;
    const newScore = score + result.score;
    let newBoard = addRandomTile(result.board);

    setBoard(newBoard);
    setScore(newScore);
    onScoreUpdate(newScore);

    // Check win
    if (!won && getBestTile(newBoard) >= 2048) {
      setWon(true);
    }

    // Check game over
    if (!canMove(newBoard)) {
      setGameOver(true);
      const gameResult: GameResult = {
        gameId: '2048',
        mode: 'classic',
        score: newScore,
        won: getBestTile(newBoard) >= 2048,
        duration: Date.now() - startTime.current,
        moves: moves.current,
        personalBest: false,
        data: { bestTile: getBestTile(newBoard) },
        timestamp: Date.now(),
      };
      onGameEnd(gameResult);
    }
  }, [board, score, gameOver, won, isPaused, started, onGameStart, onGameEnd, onScoreUpdate]);

  // Input
  useEffect(() => {
    const dirMap: Record<string, string> = {
      MOVE_UP: 'UP', MOVE_DOWN: 'DOWN', MOVE_LEFT: 'LEFT', MOVE_RIGHT: 'RIGHT',
    };

    const unsubscribe = InputManager.subscribe((event) => {
      const dir = dirMap[event.action];
      if (dir) handleMove(dir);
    });

    InputManager.start();
    return () => { unsubscribe(); InputManager.stop(); };
  }, [handleMove]);

  // Swipe support
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const MIN_SWIPE = 30;

    if (Math.max(absDx, absDy) < MIN_SWIPE) return;

    if (absDx > absDy) {
      handleMove(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      handleMove(dy > 0 ? 'DOWN' : 'UP');
    }
    touchStart.current = null;
  };

  const getTileStyle = (value: number) => {
    const colors = TILE_COLORS[value] || TILE_COLORS[8192] || { bg: '#ec4899', text: '#fff' };
    const fontSize = value >= 1024 ? 'text-base' : value >= 128 ? 'text-lg' : 'text-xl';
    return { colors, fontSize };
  };

  return (
    <div>
      {/* Score */}
      <div className="flex justify-center mb-4">
        <div className="bg-surface-raised border border-border-default rounded-xl px-6 py-2 text-center">
          <div className="text-xs text-text-muted">Score</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-400">{score.toLocaleString()}</div>
        </div>
      </div>

      {/* Board */}
      <div
        className="w-full max-w-[360px] mx-auto select-none touch-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bg-surface-raised border border-border-default rounded-xl p-2.5">
          <div className="grid grid-cols-4 gap-2">
            {board.flat().map((value, i) => {
              const { colors, fontSize } = getTileStyle(value);
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-lg flex items-center justify-center font-bold ${fontSize} transition-all duration-100`}
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  {value > 0 ? value : ''}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Controls hint */}
      <div className="mt-3 text-center text-text-muted text-xs">
        <span className="hidden lg:inline">Arrow keys to slide tiles</span>
        <span className="lg:hidden">Swipe to slide tiles</span>
      </div>
    </div>
  );
}

export default Twenty48Game;
