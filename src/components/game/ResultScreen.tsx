import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePlayerStore } from '../../stores/playerStore';
import { Confetti } from '../shared/LoadingStates';
import type { GameMetadata, GameResult } from '../../types/game';

interface ResultScreenProps {
  game: GameMetadata;
  result: GameResult;
  isPersonalBest: boolean;
  xpGained?: number;
  onPlayAgain: () => void;
}

export function ResultScreen({ game, result, isPersonalBest, xpGained = 0, onPlayAgain }: ResultScreenProps) {
  const { streak } = usePlayerStore();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isPersonalBest || result.won) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isPersonalBest, result.won]);

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const remainder = s % 60;
    return m > 0 ? `${m}m ${remainder}s` : `${s}s`;
  };

  return (
    <>
      <Confetti active={showConfetti} />
      <div className="fixed inset-0 z-50 bg-surface-base/90 backdrop-blur-md flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
        <div className="w-full max-w-sm bg-surface-raised border border-border-default rounded-2xl overflow-hidden animate-[scale-in_0.3s_ease-out] text-center">
          <div className="p-6">
            {/* Result */}
            <div className="mb-5">
              <div className="text-3xl mb-2 animate-[bounce-in_0.5s_ease-out]">
                {result.won ? '🎉' : '💪'}
              </div>
              <h2 className="text-xl font-bold mb-1">
                {result.won ? 'You Win!' : 'Game Over'}
              </h2>
            </div>

            {/* Score */}
            <div className="mb-5">
              <div
                className="text-4xl font-bold font-mono tabular-nums animate-[pop_0.4s_ease-out]"
                style={{ color: game.color }}
              >
                {result.score.toLocaleString()}
              </div>

              {/* Personal Best Badge */}
              {isPersonalBest && (
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-status-success/10 text-status-success rounded-full text-xs font-semibold animate-[pop_0.5s_ease-out]">
                  ⭐ New Personal Best!
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-surface-base rounded-xl p-3">
                <div className="text-text-muted text-xs mb-0.5">Duration</div>
                <div className="font-mono text-sm font-semibold">{formatDuration(result.duration)}</div>
              </div>
              <div className="bg-surface-base rounded-xl p-3">
                <div className="text-text-muted text-xs mb-0.5">Moves</div>
                <div className="font-mono text-sm font-semibold">{result.moves || '—'}</div>
              </div>
            </div>

            {/* XP Gain */}
            {xpGained > 0 && (
              <div className="mb-5 bg-surface-base rounded-xl p-3 animate-[slide-up_0.4s_ease-out_0.3s_both]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-text-muted">XP Earned</span>
                  <span className="text-sm font-bold text-xp-bar">+{xpGained} XP</span>
                </div>
                <div className="xp-bar">
                  <div className="xp-bar-fill" style={{ width: '60%', animation: 'progress-fill 1s ease-out 0.5s both' }} />
                </div>
              </div>
            )}

            {/* Streak */}
            {streak && streak.currentStreak > 0 && (
              <div className="mb-5 flex items-center justify-center gap-2 text-sm">
                <span>🔥</span>
                <span className="text-status-warning font-semibold">{streak.currentStreak} day streak</span>
              </div>
            )}

            {/* Game-specific data */}
            {result.data && Object.keys(result.data).length > 0 && (
              <div className="mb-5 text-sm">
                {'wpm' in result.data && Boolean(result.data.wpm) && (
                  <div className="text-text-secondary">
                    <span className="font-mono font-bold" style={{ color: game.color }}>{String(result.data.wpm)}</span> WPM
                    {'accuracy' in result.data && Boolean(result.data.accuracy) && <span className="text-text-muted"> · {String(result.data.accuracy)}% accuracy</span>}
                  </div>
                )}
                {'reactionTime' in result.data && Boolean(result.data.reactionTime) && (
                  <div className="text-text-secondary">
                    <span className="font-mono font-bold" style={{ color: game.color }}>{String(result.data.reactionTime)}</span>ms average
                  </div>
                )}
                {'bestTile' in result.data && Boolean(result.data.bestTile) && (
                  <div className="text-text-secondary">
                    Best tile: <span className="font-mono font-bold" style={{ color: game.color }}>{String(result.data.bestTile)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              <button
                onClick={onPlayAgain}
                autoFocus
                className="w-full px-4 py-3.5 btn-3d btn-3d-primary text-sm"
              >
                Play Again
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    import('../../engine/ShareEngine').then(({ ShareEngine }) => {
                      ShareEngine.shareResult(game.id, result.score, result.data);
                    });
                  }}
                  className="px-4 py-3 btn-3d btn-3d-secondary text-xs"
                >
                  📤 Share
                </button>
                <button
                  onClick={() => {
                    const challengeId = Math.random().toString(36).substring(2, 8).toUpperCase();
                    import('../../engine/ShareEngine').then(({ ShareEngine }) => {
                      ShareEngine.shareChallenge(game.id, challengeId);
                    });
                  }}
                  className="px-4 py-3 btn-3d btn-3d-secondary text-xs"
                >
                  🤝 Challenge
                </button>
              </div>
              
              <Link
                to="/"
                className="block w-full px-4 py-2.5 bg-transparent hover:bg-surface-base text-text-muted hover:text-text-primary text-center font-semibold rounded-xl text-xs transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
