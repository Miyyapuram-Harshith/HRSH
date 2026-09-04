import { useState, useCallback, useRef } from 'react';
import type { GameComponentProps, GameResult } from '../../types/game';

// ============================================================
// Minesweeper Game
// ============================================================

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
}

const PRESETS = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
};

function createBoard(rows: number, cols: number, mines: number, safeR: number, safeC: number): Cell[][] {
  const board: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
  );

  // Place mines (not on safe cell or its neighbors)
  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (board[r][c].mine) continue;
    if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
    board[r][c].mine = true;
    placed++;
  }

  // Calculate adjacency
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) count++;
        }
      }
      board[r][c].adjacent = count;
    }
  }

  return board;
}

function floodFill(board: Cell[][], r: number, c: number, rows: number, cols: number): Cell[][] {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  const queue: [number, number][] = [[r, c]];

  while (queue.length > 0) {
    const [cr, cc] = queue.shift()!;
    if (cr < 0 || cr >= rows || cc < 0 || cc >= cols) continue;
    if (newBoard[cr][cc].revealed || newBoard[cr][cc].flagged) continue;

    newBoard[cr][cc].revealed = true;
    if (newBoard[cr][cc].adjacent === 0 && !newBoard[cr][cc].mine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) queue.push([cr + dr, cc + dc]);
        }
      }
    }
  }

  return newBoard;
}

