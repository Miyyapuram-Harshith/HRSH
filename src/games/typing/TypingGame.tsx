import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameComponentProps, GameResult } from '../../types/game';

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

function TypingGame({ onGameStart, onGameEnd, onScoreUpdate, isPaused }: GameComponentProps) {
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

  const startGame = useCallback((seconds: number) => {
    setDuration(seconds);
    setTimeLeft(seconds);
    setText(generateText(200));
    setTyped('');
    setStarted(false);
    setFinished(false);
    setWpm(0);
    setAccuracy(100);
    totalChars.current = 0;
    correctChars.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);

    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const endGame = useCallback(() => {
    setFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsed = (Date.now() - startTime.current) / 1000 / 60; // minutes
    const wordsTyped = correctChars.current / 5; // standard: 5 chars = 1 word
    const finalWpm = Math.round(wordsTyped / Math.max(elapsed, 0.01));
    const finalAccuracy = totalChars.current > 0
      ? Math.round((correctChars.current / totalChars.current) * 100)
      : 100;

    setWpm(finalWpm);
    setAccuracy(finalAccuracy);

    const result: GameResult = {
      gameId: 'typing',
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
  }, [duration, onGameEnd]);

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
        const remaining = Math.max(0, duration - elapsed);
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
    if (elapsed > 0.05) {
      const liveWpm = Math.round((correctChars.current / 5) / elapsed);
      setWpm(liveWpm);
      onScoreUpdate(liveWpm);
    }

    const liveAccuracy = totalChars.current > 0
      ? Math.round((correctChars.current / totalChars.current) * 100)
      : 100;
    setAccuracy(liveAccuracy);

    // Auto-end if typed all text
    if (value.length >= text.length) {
      endGame();
    }
  }, [started, finished, isPaused, text, duration, onGameStart, onScoreUpdate, endGame]);

  // Initialize
  useEffect(() => {
    startGame(60);
  }, [startGame]);

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

  return (
    <div>
      {/* Duration selector */}
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
          className="w-full bg-surface-base border border-border-default rounded-xl px-4 py-3 font-mono text-sm text-text-primary focus:outline-none focus:border-hrsh-accent focus:ring-1 focus:ring-hrsh-accent transition-colors"
          placeholder={started ? '' : 'Start typing...'}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      {/* Controls hint */}
      <div className="mt-3 text-center text-text-muted text-xs">
        Start typing to begin · Timer starts on first keystroke
      </div>
    </div>
  );
}

export default TypingGame;
