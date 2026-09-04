import { useState, useCallback, useRef } from 'react';
import type { GameComponentProps, GameResult } from '../../types/game';

// ============================================================
// Reaction Test Game
// ============================================================

type Phase = 'waiting' | 'ready' | 'go' | 'result' | 'too-early' | 'finished';

const ROUNDS = 5;

function ReactionGame({ onGameStart, onGameEnd, onScoreUpdate }: GameComponentProps) {
  const [phase, setPhase] = useState<Phase>('waiting');
  const [times, setTimes] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const goTime = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const started = useRef(false);

  const startRound = useCallback(() => {
    if (!started.current) {
      started.current = true;
      onGameStart();
    }

    setPhase('ready');
    setCurrentTime(null);

    // Random delay between 1.5s and 4.5s
    const delay = 1500 + Math.random() * 3000;
    timeout.current = setTimeout(() => {
      goTime.current = performance.now();
      setPhase('go');
    }, delay);
  }, [onGameStart]);

  const handleClick = useCallback(() => {
    switch (phase) {
      case 'waiting':
        startRound();
        break;

      case 'ready':
        // Too early!
        if (timeout.current) clearTimeout(timeout.current);
        setPhase('too-early');
        break;

      case 'go': {
        const reactionTime = Math.round(performance.now() - goTime.current);
        setCurrentTime(reactionTime);
        const newTimes = [...times, reactionTime];
        setTimes(newTimes);
        const newRound = round + 1;
        setRound(newRound);

        const avgTime = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length);
        // Use inverse scoring: lower time = higher score
        const score = Math.max(0, 500 - avgTime);
        onScoreUpdate(score);

        if (newRound >= ROUNDS) {
          setPhase('finished');
          const result: GameResult = {
            gameId: 'reaction',
            mode: 'classic',
            score: score,
            won: avgTime < 300,
            duration: 0,
            moves: ROUNDS,
            personalBest: false,
            data: { reactionTime: avgTime, times: newTimes, bestTime: Math.min(...newTimes) },
            timestamp: Date.now(),
          };
          onGameEnd(result);
        } else {
          setPhase('result');
        }
        break;
      }

      case 'too-early':
        startRound();
        break;

      case 'result':
        startRound();
        break;

      default:
        break;
    }
  }, [phase, times, round, startRound, onGameStart, onGameEnd, onScoreUpdate]);

  const getPhaseConfig = () => {
    switch (phase) {
      case 'waiting':
        return { bg: 'bg-surface-raised', text: 'Click to Start', sub: `${ROUNDS} rounds — react when the screen turns green`, color: 'text-text-primary' };
      case 'ready':
        return { bg: 'bg-red-600', text: 'Wait...', sub: 'Click when it turns green', color: 'text-white' };
      case 'go':
        return { bg: 'bg-green-600', text: 'Click Now!', sub: '', color: 'text-white' };
      case 'too-early':
        return { bg: 'bg-surface-raised', text: 'Too Early!', sub: 'Click to try again', color: 'text-red-400' };
      case 'result':
        return { bg: 'bg-surface-raised', text: `${currentTime}ms`, sub: `Round ${round}/${ROUNDS} — Click to continue`, color: 'text-hrsh-accent' };
      case 'finished':
        return { bg: 'bg-surface-raised', text: 'Done!', sub: '', color: 'text-text-primary' };
      default:
        return { bg: 'bg-surface-raised', text: '', sub: '', color: '' };
    }
  };

  const config = getPhaseConfig();
  const avgTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;

  return (
    <div>
      {/* Round indicator */}
      <div className="flex justify-center gap-1.5 mb-4">
        {Array.from({ length: ROUNDS }).map((_, i) => (
          <div
            key={i}
            className={`w-8 h-1.5 rounded-full transition-colors ${
              i < round ? 'bg-hrsh-accent' : 'bg-surface-overlay'
            }`}
          />
        ))}
      </div>

      {/* Main interaction area */}
      <button
        onClick={handleClick}
        className={`w-full aspect-[4/3] max-w-lg mx-auto rounded-xl ${config.bg} flex flex-col items-center justify-center cursor-pointer transition-colors duration-100 select-none border border-border-default`}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <div className={`text-3xl sm:text-4xl font-bold font-mono ${config.color} transition-all`}>
          {config.text}
        </div>
        {config.sub && (
          <div className="text-sm text-text-muted mt-2">{config.sub}</div>
        )}
      </button>

      {/* Stats */}
      {times.length > 0 && phase !== 'finished' && (
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="text-center">
            <div className="text-text-muted text-xs">Average</div>
            <div className="font-mono font-bold text-hrsh-accent">{avgTime}ms</div>
          </div>
          <div className="text-center">
            <div className="text-text-muted text-xs">Best</div>
            <div className="font-mono font-bold text-status-success">{Math.min(...times)}ms</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReactionGame;
