import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import type { PlayerInfo } from '../../stores/roomStore';

interface TypingAreaProps {
  challengeText: string;
  isPaused: boolean;
  onProgressThrottled: (progress: number, wpm: number) => void;
  onFinish: (wpm: number, accuracy: number, duration: number) => void;
  onLocalStatsUpdate?: (wpm: number, accuracy: number, progress: number) => void;
  started: boolean;
  onFirstKeydown: () => void;
  roomPlayers?: PlayerInfo[];
  myPlayerId?: string;
}

export const TypingArea = memo(function TypingArea({ 
  challengeText, 
  isPaused, 
  onProgressThrottled, 
  onFinish,
  onLocalStatsUpdate,
  started,
  onFirstKeydown,
  roomPlayers,
  myPlayerId
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
  
  const activeCharRef = useRef<HTMLSpanElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Focus management
  useEffect(() => {
    if (started && !finished && !isPaused) {
      inputRef.current?.focus();
    }
  }, [started, finished, isPaused]);
  
  // Auto-scroll to active character
  useEffect(() => {
      if (activeCharRef.current && scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          const charElement = activeCharRef.current;
          
          const containerRect = container.getBoundingClientRect();
          const charRect = charElement.getBoundingClientRect();
          
          // If character is below the middle of the container, or above it
          if (charRect.bottom > containerRect.bottom - 40 || charRect.top < containerRect.top + 40) {
              charElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  }, [typed.length]);

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
    
    // Precompute remote player positions to avoid doing it per character
    const remoteCursors: Record<number, PlayerInfo[]> = {};
    if (roomPlayers) {
        roomPlayers.forEach(p => {
            if (p.id === myPlayerId || p.isSpectator || p.finished) return;
            const index = Math.min(challengeText.length - 1, Math.floor((p.progress || 0) * challengeText.length));
            if (!remoteCursors[index]) remoteCursors[index] = [];
            remoteCursors[index].push(p);
        });
    }
    
    return challengeText.split('').map((char, i) => {
      let className = 'text-text-muted';
      let customStyle: React.CSSProperties = {};
      let isCurrentChar = false;

      if (i < typed.length) {
        className = typed[i] === char ? 'text-text-primary font-medium' : 'text-red-400 bg-red-400/20 rounded-xs';
      } else if (i === typed.length && started && !isPaused && !finished) {
        isCurrentChar = true;
        className = `text-white font-bold rounded-xs relative ${
          caretStyle === 'block' ? 'bg-text-primary text-black' : caretStyle === 'underline' ? 'border-b-2' : 'border-l-2 animate-pulse'
        }`;
        customStyle = {
          backgroundColor: caretStyle === 'block' ? primaryColor : undefined,
          borderColor: primaryColor,
          boxShadow: `0 0 10px ${primaryColor}`
        };
      }
      
      const remotePlayersOnChar = remoteCursors[i];
      
      return (
        <span 
            key={i} 
            className={`${className} relative inline-block`} 
            style={customStyle}
            ref={isCurrentChar ? activeCharRef : null}
        >
          {char}
          
          {/* Render Remote Cursors */}
          {remotePlayersOnChar && remotePlayersOnChar.map((p, idx) => (
             <div 
                 key={p.id}
                 className="absolute -top-6 left-0 flex flex-col items-center pointer-events-none z-10 transition-all duration-200 ease-linear"
                 style={{ transform: `translateY(-${idx * 14}px)` }}
             >
                 <div className="bg-surface-overlay border text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap opacity-80"
                      style={{ borderColor: p.teamId ? 'var(--color-hrsh-accent)' : '#fff', color: p.teamId ? 'var(--color-hrsh-accent)' : '#fff' }}>
                     {p.name.substring(0, 6)}
                 </div>
                 <div className="w-0.5 h-6 bg-hrsh-accent/50 -mt-1"></div>
             </div>
          ))}
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
      <div 
        ref={scrollContainerRef}
        className={`${fontClass} text-sm sm:text-lg leading-relaxed h-32 sm:h-48 overflow-y-auto overflow-x-hidden select-none whitespace-pre-wrap break-words scrollbar-hide scroll-smooth relative pt-8 pb-16`}
      >
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
      
      {finished && !isPaused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-[fade-in_0.3s_ease-out] z-10 opacity-0">
          {/* Banner moved to TypingGame.tsx so text stays visible */}
        </div>
      )}
    </div>
  );
});
