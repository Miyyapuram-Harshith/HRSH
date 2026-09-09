import { useState, useCallback, useEffect, useRef } from 'react';
import { InputManager } from '../../engine/InputManager';
import { usePlayerStore } from '../../stores/playerStore';
import type { GameComponentProps, GameResult } from '../../types/game';

// ============================================================
// 2048 Game
// ============================================================

type Board = number[][];

const SIZE = 4;

const THEME_PALETTES: Record<string, Record<number, { bg: string; text: string }>> = {
  classic: {
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
  },
  neon: {
    0: { bg: '#09090b', text: 'transparent' },
    2: { bg: '#18181b', text: '#38bdf8' },
    4: { bg: '#27272a', text: '#818cf8' },
    8: { bg: '#0284c7', text: '#ffffff' },
    16: { bg: '#4f46e5', text: '#ffffff' },
    32: { bg: '#9333ea', text: '#ffffff' },
    64: { bg: '#c026d3', text: '#ffffff' },
    128: { bg: '#db2777', text: '#ffffff' },
    256: { bg: '#e11d48', text: '#ffffff' },
    512: { bg: '#059669', text: '#ffffff' },
    1024: { bg: '#0d9488', text: '#ffffff' },
    2048: { bg: '#06b6d4', text: '#ffffff' },
    4096: { bg: '#6366f1', text: '#ffffff' },
    8192: { bg: '#d946ef', text: '#ffffff' },
  },
  pastel: {
    0: { bg: '#27272a', text: 'transparent' },
    2: { bg: '#fbcfe8', text: '#831843' },
    4: { bg: '#fde68a', text: '#78350f' },
    8: { bg: '#fed7aa', text: '#7c2d12' },
    16: { bg: '#fecdd3', text: '#881337' },
    32: { bg: '#ddd6fe', text: '#4c1d95' },
    64: { bg: '#c7d2fe', text: '#1e1b4b' },
    128: { bg: '#bae6fd', text: '#0c4a6e' },
    256: { bg: '#a7f3d0', text: '#064e3b' },
    512: { bg: '#bbf7d0', text: '#14532d' },
    1024: { bg: '#fef08a', text: '#713f12' },
    2048: { bg: '#f472b6', text: '#ffffff' },
    4096: { bg: '#a855f7', text: '#ffffff' },
    8192: { bg: '#38bdf8', text: '#ffffff' },
  },
  synthwave: {
    0: { bg: '#180828', text: 'transparent' },
    2: { bg: '#2d124d', text: '#ff71ce' },
    4: { bg: '#3d1868', text: '#01cdfe' },
    8: { bg: '#05ffa1', text: '#051124' },
    16: { bg: '#b967ff', text: '#ffffff' },
    32: { bg: '#ff71ce', text: '#ffffff' },
    64: { bg: '#01cdfe', text: '#ffffff' },
    128: { bg: '#fffb96', text: '#2d124d' },
    256: { bg: '#ff598f', text: '#ffffff' },
    512: { bg: '#fd8a5e', text: '#ffffff' },
    1024: { bg: '#e036a7', text: '#ffffff' },
    2048: { bg: '#7928ca', text: '#ffffff' },
    4096: { bg: '#ff0080', text: '#ffffff' },
    8192: { bg: '#00dfd8', text: '#000000' },
  },
  emerald: {
    0: { bg: '#062817', text: 'transparent' },
    2: { bg: '#064e3b', text: '#a7f3d0' },
    4: { bg: '#065f46', text: '#d1fae5' },
    8: { bg: '#047857', text: '#ecfdf5' },
    16: { bg: '#059669', text: '#ffffff' },
    32: { bg: '#10b981', text: '#ffffff' },
    64: { bg: '#34d399', text: '#064e3b' },
    128: { bg: '#14b8a6', text: '#ffffff' },
    256: { bg: '#0d9488', text: '#ffffff' },
    512: { bg: '#0f766e', text: '#ffffff' },
    1024: { bg: '#047857', text: '#ffffff' },
    2048: { bg: '#10b981', text: '#ffffff' },
    4096: { bg: '#22c55e', text: '#ffffff' },
    8192: { bg: '#84cc16', text: '#ffffff' },
  },
  dark: {
    0: { bg: '#121212', text: 'transparent' },
    2: { bg: '#1e1e1e', text: '#e0e0e0' },
    4: { bg: '#2c2c2c', text: '#e0e0e0' },
    8: { bg: '#3a3a3a', text: '#ffffff' },
    16: { bg: '#484848', text: '#ffffff' },
    32: { bg: '#565656', text: '#ffffff' },
    64: { bg: '#646464', text: '#ffffff' },
    128: { bg: '#727272', text: '#ffffff' },
    256: { bg: '#808080', text: '#ffffff' },
    512: { bg: '#8e8e8e', text: '#ffffff' },
    1024: { bg: '#9c9c9c', text: '#000000' },
    2048: { bg: '#ffffff', text: '#000000' },
    4096: { bg: '#f59e0b', text: '#000000' },
    8192: { bg: '#ef4444', text: '#ffffff' },
  }
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

function slideRow(row: number[]): { row: number[]; score: number; maxMerged: number } {
  const filtered = row.filter((v) => v !== 0);
  let score = 0;
  let maxMerged = 0;
  const merged: number[] = [];
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const val = filtered[i] * 2;
      merged.push(val);
      score += val;
      if (val > maxMerged) maxMerged = val;
      i += 2;
    } else {
      merged.push(filtered[i]);
      i++;
    }
  }
  while (merged.length < SIZE) merged.push(0);
  return { row: merged, score, maxMerged };
}

