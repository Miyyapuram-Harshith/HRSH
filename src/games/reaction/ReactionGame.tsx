import { useState, useCallback, useRef, useEffect } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import type { GameComponentProps, GameResult } from '../../types/game';

// ============================================================
// Reaction Test Game 3.0
// ============================================================

type Phase = 'waiting' | 'ready' | 'go' | 'result' | 'too-early' | 'finished';
type Mode = 'Classic' | 'Chaos' | 'Blitz';
type ChaosEvent = 'NORMAL' | 'FAKE_SIGNAL' | 'RAPID_FIRE' | 'COLOR_SWITCH';

const ROUNDS = { Classic: 5, Chaos: 10, Blitz: 10 };

export function getReactionGrade(avgTime: number): string {
  if (avgTime < 160) return 'S+';
  if (avgTime < 185) return 'S';
  if (avgTime < 210) return 'A';
  if (avgTime < 250) return 'B';
  if (avgTime < 300) return 'C';
  return 'D';
}

export function getComboTitle(streak: number): string | null {
  if (streak >= 10) return 'UNHINGED';
  if (streak >= 8) return 'LIGHTNING';
  if (streak >= 5) return 'FAST';
  if (streak >= 3) return 'QUICK';
  return null;
}

function ReactionGame({ onGameStart, onGameEnd, onScoreUpdate }: GameComponentProps) {
  const { settings } = usePlayerStore();
  const customization = (settings as any)?.customizations?.['reaction'] || {};
  const theme = customization.theme || 'classic';
  const targetStyle = customization.targetStyle || 'fullscreen';
  const primaryColor = customization.primaryColor || '#ef4444';

  const [mode, setMode] = useState<Mode>('Classic');
  const [phase, setPhase] = useState<Phase>('waiting');
  const [times, setTimes] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [chaosEvent, setChaosEvent] = useState<ChaosEvent>('NORMAL');
  const [falseStarts, setFalseStarts] = useState(0);
  const [fastStreak, setFastStreak] = useState(0);

  const goTime = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fakeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const started = useRef(false);

  const startRound = useCallback(() => {
    if (!started.current) {
      started.current = true;
      onGameStart();
    }

    setPhase('ready');
    setCurrentTime(null);
    let event: ChaosEvent = 'NORMAL';

    if (mode === 'Chaos') {
      const rand = Math.random();
      if (rand < 0.2) event = 'FAKE_SIGNAL';
      else if (rand < 0.4) event = 'RAPID_FIRE';
      else if (rand < 0.6) event = 'COLOR_SWITCH';
    }
    setChaosEvent(event);

    const delay = event === 'RAPID_FIRE' ? 500 + Math.random() * 1000 : 1500 + Math.random() * 3000;

    if (event === 'FAKE_SIGNAL') {
      fakeTimeout.current = setTimeout(() => {
        // Just flash the button briefly but don't transition to GO
        setPhase('waiting'); // This is essentially the fake visual
        setTimeout(() => setPhase('ready'), 300);
      }, delay * 0.4);
    }

    timeout.current = setTimeout(() => {
      goTime.current = performance.now();
      setPhase('go');
    }, delay);
  }, [onGameStart, mode]);

  const handleClick = useCallback(() => {
    switch (phase) {
      case 'waiting':
        startRound();
        break;

      case 'ready': {
        // Too early!
        if (timeout.current) clearTimeout(timeout.current);
        if (fakeTimeout.current) clearTimeout(fakeTimeout.current);
        
        const penaltyTime = 5000;
        const newTimes = [...times, penaltyTime];
        setTimes(newTimes);
        
        const newRound = round + 1;
        setRound(newRound);
        setFalseStarts(prev => prev + 1);
        setFastStreak(0);
        setPhase('too-early');
        
        const avgTime = newTimes.length > 0 ? Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length) : 0;
        const score = Number.isFinite(avgTime) ? Math.max(0, 500 - avgTime) : 0;
        onScoreUpdate(score);
        
        const targetRounds = ROUNDS[mode];
        if (newRound >= targetRounds) {
          setPhase('finished');
          const result: GameResult = {
            gameId: 'reaction',
            mode: mode.toLowerCase(),
            score: score,
            won: avgTime < 300,
            duration: 0,
            moves: targetRounds,
            personalBest: false,
            data: { 
              reactionTime: avgTime, 
              times: newTimes, 
              bestTime: Math.min(...newTimes),
              grade: getReactionGrade(avgTime),
              falseStarts: falseStarts + 1
            },
            timestamp: Date.now(),
          };
          onGameEnd(result);
        }
        break;
      }

      case 'go': {
        const reactionTime = Math.round(performance.now() - goTime.current);
        setCurrentTime(reactionTime);
        const newTimes = [...times, reactionTime];
        setTimes(newTimes);
        const newRound = round + 1;
        setRound(newRound);

        if (reactionTime < 220) setFastStreak(prev => prev + 1);
        else setFastStreak(0);

        const avgTime = newTimes.length > 0 ? Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length) : 0;
        const score = Number.isFinite(avgTime) ? Math.max(0, 500 - avgTime) : 0;
        onScoreUpdate(score);

        const targetRounds = ROUNDS[mode];
        if (newRound >= targetRounds) {
          setPhase('finished');
          const result: GameResult = {
            gameId: 'reaction',
            mode: mode.toLowerCase(),
            score: score,
            won: avgTime < 300,
            duration: 0,
            moves: targetRounds,
            personalBest: false,
            data: { 
              reactionTime: avgTime, 
              times: newTimes, 
              bestTime: Math.min(...newTimes),
              grade: getReactionGrade(avgTime),
              falseStarts
            },
            timestamp: Date.now(),
          };
          onGameEnd(result);
        } else {
          setPhase('result');
        }
        break;
      }

      case 'too-early':
      case 'result':
        startRound();
        break;

      default:
        break;
    }
  }, [phase, times, round, startRound, onGameStart, onGameEnd, onScoreUpdate, falseStarts, mode]);

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
      if (fakeTimeout.current) clearTimeout(fakeTimeout.current);
    };
  }, []);

  const getPhaseConfig = () => {
    const readyBg = theme === 'cyber' ? '#ec4899' : theme === 'sunset' ? '#f97316' : primaryColor || '#dc2626';
    let goBg = theme === 'cyber' ? '#06b6d4' : theme === 'sunset' ? '#eab308' : '#16a34a';

    if (chaosEvent === 'COLOR_SWITCH') {
        goBg = '#3b82f6'; // Blue instead of green
    }

    switch (phase) {
      case 'waiting':
        return { bgStyle: {}, bgClass: 'bg-surface-raised', text: 'Click to Start', sub: `${ROUNDS[mode]} rounds — React!`, color: 'text-text-primary' };
      case 'ready':
        return { bgStyle: { backgroundColor: readyBg }, bgClass: '', text: 'Wait...', sub: 'Click when it triggers!', color: 'text-white' };
      case 'go':
        return { bgStyle: { backgroundColor: goBg }, bgClass: '', text: targetStyle === 'bolt' ? '⚡ CLICK NOW! ⚡' : targetStyle === 'circle' ? '🎯 HIT TARGET!' : 'Click Now!', sub: '', color: 'text-white' };
      case 'too-early':
        return { bgStyle: {}, bgClass: 'bg-surface-raised', text: 'Too Early!', sub: 'Click to try again', color: 'text-red-400' };
      case 'result':
        return { bgStyle: {}, bgClass: 'bg-surface-raised', text: `${currentTime}ms`, sub: `Round ${round}/${ROUNDS[mode]} — Click to continue`, color: 'text-hrsh-accent' };
      case 'finished':
        return { bgStyle: {}, bgClass: 'bg-surface-raised', text: 'Done!', sub: `Grade: ${times.length > 0 ? getReactionGrade(Math.round(times.reduce((a, b) => a + b, 0) / times.length)) : 'N/A'}`, color: 'text-text-primary' };
      default:
        return { bgStyle: {}, bgClass: 'bg-surface-raised', text: '', sub: '', color: '' };
    }
  };

  const config = getPhaseConfig();
  const avgTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
  const comboTitle = getComboTitle(fastStreak);

  return (
    <div>
      {/* Mode Selector */}
      {!started.current && (
          <div className="flex justify-center gap-2 mb-6">
              {(['Classic', 'Blitz', 'Chaos'] as Mode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-4 py-1 rounded-full text-xs font-bold transition-colors border ${mode === m ? 'bg-hrsh-accent text-white border-hrsh-accent' : 'bg-transparent text-text-muted border-border-default hover:text-text-primary'}`}
                  >
                      {m}
                  </button>
              ))}
          </div>
      )}

      {/* Round indicator */}
      <div className="flex justify-center gap-1.5 mb-4">
        {Array.from({ length: ROUNDS[mode] }).map((_, i) => (
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
        className={`w-full aspect-[4/3] max-w-lg mx-auto rounded-2xl ${config.bgClass} flex flex-col items-center justify-center cursor-pointer transition-colors duration-100 select-none border border-border-default shadow-lg relative overflow-hidden`}
        style={{ ...config.bgStyle, WebkitTapHighlightColor: 'transparent' }}
      >
        {comboTitle && phase === 'go' && (
            <div className="absolute top-4 right-4 text-xs font-black text-white bg-black/30 px-2 py-1 rounded-md animate-bounce">
                {comboTitle} x{fastStreak}
            </div>
        )}

        {targetStyle === 'circle' && (phase === 'ready' || phase === 'go') && (
          <div className="w-24 h-24 rounded-full border-4 border-white/50 flex items-center justify-center mb-2 animate-ping" />
        )}
        <div className={`text-3xl sm:text-4xl font-bold font-mono ${config.color} transition-all`}>
          {config.text}
        </div>
        {config.sub && (
          <div className="text-sm text-white/80 mt-2 font-medium tracking-wide">{config.sub}</div>
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
          <div className="text-center">
            <div className="text-text-muted text-xs">Grade</div>
            <div className="font-mono font-bold text-status-warning">{getReactionGrade(avgTime || 0)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReactionGame;