function MinesweeperGame({ onGameStart, onGameEnd, onScoreUpdate, isPaused }: GameComponentProps) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [board, setBoard] = useState<Cell[][] | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [time, setTime] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(0);
  const started = useRef(false);
  const movesRef = useRef(0);

  const preset = PRESETS[difficulty];

  const startNewGame = useCallback(() => {
    setBoard(null);
    setGameOver(false);
    setWon(false);
    setTime(0);
    setFlagCount(0);
    started.current = false;
    movesRef.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const handleReveal = useCallback((r: number, c: number) => {
    if (gameOver || isPaused) return;

    let currentBoard = board;

    // First click — create board with safe zone
    if (!currentBoard) {
      currentBoard = createBoard(preset.rows, preset.cols, preset.mines, r, c);
      started.current = true;
      startTime.current = Date.now();
      onGameStart();
      timerRef.current = setInterval(() => {
        setTime(Math.floor((Date.now() - startTime.current) / 1000));
      }, 1000);
    }

    const cell = currentBoard[r][c];
    if (cell.revealed || cell.flagged) return;

    movesRef.current++;

    if (cell.mine) {
      // Game over — reveal all mines
      const revealedBoard = currentBoard.map((row) =>
        row.map((c) => (c.mine ? { ...c, revealed: true } : { ...c }))
      );
      setBoard(revealedBoard);
      setGameOver(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const result: GameResult = {
        gameId: 'minesweeper',
        mode: difficulty,
        score: Math.max(0, preset.mines * 100 - time * 10),
        won: false,
        duration: Date.now() - startTime.current,
        moves: movesRef.current,
        personalBest: false,
        data: { difficulty, time },
        timestamp: Date.now(),
      };
      onGameEnd(result);
      return;
    }

    // Flood fill from clicked cell
    const newBoard = floodFill(currentBoard, r, c, preset.rows, preset.cols);
    setBoard(newBoard);

    // Check win: all non-mine cells revealed
    const totalCells = preset.rows * preset.cols;
    const revealedCount = newBoard.flat().filter((c) => c.revealed).length;
    const score = revealedCount * 10;
    onScoreUpdate(score);

    if (revealedCount === totalCells - preset.mines) {
      setGameOver(true);
      setWon(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const finalScore = Math.max(100, preset.mines * 100 - time * 5);
      const result: GameResult = {
        gameId: 'minesweeper',
        mode: difficulty,
        score: finalScore,
        won: true,
        duration: Date.now() - startTime.current,
        moves: movesRef.current,
        personalBest: false,
        data: { difficulty, time },
        timestamp: Date.now(),
      };
      onGameEnd(result);
    }
  }, [board, gameOver, isPaused, preset, difficulty, time, onGameStart, onGameEnd, onScoreUpdate]);

  const handleFlag = useCallback((e: React.MouseEvent | React.TouchEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameOver || isPaused || !board) return;

    const cell = board[r][c];
    if (cell.revealed) return;

    const newBoard = board.map((row) => row.map((c) => ({ ...c })));
    newBoard[r][c].flagged = !newBoard[r][c].flagged;
    setBoard(newBoard);
    setFlagCount((prev) => newBoard[r][c].flagged ? prev + 1 : prev - 1);
  }, [board, gameOver, isPaused]);

  const getCellContent = (cell: Cell) => {
    if (cell.flagged && !cell.revealed) return '🚩';
    if (!cell.revealed) return '';
    if (cell.mine) return '💣';
    if (cell.adjacent === 0) return '';
    return cell.adjacent;
  };

  const getCellColor = (cell: Cell) => {
    if (!cell.revealed) return '';
    const colors = ['', '#3b82f6', '#22c55e', '#ef4444', '#7c3aed', '#dc2626', '#0891b2', '#000', '#71717a'];
    return colors[cell.adjacent] || '';
  };

  const isCompact = difficulty !== 'easy';

  return (
    <div>
      {/* Difficulty selector */}
      {!board && (
        <div className="flex justify-center gap-2 mb-4">
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <button
              key={d}
              onClick={() => { setDifficulty(d); startNewGame(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                difficulty === d ? 'bg-hrsh-accent text-white' : 'bg-surface-overlay text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {/* Header: mines & timer */}
      <div className="flex justify-between items-center max-w-lg mx-auto mb-3">
        <div className="flex items-center gap-2 bg-surface-raised border border-border-default rounded-lg px-3 py-1.5">
          <span className="text-sm">💣</span>
          <span className="font-mono text-sm font-bold">{preset.mines - flagCount}</span>
        </div>
        <button
          onClick={startNewGame}
          className="text-xl hover:scale-110 transition-transform"
          aria-label="New game"
        >
          {gameOver ? (won ? '😎' : '😵') : '🙂'}
        </button>
        <div className="flex items-center gap-2 bg-surface-raised border border-border-default rounded-lg px-3 py-1.5">
          <span className="text-sm">⏱</span>
          <span className="font-mono text-sm font-bold">{time}</span>
        </div>
      </div>

      {/* Board */}
      <div className={`overflow-auto mx-auto ${difficulty === 'hard' ? 'max-w-full' : 'max-w-lg'}`}>
        <div
          className="inline-grid gap-px bg-surface-overlay rounded-lg p-1 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${preset.cols}, 1fr)`,
          }}
        >
          {(board || createBoard(preset.rows, preset.cols, 0, -1, -1)).map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleReveal(r, c)}
                onContextMenu={(e) => handleFlag(e, r, c)}
                disabled={gameOver}
                className={`
                  ${isCompact ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm'}
                  flex items-center justify-center font-bold rounded-sm transition-colors select-none
                  ${cell.revealed
                    ? 'bg-surface-base'
                    : 'bg-surface-hover hover:bg-zinc-500 active:bg-surface-base cursor-pointer'
                  }
                  ${cell.mine && cell.revealed ? 'bg-red-900/50' : ''}
                `}
                style={{ color: getCellColor(cell) }}
                aria-label={`Cell ${r},${c}${cell.flagged ? ' flagged' : ''}`}
              >
                {getCellContent(cell)}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Controls hint */}
      <div className="mt-3 text-center text-text-muted text-xs">
        <span className="hidden lg:inline">Click to reveal · Right-click to flag</span>
        <span className="lg:hidden">Tap to reveal · Long-press to flag</span>
      </div>
    </div>
  );
}

export default MinesweeperGame;