function moveBoard(board: Board, direction: string): { board: Board; score: number; moved: boolean; maxMerged: number } {
  let totalScore = 0;
  let moved = false;
  let highestMerge = 0;
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
    const { row, score, maxMerged } = slideRow(line);
    setLine(i, row);
    totalScore += score;
    if (maxMerged > highestMerge) highestMerge = maxMerged;
    if (!moved && line.some((v, idx) => v !== row[idx])) moved = true;
  }

  return { board: newBoard, score: totalScore, moved, maxMerged: highestMerge };
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
  const { settings } = usePlayerStore();
  const customization = (settings as any)?.customizations?.['2048'] || {};
  const theme = customization.theme || 'classic';
  const tileShape = customization.tileShape || 'rounded';
  const tilePalette = THEME_PALETTES[theme] || THEME_PALETTES.classic;

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
  const [liveEvent, setLiveEvent] = useState<string | null>(null);
  const moves = useRef(0);
  const startTime = useRef(0);
  const sessionHighestMerge = useRef(0);

  const handleMove = useCallback((direction: string) => {
    if (gameOver || isPaused) return;

    if (!started) {
      setStarted(true);
      startTime.current = Date.now();
      onGameStart();
    }

    const result = moveBoard(board, direction);
    if (!result.moved) return;

    if (result.maxMerged > sessionHighestMerge.current) {
        sessionHighestMerge.current = result.maxMerged;
    }

    if (result.maxMerged >= 1024) {
        setLiveEvent(`GIANT MERGE: ${result.maxMerged}!`);
        setTimeout(() => setLiveEvent(null), 3000);
    }

    moves.current++;
    const newScore = score + result.score;
    let newBoard = addRandomTile(result.board);

    setBoard(newBoard);
    setScore(newScore);
    onScoreUpdate(newScore);

    // Check win
    if (!won && getBestTile(newBoard) >= 2048) {
      setWon(true);
      setLiveEvent("2048 HAS BEEN SUMMONED");
      setTimeout(() => setLiveEvent(null), 4000);
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
        data: { bestTile: getBestTile(newBoard), highestMerge: sessionHighestMerge.current },
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
    const colors = tilePalette[value] || tilePalette[8192] || { bg: '#ec4899', text: '#fff' };
    const fontSize = value >= 1024 ? 'text-base' : value >= 128 ? 'text-lg' : 'text-xl';
    return { colors, fontSize };
  };

  const roundedClass = tileShape === 'pill' ? 'rounded-2xl' : tileShape === 'square' ? 'rounded-xs' : 'rounded-lg';

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
      <div className="relative">
          {liveEvent && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-hrsh-accent text-white px-4 py-1 rounded-full font-black text-xl animate-bounce shadow-xl z-10 whitespace-nowrap">
                  {liveEvent}
              </div>
          )}
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
                  className={`aspect-square ${roundedClass} flex items-center justify-center font-bold ${fontSize} transition-all duration-100 ${
                    customization.animations !== false ? 'hover:scale-[1.02]' : ''
                  }`}
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                    boxShadow: theme === 'neon' && value >= 128 ? `0 0 10px ${colors.bg}` : undefined
                  }}
                >
                  {value > 0 ? value : ''}
                </div>
              );
            })}
          </div>
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
