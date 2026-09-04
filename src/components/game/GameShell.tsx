import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
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
  const { player, updateStreak } = usePlayerStore();
  const {
    status, score, isPaused, lastResult, wasPersonalBest,
    startGame, updateScore, pauseGame, resumeGame, endGame, resetGame, addAchievement,
  } = useGameStore();
  const [showResult, setShowResult] = useState(false);

  const handleGameStart = useCallback(() => {
    startGame(game.id);
    AnalyticsEngine.track('GAME_START', { gameId: game.id });
  }, [game.id, startGame]);

  const handleGameEnd = useCallback(async (result: GameResult) => {
    if (!player) return;

    const isPersonalBest = await ScoreEngine.recordResult(player.id, result);
    endGame(result, isPersonalBest);

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
  }, [resumeGame]);

  const handlePlayAgain = useCallback(() => {
    setShowResult(false);
    resetGame();
  }, [resetGame]);

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
          <Link
            to={`/games/${game.slug}`}
            className="text-text-muted hover:text-text-secondary transition-colors text-sm"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-2">
            <span>{game.icon}</span>
            <h1 className="text-base font-semibold">{game.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Score */}
          {status !== 'idle' && (
            <div className="font-mono text-sm font-bold tabular-nums" style={{ color: game.color }}>
              {score.toLocaleString()}
            </div>
          )}

          {/* Pause */}
          {status === 'playing' && (
            <button
              onClick={handlePause}
              className="w-8 h-8 rounded-lg bg-surface-overlay hover:bg-surface-hover flex items-center justify-center transition-colors text-sm"
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
            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold">Paused</h2>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleResume}
                  className="px-6 py-2.5 bg-hrsh-accent hover:bg-hrsh-accent-hover text-white rounded-xl font-medium text-sm transition-colors"
                >
                  Resume
                </button>
                <button
                  onClick={handlePlayAgain}
                  className="px-6 py-2.5 bg-surface-overlay hover:bg-surface-hover text-text-primary rounded-xl font-medium text-sm transition-colors"
                >
                  Restart
                </button>
                <Link
                  to="/"
                  onClick={() => resetGame()}
                  className="px-6 py-2.5 text-text-muted hover:text-text-secondary text-sm transition-colors"
                >
                  Quit
                </Link>
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
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
