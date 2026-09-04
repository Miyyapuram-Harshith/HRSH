import { useMemo } from 'react';

type BlipState = 'idle' | 'alert' | 'celebrating' | 'loading';

interface BlipProps {
  state?: BlipState;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export function Blip({ state = 'idle', size = 48, className = '', onClick }: BlipProps) {
  // Blip is built out of geometric shapes.
  
  const faceState = useMemo(() => {
    switch (state) {
      case 'alert':
        return (
          <>
            <path d="M14 20 L24 24 L34 20" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="16" cy="14" r="3" fill="#f87171" />
            <circle cx="32" cy="14" r="3" fill="#f87171" />
          </>
        );
      case 'celebrating':
        return (
          <>
            <path d="M14 14 Q24 24 34 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M12 12 L16 8 M36 12 L32 8" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="14" r="2" fill="white" />
            <circle cx="32" cy="14" r="2" fill="white" />
          </>
        );
      case 'loading':
        return (
          <>
            <path d="M16 18 Q24 22 32 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="16" cy="14" r="2" fill="white" className="animate-pulse" />
            <circle cx="32" cy="14" r="2" fill="white" className="animate-pulse stagger-2" />
          </>
        );
      case 'idle':
      default:
        return (
          <>
            <path d="M18 20 Q24 24 30 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="16" cy="14" r="2.5" fill="white" />
            <circle cx="32" cy="14" r="2.5" fill="white" />
          </>
        );
    }
  }, [state]);

  const wrapperClass = `
    relative inline-flex items-center justify-center 
    transition-hrsh ${onClick ? 'cursor-pointer hover-lift active-press' : ''} 
    ${state === 'celebrating' ? 'animate-bounce-in' : ''}
    ${state === 'alert' ? 'animate-pulse-soft' : ''}
    ${className}
  `;

  return (
    <div className={wrapperClass} onClick={onClick} style={{ width: size, height: size }}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={state === 'loading' ? 'animate-spin' : ''}
        style={{ animationDuration: state === 'loading' ? '3s' : undefined }}
      >
        <rect x="4" y="4" width="40" height="40" rx="12" fill="var(--color-hrsh-accent)" className="glow-border" />
        <rect x="8" y="8" width="32" height="32" rx="8" fill="var(--color-hrsh-accent-hover)" />
        {faceState}
        {state === 'celebrating' && (
          <path d="M4 24 L8 24 M40 24 L44 24 M24 4 L24 8 M24 40 L24 44" stroke="#fefce8" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
        )}
      </svg>
    </div>
  );
}
