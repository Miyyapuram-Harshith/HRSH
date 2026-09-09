import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameComponentProps, GameResult } from '../../types/game';
import { useRoomStore } from '../../stores/roomStore';
import { usePlayerStore } from '../../stores/playerStore';
import { TypingLeaderboard } from '../../components/game/TypingLeaderboard';
import { TypingArea } from './TypingArea';

const WORD_LISTS = {
  common: [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with',
    'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
    'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up',
    'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
    'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
    'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
    'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
    'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'find', 'here', 'thing',
    'many', 'help', 'where', 'world', 'right', 'still', 'through', 'life', 'game', 'play'
  ],
};

function generateText(wordCount: number): string {
  const words = WORD_LISTS.common;
  const selected: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    selected.push(words[Math.floor(Math.random() * words.length)]);
  }
  return selected.join(' ');
}

const TIME_OPTIONS = [
  { id: '30s', label: '30s', seconds: 30 },
  { id: '60s', label: '60s', seconds: 60 },
  { id: '120s', label: '2m', seconds: 120 },
];

function TypingGame({ onGameStart, onGameEnd, onScoreUpdate, isPaused, multiplayerState, onMatchProgress, onMatchFinished }: GameComponentProps) {
  const isMultiplayer = !!multiplayerState;
  const roomPlayers = useRoomStore(state => state.players);
  const myPlayerId = usePlayerStore(state => state.player?.id);
  
  const [duration, setDuration] = useState(60);
  const [text, setText] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  
  // High-level match states
  const [hasStarted, setHasStarted] = useState(false); 
  const [hasFinished, setHasFinished] = useState(false);
  
  // Local fast UI updates (WPM, Accuracy, Progress)
  const [localStats, setLocalStats] = useState({ wpm: 0, accuracy: 100, progress: 0 });
  const [liveEvent, setLiveEvent] = useState<string | null>(null);
  
  // Countdown logic
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialization
  useEffect(() => {
    let targetDuration = 60;
    if (isMultiplayer && multiplayerState) {
      targetDuration = multiplayerState.duration || 60;
      setDuration(targetDuration);
      setText(multiplayerState.challenge || 'Waiting for text...');
      
      if (multiplayerState.startTime) {
        const timeUntilStart = multiplayerState.startTime - Date.now();
        if (timeUntilStart > 0) {
            setCountdown(Math.ceil(timeUntilStart / 1000));
            setHasStarted(false);
        } else {
            setCountdown(null);
            if (!hasStarted) {
                onGameStart();
                setHasStarted(true);
            }
        }
      } else {
        if (!hasStarted) {
          onGameStart();
          setHasStarted(true);
        }
      }
    } else {
      setDuration(60);
      setText(generateText(200));
      setCountdown(null);
    }
  }, [isMultiplayer, multiplayerState, onGameStart, hasStarted]);

  // Main Timer Loop
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!isPaused) {
      timerRef.current = setInterval(() => {
        if (isMultiplayer && multiplayerState?.startTime) {
            const timeUntilStart = multiplayerState.startTime - Date.now();
            if (timeUntilStart > 0) {
                setCountdown(Math.ceil(timeUntilStart / 1000));
                return; // Don't start game timer yet
            } else if (countdown !== null) {
                setCountdown(null);
                if (!hasStarted) {
                    setHasStarted(true);
                    onGameStart();
                }
            }
        }

        if (hasStarted && !hasFinished) {
            let remaining = duration;
            
            if (isMultiplayer && multiplayerState?.startTime) {
              // Authoritative sync with server time
              const elapsed = Math.floor((Date.now() - multiplayerState.startTime) / 1000);
              remaining = Math.max(0, duration - elapsed);
            } else {
              // Solo mode decrement
              setTimeLeft(prev => {
                const next = prev - 1;
                if (next <= 0) handleAutoFinish();
                return Math.max(0, next);
              });
              return;
            }

            setTimeLeft(remaining);
            if (remaining <= 0) {
              handleAutoFinish();
            }
        }
      }, 1000);
    }
    
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [hasStarted, hasFinished, isPaused, isMultiplayer, multiplayerState, duration]);

  const handleAutoFinish = useCallback(() => {
    if (hasFinished) return;
    setHasFinished(true);
    
    // We didn't finish the text naturally, time ran out. Send what we have.
    if (isMultiplayer && onMatchFinished) {
      onMatchFinished(localStats.progress, localStats.wpm);
    } else if (!isMultiplayer) {
      const result: GameResult = {
        gameId: 'typing-test',
        mode: `${duration}s`,
        score: localStats.wpm,
        won: localStats.wpm >= 30,
        duration: duration * 1000,
        moves: 0, // total chars
        personalBest: false,
        data: { wpm: localStats.wpm, accuracy: localStats.accuracy, duration },
        timestamp: Date.now(),
      };
      onGameEnd(result);
    }
  }, [hasFinished, isMultiplayer, onMatchFinished, localStats, duration, onGameEnd]);

  // Callbacks from TypingArea
  const handleLocalStatsUpdate = useCallback((wpm: number, accuracy: number, progress: number) => {
    setLocalStats({ wpm, accuracy, progress });
    if (!isMultiplayer) onScoreUpdate(wpm);
  }, [isMultiplayer, onScoreUpdate]);

  const handleProgressThrottled = useCallback((progress: number, wpm: number) => {
    if (isMultiplayer && onMatchProgress) {
      onMatchProgress(progress, wpm);
      
      // Live event detection
      if (roomPlayers) {
          const activePlayers = [...roomPlayers].filter(p => !p.isSpectator);
          
          const sorted = [...activePlayers].sort((a, b) => {
            const progB = b.progress || 0;
            const progA = a.progress || 0;
            return progB - progA;
          });
          
          if (sorted.length > 1) {
              const myRank = sorted.findIndex(p => p.id === myPlayerId);
              if (myRank > 0) {
                  const playerAhead = sorted[myRank - 1];
                  const diff = (playerAhead.progress || 0) - progress;
                  
                  if (diff > 0 && diff < 0.05 && progress > 0.5) {
                      setLiveEvent('FINAL SPRINT!');
                      setTimeout(() => setLiveEvent(null), 2000);
                  }
              }
              
              if (progress > 0.95 && sorted[0].id !== myPlayerId && (sorted[0].progress || 0) - progress < 0.02) {
                  setLiveEvent('PHOTO FINISH!');
                  setTimeout(() => setLiveEvent(null), 3000);
              }
          }
      }
    }
  }, [isMultiplayer, onMatchProgress, roomPlayers]);

  const handleTypingFinish = useCallback((wpm: number, accuracy: number, elapsedMs: number) => {
    if (hasFinished) return;
    setHasFinished(true);
    
    if (isMultiplayer && onMatchFinished) {
      onMatchFinished(1, wpm); // 100% progress
    } else if (!isMultiplayer) {
      const result: GameResult = {
        gameId: 'typing-test',
        mode: `${duration}s`,
        score: wpm,
        won: wpm >= 30,
        duration: elapsedMs,
        moves: 0,
        personalBest: false,
        data: { wpm, accuracy, duration },
        timestamp: Date.now(),
      };
      onGameEnd(result);
    }
  }, [hasFinished, isMultiplayer, onMatchFinished, duration, onGameEnd]);

  const handleFirstKeydownSolo = useCallback(() => {
    if (!isMultiplayer && !hasStarted) {
      setHasStarted(true);
      onGameStart();
    }
  }, [isMultiplayer, hasStarted, onGameStart]);

  const handleSoloDurationChange = (seconds: number) => {
    setDuration(seconds);
    setTimeLeft(seconds);
    setText(generateText(200));
    setHasStarted(false);
    setHasFinished(false);
    setLocalStats({ wpm: 0, accuracy: 100, progress: 0 });
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="pb-8 max-w-4xl mx-auto flex flex-col h-full">
      
      {/* Top Header / Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 px-2 gap-4">
        {/* Solo duration selector */}
        {!isMultiplayer ? (
          <div className="flex gap-2 bg-surface-raised p-1 rounded-xl border border-border-default">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSoloDurationChange(opt.seconds)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  duration === opt.seconds 
                    ? 'bg-hrsh-accent text-white shadow-md' 
                    : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="font-bold text-lg tracking-tight text-text-primary uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
            Live Race
          </div>
        )}

        <div className="flex items-center gap-6 sm:gap-10 bg-surface-raised px-6 py-2 rounded-xl border border-border-default shadow-sm">
          <div className="flex flex-col items-center">
            <div className="font-mono text-2xl font-bold text-hrsh-accent">{localStats.wpm}</div>
            <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider">WPM</div>
          </div>
          <div className="flex flex-col items-center">
            <div className={`font-mono text-2xl font-bold ${localStats.accuracy >= 95 ? 'text-status-success' : localStats.accuracy >= 80 ? 'text-status-warning' : 'text-status-error'}`}>
              {localStats.accuracy}%
            </div>
            <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider">ACC</div>
          </div>
          <div className="flex flex-col items-center">
            <div className={`font-mono text-2xl font-bold ${timeLeft <= 10 ? 'text-status-error animate-pulse' : 'text-text-primary'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider">TIME</div>
          </div>
        </div>
      </div>

      {/* Main Typing Area */}
      <div className="relative">
          {liveEvent && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-hrsh-accent text-white px-4 py-1 rounded-full font-black text-xl animate-bounce shadow-xl z-10 whitespace-nowrap">
                  {liveEvent}
              </div>
          )}
          <TypingArea 
            challengeText={text}
            isPaused={isPaused || hasFinished || (countdown !== null && countdown > 0)}
            started={hasStarted}
            onFirstKeydown={handleFirstKeydownSolo}
            onProgressThrottled={handleProgressThrottled}
            onLocalStatsUpdate={handleLocalStatsUpdate}
            onFinish={handleTypingFinish}
            roomPlayers={isMultiplayer ? roomPlayers : undefined}
            myPlayerId={myPlayerId}
          />
          
          {/* Countdown Overlay */}
          {countdown !== null && countdown > 0 && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface-base/80 backdrop-blur-sm rounded-xl">
                <div className="flex flex-col items-center animate-[pop-in_0.3s_ease-out]">
                    <div className="text-6xl sm:text-8xl font-black text-hrsh-accent animate-pulse drop-shadow-lg">
                        {countdown}
                    </div>
                    <div className="mt-4 text-xl sm:text-2xl font-bold uppercase tracking-[0.3em] text-text-primary">
                        Get Ready
                    </div>
                </div>
            </div>
          )}
          
          {/* Finish Banner Overlay */}
          {hasFinished && isMultiplayer && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-sm bg-surface-raised border-2 border-hrsh-accent/50 shadow-2xl rounded-2xl p-4 flex flex-col items-center animate-[slide-up_0.3s_ease-out]">
                <div className="text-3xl mb-1">🏁</div>
                <div className="text-xl font-black text-text-primary uppercase tracking-wider">Race Finished</div>
                <div className="flex gap-4 mt-2 mb-1 w-full justify-center">
                    <div className="text-center">
                        <div className="text-2xl font-mono font-bold text-hrsh-accent">{localStats.wpm}</div>
                        <div className="text-[10px] text-text-muted font-bold uppercase">WPM</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-mono font-bold text-status-success">{localStats.accuracy}%</div>
                        <div className="text-[10px] text-text-muted font-bold uppercase">ACC</div>
                    </div>
                </div>
                <div className="text-xs text-text-muted font-medium mt-2 animate-pulse">Waiting for others to finish...</div>
            </div>
          )}
      </div>

      {/* Multiplayer Leaderboard */}
      {isMultiplayer && (
        <div className="mt-2 flex-1 min-h-[300px]">
          <TypingLeaderboard 
            players={roomPlayers} 
            myPlayerId={myPlayerId} 
            maxDisplay={15} 
          />
        </div>
      )}

    </div>
  );
}

export default TypingGame;
