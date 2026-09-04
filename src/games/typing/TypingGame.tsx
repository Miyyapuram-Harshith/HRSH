import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameComponentProps, GameResult } from '../../types/game';
import { useRoomStore } from '../../stores/roomStore';
import { usePlayerStore } from '../../stores/playerStore';

// ============================================================
// Typing Race Game
// ============================================================

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
    'many', 'help', 'where', 'world', 'right', 'still', 'through', 'life', 'game', 'play',
    'point', 'keep', 'move', 'every', 'last', 'long', 'great', 'same', 'another', 'begin',
    'while', 'number', 'part', 'turn', 'real', 'leave', 'might', 'want', 'home', 'water',
    'room', 'mother', 'light', 'enough', 'almost', 'question', 'city', 'tree', 'cross',
    'farm', 'hard', 'start', 'story', 'draw', 'left', 'late', 'run', 'until', 'plant',
    'cover', 'food', 'sun', 'four', 'between', 'state', 'never', 'next', 'under', 'group',
    'along', 'open', 'seem', 'together', 'children', 'school', 'watch', 'letter', 'carry',
    'music', 'stop', 'without', 'walk', 'example', 'paper', 'young', 'often', 'important',
    'until', 'always', 'those', 'face', 'land', 'head', 'above', 'near', 'girl', 'body',
    'center', 'father', 'door', 'before', 'large', 'hand', 'high', 'small', 'below',
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
  const [typed, setTyped] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(0);
  const totalChars = useRef(0);
  const correctChars = useRef(0);
  
  const lastProgressSentTime = useRef(0);

  const startGame = useCallback((seconds: number) => {
    setDuration(seconds);
    setTimeLeft(seconds);
    
    if (isMultiplayer && multiplayerState.challenge) {
      setText(multiplayerState.challenge);
      setDuration(multiplayerState.duration || 60);
      setTimeLeft(multiplayerState.duration || 60);
    } else {
      setText(generateText(200));
    }
    
    setTyped('');
    setStarted(false);
    setFinished(false);
    setWpm(0);
    setAccuracy(100);
    totalChars.current = 0;
    correctChars.current = 0;
    lastProgressSentTime.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);

    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isMultiplayer, multiplayerState]);

  const endGame = useCallback(() => {
    setFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsed = (Date.now() - startTime.current) / 1000 / 60; // minutes
    const wordsTyped = correctChars.current / 5; // standard: 5 chars = 1 word
    const finalWpm = Math.round(wordsTyped / Math.max(elapsed, 0.01));
    const finalAccuracy = totalChars.current > 0
      ? Math.round((correctChars.current / totalChars.current) * 100)
      : 100;
      
    const progress = totalChars.current / Math.max(1, text.length);

    setWpm(finalWpm);
    setAccuracy(finalAccuracy);

    if (isMultiplayer && onMatchFinished) {
      onMatchFinished(progress, finalWpm);
    } else {
      const result: GameResult = {
        gameId: 'typing-test',
        mode: `${duration}s`,
        score: finalWpm,
        won: finalWpm >= 30,
        duration: Date.now() - startTime.current,
        moves: totalChars.current,
        personalBest: false,
        data: { wpm: finalWpm, accuracy: finalAccuracy, duration },
        timestamp: Date.now(),
      };
      onGameEnd(result);
    }
  }, [duration, onGameEnd, isMultiplayer, onMatchFinished, text.length]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (finished || isPaused) return;

    const value = e.target.value;

    // Start timer on first character
    if (!started) {
      setStarted(true);
      startTime.current = Date.now();
      onGameStart();

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
        const remaining = Math.max(0, (isMultiplayer ? (multiplayerState.duration || 60) : duration) - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          endGame();
        }
      }, 100);
    }

    setTyped(value);

    // Calculate stats
    totalChars.current = value.length;
    correctChars.current = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === text[i]) correctChars.current++;
    }

    // Live WPM
    const elapsed = (Date.now() - startTime.current) / 1000 / 60;
    let liveWpm = 0;
    if (elapsed > 0.05) {
      liveWpm = Math.round((correctChars.current / 5) / elapsed);
      setWpm(liveWpm);
      onScoreUpdate(liveWpm);
    }

    const liveAccuracy = totalChars.current > 0
      ? Math.round((correctChars.current / totalChars.current) * 100)
      : 100;
    setAccuracy(liveAccuracy);

    // Throttle progress updates to server
    if (isMultiplayer && onMatchProgress) {
      const now = Date.now();
      if (now - lastProgressSentTime.current > 200) {
        const progress = totalChars.current / Math.max(1, text.length);
        onMatchProgress(progress, liveWpm);
        lastProgressSentTime.current = now;
      }
    }

    // Auto-end if typed all text
    if (value.length >= text.length) {
      endGame();
    }
  }, [started, finished, isPaused, text, duration, onGameStart, onScoreUpdate, endGame, isMultiplayer, multiplayerState, onMatchProgress]);

  // Initialize
  useEffect(() => {
    if (isMultiplayer && multiplayerState) {
       startGame(multiplayerState.duration || 60);
    } else if (!isMultiplayer) {
       startGame(60);
    }
  }, [startGame, isMultiplayer, multiplayerState]);

  // Cleanup
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Render text with highlighting
  const renderText = () => {
    return text.split('').map((char, i) => {
      let className = 'text-text-muted';
      if (i < typed.length) {
        className = typed[i] === char ? 'text-text-primary' : 'text-red-400 bg-red-400/10';
      } else if (i === typed.length) {
        className = 'text-text-primary bg-hrsh-accent/30 rounded-sm';
      }
      return (
        <span key={i} className={className}>
          {char}
        </span>
      );
    });
  };

  // Render Multiplayer Leaderboard
  const renderLeaderboard = () => {
    if (!isMultiplayer) return null;
    
    // Sort players by rank or progress
    const sortedPlayers = [...roomPlayers]
      .filter(p => !p.isSpectator)
      .sort((a, b) => (b.progress || 0) - (a.progress || 0));

    return (
      <div className="bg-surface-raised border border-border-default rounded-xl p-4 mt-6 max-w-2xl mx-auto">
        <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-text-muted">Live Leaderboard</h3>
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {sortedPlayers.map((p, idx) => {
            const isMe = p.id === myPlayerId;
            const progressPct = Math.min(100, Math.max(0, (p.progress || 0) * 100));
            return (
              <div key={p.id} className={`flex items-center gap-3 p-2 rounded-lg ${isMe ? 'bg-hrsh-accent/10 border border-hrsh-accent/20' : 'bg-surface-base'}`}>
                <div className="font-mono text-sm w-6 font-bold text-text-muted">{p.rank || idx + 1}</div>
                <div className={`flex-1 font-medium ${isMe ? 'text-hrsh-accent' : 'text-text-primary'} truncate`}>
                  {p.name} {isMe && '(You)'} {p.finished && <span className="ml-2 text-xs text-status-success font-bold">FINISHED</span>}
                </div>
                <div className="flex flex-col items-end w-32">
                  <div className="text-xs font-mono font-semibold">{p.liveMetricValue || 0} WPM</div>
                  <div className="w-full bg-surface-overlay h-1.5 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-hrsh-accent transition-all duration-300" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-8">
      {/* Duration selector (only for solo) */}
      {!isMultiplayer && (
        <div className="flex justify-center gap-2 mb-4">
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => startGame(opt.seconds)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                duration === opt.seconds ? 'bg-hrsh-accent text-white' : 'bg-surface-overlay text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Stats bar */}
      <div className="flex justify-center gap-6 mb-4">
        <div className="text-center">
          <div className="font-mono text-2xl font-bold tabular-nums text-purple-400">{wpm}</div>
          <div className="text-xs text-text-muted">WPM</div>
        </div>
        <div className="text-center">
          <div className={`font-mono text-2xl font-bold tabular-nums ${accuracy >= 95 ? 'text-status-success' : accuracy >= 80 ? 'text-status-warning' : 'text-status-error'}`}>
            {accuracy}%
          </div>
          <div className="text-xs text-text-muted">Accuracy</div>
        </div>
        <div className="text-center">
          <div className={`font-mono text-2xl font-bold tabular-nums ${timeLeft <= 10 ? 'text-status-error' : 'text-text-primary'}`}>
            {timeLeft}s
          </div>
          <div className="text-xs text-text-muted">Time</div>
        </div>
      </div>

      {/* Text display */}
      <div className="bg-surface-raised border border-border-default rounded-xl p-4 sm:p-6 max-w-2xl mx-auto mb-4">
        <div className="font-mono text-sm sm:text-base leading-relaxed h-32 overflow-hidden select-none">
          {renderText()}
        </div>
      </div>

      {/* Hidden input */}
      <div className="max-w-2xl mx-auto">
        <input
          ref={inputRef}
          type="text"
          value={typed}
          onChange={handleInput}
          disabled={finished}
          className="w-full bg-surface-base border border-border-default rounded-xl px-4 py-3 font-mono text-sm text-text-primary focus:outline-none focus:border-hrsh-accent focus:ring-1 focus:ring-hrsh-accent transition-colors shadow-inner"
          placeholder={started ? '' : 'Start typing...'}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      {/* Controls hint */}
      {!started && !finished && (
        <div className="mt-3 text-center text-text-muted text-xs font-medium uppercase tracking-widest animate-pulse">
          Start typing to begin
        </div>
      )}
      
      {renderLeaderboard()}
    </div>
  );
}

export default TypingGame;
