import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/gameStore';
import { usePlayerStore } from '../../stores/playerStore';
import { ScoreEngine } from '../../engine/ScoreEngine';
import { AchievementEngine } from '../../engine/AchievementEngine';
import { AnalyticsEngine } from '../../engine/AnalyticsEngine';
import { ResultScreen } from './ResultScreen';
import type { GameMetadata, GameResult } from '../../types/game';

interface GameShellProps {
  game: GameMetadata;
  children: (props: {
    onGameStart: () => void;
    onGameEnd: (result: GameResult) => void;
    onScoreUpdate: (score: number) => void;
    isPaused: boolean;
    onPause: () => void;
    onResume: () => void;
  }) => ReactNode;
}

export function GameShell({ game, children }: GameShellProps) {
  const navigate = useNavigate();
  const { player, updateStreak } = usePlayerStore();
  const {
    status, score, isPaused, lastResult, wasPersonalBest,
    startGame, updateScore, pauseGame, resumeGame, endGame, resetGame, addAchievement,
  } = useGameStore();
  const [showResult, setShowResult] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (status === 'playing' && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, isPaused]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleGameStart = useCallback(() => {
    startGame(game.id);
    setElapsed(0);
    AnalyticsEngine.track('GAME_START', { gameId: game.id });
  }, [game.id, startGame]);

  const handleGameEnd = useCallback(async (result: GameResult) => {
    if (!player) return;

    const isPersonalBest = await ScoreEngine.recordResult(player.id, result);
    endGame(result, isPersonalBest);

    // Calculate XP
    let xp = 10; // base
    if (result.won) xp += 15;
    xp += Math.floor(result.score / 100);
    setXpGained(xp);

    // Update streak
    await updateStreak();

    // Check achievements
    const unlocked = await AchievementEngine.processEvent(player.id, {
      type: result.won ? 'GAME_WON' : 'GAME_FINISHED',
      gameId: game.id,
      timestamp: Date.now(),
      data: { score: result.score, duration: result.duration, won: result.won },
    });

    for (const achievement of unlocked) {
      addAchievement(achievement);
    }

    AnalyticsEngine.track('GAME_FINISH', { gameId: game.id, score: result.score, won: result.won });
    setShowResult(true);
  }, [player, game.id, endGame, updateStreak, addAchievement]);

  const handleScoreUpdate = useCallback((newScore: number) => {
    updateScore(newScore);
  }, [updateScore]);

  const handlePause = useCallback(() => {
    pauseGame();
  }, [pauseGame]);

  const handleResume = useCallback(() => {
    resumeGame();
    setShowQuitConfirm(false);
  }, [resumeGame]);

  const handlePlayAgain = useCallback(() => {
    setShowResult(false);
    setElapsed(0);
    setXpGained(0);
    resetGame();
  }, [resetGame]);

  const handleQuit = useCallback(() => {
    resetGame();
    navigate(`/games/${game.slug}`);
  }, [resetGame, navigate, game.slug]);

  // Keyboard pause
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status === 'playing') {
        handlePause();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [status, handlePause]);

  // Cleanup on unmount
  useEffect(() => {
    return () => resetGame();
  }, [resetGame]);

  return (
    <div className="flex flex-col gap-4">
      {/* Game Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (status === 'playing') {
                handlePause();
                setShowQuitConfirm(true);
              } else {
                handleQuit();
              }
            }}
            className="text-text-muted hover:text-text-secondary transition-colors text-sm"
            aria-label="Go back"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <span>{game.icon}</span>
            <h1 className="text-base font-semibold">{game.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          {status !== 'idle' && (
            <div className="text-text-muted text-xs font-mono tabular-nums">
              {formatTime(elapsed)}
            </div>
          )}

          {/* Score */}
          {status !== 'idle' && (
            <div className="font-mono text-sm font-bold tabular-nums animate-[count-up_0.3s_ease-out]" style={{ color: game.color }}>
              {score.toLocaleString()}
            </div>
          )}

          {/* Pause */}
          {status === 'playing' && (
            <button
              onClick={handlePause}
              className="w-8 h-8 rounded-lg bg-surface-overlay hover:bg-surface-hover flex items-center justify-center transition-colors text-sm active-press"
              aria-label="Pause game"
            >
              ⏸
            </button>
          )}
        </div>
      </div>

      {/* Game Area */}
      <div className="relative">
        {children({
          onGameStart: handleGameStart,
          onGameEnd: handleGameEnd,
          onScoreUpdate: handleScoreUpdate,
          isPaused,
          onPause: handlePause,
          onResume: handleResume,
        })}

        {/* Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-surface-base/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10 animate-[fade-in_0.15s_ease-out]">
            <div className="text-center space-y-4 animate-[scale-in_0.2s_ease-out]">
              <h2 className="text-xl font-bold">Paused</h2>
              <div className="text-text-muted text-sm font-mono tabular-nums mb-2">
                {formatTime(elapsed)} · {score.toLocaleString()} pts
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleResume}
                  className="px-6 py-2.5 bg-hrsh-accent hover:bg-hrsh-accent-hover text-white rounded-xl font-medium text-sm transition-colors active-press"
                  autoFocus
                >
                  Resume
                </button>
                <button
                  onClick={handlePlayAgain}
                  className="px-6 py-2.5 bg-surface-overlay hover:bg-surface-hover text-text-primary rounded-xl font-medium text-sm transition-colors active-press"
                >
                  Restart
                </button>
                <button
                  onClick={handleQuit}
                  className="px-6 py-2.5 text-text-muted hover:text-status-error text-sm transition-colors"
                >
                  Quit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quit confirmation overlay */}
        {showQuitConfirm && !isPaused && (
          <div className="absolute inset-0 bg-surface-base/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10 animate-[fade-in_0.15s_ease-out]">
            <div className="text-center space-y-4 animate-[scale-in_0.2s_ease-out]">
              <h2 className="text-lg font-bold">Quit Game?</h2>
              <p className="text-text-muted text-sm">Your progress will be lost.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowQuitConfirm(false); handleResume(); }}
                  className="px-5 py-2 bg-surface-overlay hover:bg-surface-hover rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuit}
                  className="px-5 py-2 bg-status-error hover:bg-status-error/90 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Quit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Result Screen */}
      {showResult && lastResult && (
        <ResultScreen
          game={game}
          result={lastResult}
          isPersonalBest={wasPersonalBest}
          xpGained={xpGained}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
