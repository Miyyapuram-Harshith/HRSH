import { useEffect, useCallback } from 'react';
import type { GameComponentProps } from '../../types/game';
import { usePlayerStore } from '../../stores/playerStore';

export default function SnakeArenaGame({ multiplayerState, onMultiplayerAction }: GameComponentProps) {
  const { player } = usePlayerStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!multiplayerState || multiplayerState.winner) return;

    let newDir = null;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        newDir = { x: 0, y: -1 };
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        newDir = { x: 0, y: 1 };
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        newDir = { x: -1, y: 0 };
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        newDir = { x: 1, y: 0 };
        break;
    }

    if (newDir && onMultiplayerAction) {
      onMultiplayerAction({ type: 'CHANGE_DIR', dir: newDir });
    }
  }, [multiplayerState, onMultiplayerAction]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!multiplayerState) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <div className="w-8 h-8 border-2 border-hrsh-accent border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-text-muted text-sm font-medium">Waiting for arena state...</div>
      </div>
    );
  }

  const gridSize = multiplayerState.gridSize || { w: 40, h: 40 };
  const snakes = Array.isArray(multiplayerState.snakes) ? multiplayerState.snakes : [];
  const food = multiplayerState.food;
  const winner = multiplayerState.winner;
  
  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl mx-auto p-4 pb-20">
      
      {/* Game Header/Status */}
      <div className="mb-6 text-center h-16 w-full flex justify-between items-center px-4 bg-surface-base/50 rounded-2xl border border-border-default">
        <div className="flex gap-3 overflow-x-auto py-2">
          {snakes.map((s: any) => (
            <div key={s.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${s.isDead ? 'opacity-30 border-border-default bg-surface-base' : 'border-border-accent bg-surface-raised shadow-xs'}`}>
              <div
                className="w-3.5 h-3.5 rounded-full shadow-xs"
                style={{
                  backgroundColor: s.color || '#22c55e',
                  boxShadow: s.trail === 'glow' || s.skin === 'neon' ? `0 0 8px ${s.color || '#22c55e'}` : undefined
                }}
              />
              <div className="text-xs font-bold">
                {s.id === player?.id ? 'You' : (s.name || s.id.substring(0, 4))}
                {s.isDead && ' (Dead)'}
              </div>
              <div className="text-xs font-mono text-text-muted font-bold">{s.score ?? 0}</div>
            </div>
          ))}
        </div>
        
        {winner && (
          <div className="text-lg font-black animate-pulse text-hrsh-accent ml-4 whitespace-nowrap px-4 py-1.5 bg-hrsh-accent/10 border border-hrsh-accent/20 rounded-xl">
            {winner === player?.id ? '🏆 VICTORY!' : 'MATCH OVER'}
          </div>
        )}
      </div>

      {/* Arena Board */}
      <div className="bg-surface-base p-1 sm:p-2 rounded-2xl shadow-2xl border border-border-default relative select-none w-full max-w-[600px] aspect-square overflow-hidden" style={{ touchAction: 'none', overscrollBehavior: 'none' }}>
        {/* Render Snake Segments */}
        {snakes.map((s: any) => (
          !s.isDead && Array.isArray(s.body) && s.body.map((segment: any, i: number) => {
            const isHead = i === 0;
            const snakeColor = s.color || '#22c55e';
            return (
              <div
                key={`${s.id}-${i}`}
                className="absolute rounded-sm transition-all duration-75 flex items-center justify-center"
                style={{
                  left: `${(segment.x / gridSize.w) * 100}%`,
                  top: `${(segment.y / gridSize.h) * 100}%`,
                  width: `${100 / gridSize.w}%`,
                  height: `${100 / gridSize.h}%`,
                  backgroundColor: snakeColor,
                  opacity: isHead ? 1 : 0.85,
                  zIndex: isHead ? 10 : 5,
                  boxShadow: (s.trail === 'glow' || s.skin === 'neon') && isHead ? `0 0 8px ${snakeColor}` : undefined
                }}
              >
                {/* Eyes on Head */}
                {isHead && (
                  <div className="flex gap-0.5 pointer-events-none">
                    <div className="w-1 h-1 rounded-full bg-white shadow-xs" />
                    <div className="w-1 h-1 rounded-full bg-white shadow-xs" />
                  </div>
                )}
              </div>
            );
          })
        ))}

        {/* Render Food */}
        {food && (
          <div
            className="absolute rounded-full bg-status-danger shadow-[0_0_10px_rgba(239,68,68,0.9)] animate-pulse"
            style={{
              left: `${(food.x / gridSize.w) * 100}%`,
              top: `${(food.y / gridSize.h) * 100}%`,
              width: `${100 / gridSize.w}%`,
              height: `${100 / gridSize.h}%`,
            }}
          />
        )}
      </div>

      <div className="mt-4 text-xs text-text-muted font-medium">Use WASD or Arrow Keys to navigate your snake</div>
    </div>
  );
}

