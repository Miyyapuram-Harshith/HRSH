import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { usePlayerStore } from '../../stores/playerStore';

interface TypingAreaProps {
  challengeText: string;
  isPaused: boolean;
  onProgressThrottled: (progress: number, wpm: number) => void;
  onFinish: (wpm: number, accuracy: number, duration: number) => void;
  onLocalStatsUpdate?: (wpm: number, accuracy: number, progress: number) => void;
  started: boolean;
  onFirstKeydown: () => void;
}

export const TypingArea = memo(function TypingArea({ 
  challengeText, 
  isPaused, 
  onProgressThrottled, 
  onFinish,
  onLocalStatsUpdate,
  started,
  onFirstKeydown
}: TypingAreaProps) {
  const { settings } = usePlayerStore();
  const customization = (settings as any)?.customizations?.['typing'] || {};
  const fontStyle = customization.fontStyle || 'mono';
  const primaryColor = customization.primaryColor || '#8b5cf6';
  const caretStyle = customization.caretStyle || 'line';

  const [typed, setTyped] = useState('');
  const [finished, setFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const startTime = useRef(0);
  const totalChars = useRef(0);
  const correctChars = useRef(0);
  const lastProgressSentTime = useRef(0);

  // Focus management
  useEffect(() => {
    if (started && !finished && !isPaused) {
      inputRef.current?.focus();
    }
  }, [started, finished, isPaused]);

  // Click to focus
  const handleAreaClick = () => {
    if (!finished && !isPaused) {
      inputRef.current?.focus();
    }
  };

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (finished || isPaused) return;

    const value = e.target.value;

    if (!started) {
      startTime.current = Date.now();
      onFirstKeydown();
    }

    setTyped(value);

    // Calculate stats
    totalChars.current = value.length;
    correctChars.current = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === challengeText[i]) correctChars.current++;
    }

    const elapsedMins = (Date.now() - startTime.current) / 1000 / 60;
    let liveWpm = 0;
    if (elapsedMins > 0.05) {
      liveWpm = Math.round((correctChars.current / 5) / elapsedMins);
    }

    const liveAccuracy = totalChars.current > 0
      ? Math.round((correctChars.current / totalChars.current) * 100)
      : 100;
      
    const progress = Math.min(1, totalChars.current / Math.max(1, challengeText.length));

    // Update local UI (fast)
    if (onLocalStatsUpdate) {
      onLocalStatsUpdate(liveWpm, liveAccuracy, progress);
    }

    // Throttle progress updates to server (5 times a second)
    const now = Date.now();
    if (now - lastProgressSentTime.current > 200) {
      onProgressThrottled(progress, liveWpm);
      lastProgressSentTime.current = now;
    }

    // Auto-end if typed all text
    if (value.length >= challengeText.length) {
      setFinished(true);
      const finalElapsed = Date.now() - startTime.current;
      onFinish(liveWpm, liveAccuracy, finalElapsed);
      // Final flush
      onProgressThrottled(1, liveWpm);
    }
  }, [finished, isPaused, started, challengeText, onFirstKeydown, onLocalStatsUpdate, onProgressThrottled, onFinish]);

  const fontClass = fontStyle === 'sans' ? 'font-sans' : fontStyle === 'serif' ? 'font-serif' : fontStyle === 'terminal' ? 'font-mono tracking-wider' : 'font-mono';

  // Render text with highlighting
  const renderText = () => {
    if (!challengeText) return null;
    
    return challengeText.split('').map((char, i) => {
      let className = 'text-text-muted';
      let customStyle: React.CSSProperties = {};

      if (i < typed.length) {
        className = typed[i] === char ? 'text-text-primary font-medium' : 'text-red-400 bg-red-400/20 rounded-xs';
      } else if (i === typed.length && started && !isPaused && !finished) {
        className = `text-white font-bold rounded-xs relative ${
          caretStyle === 'block' ? 'bg-text-primary text-black' : caretStyle === 'underline' ? 'border-b-2' : 'border-l-2 animate-pulse'
        }`;
        customStyle = {
          backgroundColor: caretStyle === 'block' ? primaryColor : undefined,
          borderColor: primaryColor,
          boxShadow: `0 0 10px ${primaryColor}`
        };
      }
      return (
        <span key={i} className={className} style={customStyle}>
          {char}
        </span>
      );
    });
  };

  return (
    <div 
      className={`bg-surface-raised border rounded-xl p-4 sm:p-6 mb-4 relative transition-colors cursor-text ${
        isPaused ? 'border-border-default opacity-50' : 'border-hrsh-accent/30 shadow-[0_0_15px_rgba(var(--hrsh-accent-rgb),0.1)]'
      }`}
      onClick={handleAreaClick}
    >
      <div className={`${fontClass} text-sm sm:text-lg leading-relaxed h-32 overflow-hidden select-none whitespace-pre-wrap break-words`}>
        {renderText()}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={typed}
        onChange={handleInput}
        disabled={finished || isPaused}
        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-text"
        placeholder=""
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      
      {!started && !finished && !isPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-base/40 backdrop-blur-[1px] rounded-xl pointer-events-none">
          <div className="text-center bg-surface-raised border border-border-default px-6 py-2 rounded-full text-text-muted text-sm font-bold uppercase tracking-widest animate-pulse shadow-lg">
            Type here to begin
          </div>
        </div>
      )}
      
      {finished && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-base/80 backdrop-blur-sm rounded-xl pointer-events-none animate-[fade-in_0.3s_ease-out]">
          <div className="flex flex-col items-center">
            <span className="text-4xl mb-2">🏁</span>
            <div className="text-xl font-bold text-text-primary">Finished!</div>
            <div className="text-sm font-medium text-text-muted mt-1">Waiting for others...</div>
          </div>
        </div>
      )}
    </div>
  );
});
