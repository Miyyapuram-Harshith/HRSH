import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameComponentProps, GameResult } from '../../types/game';

// ============================================================
// Sudoku Game
// ============================================================

type SudokuBoard = (number | null)[][];
type Notes = Set<number>[][];

// Simple Sudoku generator
function generateSudoku(difficulty: 'easy' | 'medium' | 'hard'): { puzzle: SudokuBoard; solution: SudokuBoard } {
  // Create a valid completed board using backtracking
  const board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));

  function isValid(board: number[][], r: number, c: number, num: number): boolean {
    for (let i = 0; i < 9; i++) {
      if (board[r][i] === num || board[i][c] === num) return false;
    }
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    for (let i = br; i < br + 3; i++) {
      for (let j = bc; j < bc + 3; j++) {
        if (board[i][j] === num) return false;
      }
    }
    return true;
  }

  function solve(board: number[][]): boolean {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          for (const num of nums) {
            if (isValid(board, r, c, num)) {
              board[r][c] = num;
              if (solve(board)) return true;
              board[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  solve(board);
  const solution = board.map((r) => [...r]);

  // Remove cells based on difficulty
  const removeCount = { easy: 36, medium: 46, hard: 54 }[difficulty];
  const puzzle: SudokuBoard = board.map((r) => r.map((v) => v as number | null));
  let removed = 0;
  const positions = Array.from({ length: 81 }, (_, i) => i).sort(() => Math.random() - 0.5);

  for (const pos of positions) {
    if (removed >= removeCount) break;
    const r = Math.floor(pos / 9), c = pos % 9;
    if (puzzle[r][c] !== null) {
      puzzle[r][c] = null;
      removed++;
    }
  }

  return { puzzle, solution };
}

function SudokuGame({ onGameStart, onGameEnd, onScoreUpdate, isPaused }: GameComponentProps) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [puzzle, setPuzzle] = useState<SudokuBoard | null>(null);
  const [solution, setSolution] = useState<SudokuBoard | null>(null);
  const [board, setBoard] = useState<SudokuBoard | null>(null);
  const [notes, setNotes] = useState<Notes | null>(null);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [noteMode, setNoteMode] = useState(false);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [time, setTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(0);
  const movesRef = useRef(0);

  const startNewGame = useCallback((diff: 'easy' | 'medium' | 'hard') => {
    const { puzzle: p, solution: s } = generateSudoku(diff);
    setPuzzle(p);
    setSolution(s);
    setBoard(p.map((r) => [...r]));
    setNotes(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set<number>())));
    setSelected(null);
    setErrors(new Set());
    setTime(0);
    setGameOver(false);
    setDifficulty(diff);
    movesRef.current = 0;
    startTime.current = Date.now();
    onGameStart();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTime(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
  }, [onGameStart]);

  const handleCellClick = (r: number, c: number) => {
    if (gameOver || isPaused) return;
    setSelected([r, c]);
  };

  const handleNumberInput = useCallback((num: number) => {
    if (!selected || !board || !puzzle || !solution || gameOver || isPaused) return;
    const [r, c] = selected;

    // Can't modify original puzzle cells
    if (puzzle[r][c] !== null) return;

    if (noteMode && notes) {
      const newNotes = notes.map((row) => row.map((s) => new Set(s)));
      if (newNotes[r][c].has(num)) {
        newNotes[r][c].delete(num);
      } else {
        newNotes[r][c].add(num);
      }
      setNotes(newNotes);
      return;
    }

    movesRef.current++;
    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = num;
    setBoard(newBoard);

    // Check error
    const newErrors = new Set(errors);
    const key = `${r}-${c}`;
    if (num !== solution[r][c]) {
      newErrors.add(key);
    } else {
      newErrors.delete(key);
    }
    setErrors(newErrors);

    // Count filled cells
    const filled = newBoard.flat().filter((v) => v !== null).length;
    onScoreUpdate(filled * 10);

    // Check win
    const isComplete = newBoard.every((row, ri) => row.every((cell, ci) => cell === solution[ri][ci]));
    if (isComplete) {
      setGameOver(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const score = Math.max(100, 1000 - time * 2 - newErrors.size * 50);
      const result: GameResult = {
        gameId: 'sudoku',
        mode: difficulty,
        score,
        won: true,
        duration: Date.now() - startTime.current,
        moves: movesRef.current,
        personalBest: false,
        data: { difficulty, time, errors: errors.size },
        timestamp: Date.now(),
      };
      onGameEnd(result);
    }
  }, [selected, board, puzzle, solution, noteMode, notes, errors, gameOver, isPaused, time, difficulty, onGameEnd, onScoreUpdate]);

  const handleClear = useCallback(() => {
    if (!selected || !board || !puzzle || gameOver || isPaused) return;
    const [r, c] = selected;
    if (puzzle[r][c] !== null) return;

    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = null;
    setBoard(newBoard);

    const newErrors = new Set(errors);
    newErrors.delete(`${r}-${c}`);
    setErrors(newErrors);
  }, [selected, board, puzzle, errors, gameOver, isPaused]);

  // Keyboard input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameOver || isPaused) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        handleNumberInput(num);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleClear();
      } else if (e.key === 'n' || e.key === 'N') {
        setNoteMode((prev) => !prev);
      }

      // Arrow key navigation
      if (selected) {
        const [r, c] = selected;
        if (e.key === 'ArrowUp' && r > 0) setSelected([r - 1, c]);
        if (e.key === 'ArrowDown' && r < 8) setSelected([r + 1, c]);
        if (e.key === 'ArrowLeft' && c > 0) setSelected([r, c - 1]);
        if (e.key === 'ArrowRight' && c < 8) setSelected([r, c + 1]);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selected, handleNumberInput, handleClear, gameOver, isPaused]);

  // Cleanup timer
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (!board || !puzzle || !notes) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <button
              key={d}
              onClick={() => startNewGame(d)}
              className="px-5 py-2.5 bg-surface-overlay hover:bg-surface-hover rounded-xl text-sm font-medium capitalize transition-colors"
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center max-w-sm mx-auto mb-3">
        <div className="text-sm text-text-muted capitalize">{difficulty}</div>
        <div className="font-mono text-sm font-bold tabular-nums">{formatTime(time)}</div>
      </div>

      {/* Board */}
      <div className="max-w-sm mx-auto">
        <div className="grid grid-cols-9 border-2 border-text-primary rounded-lg overflow-hidden">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isOriginal = puzzle[r][c] !== null;
              const isSelected = selected?.[0] === r && selected?.[1] === c;
              const isSameNumber = selected && cell !== null && board[selected[0]][selected[1]] === cell;
              const isError = errors.has(`${r}-${c}`);
              const cellNotes = notes[r][c];

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`
                    aspect-square flex items-center justify-center text-sm sm:text-base font-medium relative
                    transition-colors select-none
                    ${c % 3 === 2 && c < 8 ? 'border-r-2 border-r-text-primary' : 'border-r border-r-border-default'}
                    ${r % 3 === 2 && r < 8 ? 'border-b-2 border-b-text-primary' : 'border-b border-b-border-default'}
                    ${isSelected ? 'bg-hrsh-accent/20' : isSameNumber ? 'bg-hrsh-accent/10' : 'bg-surface-raised hover:bg-surface-overlay'}
                    ${isError ? 'text-red-400' : isOriginal ? 'text-text-primary font-bold' : 'text-sky-400'}
                  `}
                >
                  {cell !== null ? (
                    cell
                  ) : cellNotes.size > 0 ? (
                    <div className="grid grid-cols-3 gap-0 text-[7px] sm:text-[8px] text-text-muted leading-none w-full h-full p-0.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <span key={n} className="flex items-center justify-center">
                          {cellNotes.has(n) ? n : ''}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Number pad */}
      <div className="max-w-sm mx-auto mt-4">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setNoteMode(!noteMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              noteMode ? 'bg-hrsh-accent text-white' : 'bg-surface-overlay text-text-secondary'
            }`}
          >
            ✏️ Notes
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-overlay text-text-secondary hover:bg-surface-hover transition-colors"
          >
            ⌫ Clear
          </button>
        </div>
        <div className="grid grid-cols-9 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberInput(num)}
              className="aspect-square rounded-lg bg-surface-overlay hover:bg-surface-hover active:bg-hrsh-accent/20 text-text-primary font-semibold text-sm sm:text-base transition-colors"
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SudokuGame;
