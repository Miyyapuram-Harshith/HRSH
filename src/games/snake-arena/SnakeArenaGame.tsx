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
        newDir = { x: 0, y: -1 };
        break;
      case 'ArrowDown':
      case 's':
        newDir = { x: 0, y: 1 };
        break;
      case 'ArrowLeft':
      case 'a':
        newDir = { x: -1, y: 0 };
        break;
      case 'ArrowRight':
      case 'd':
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
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted">Waiting for game state...</div>
      </div>
    );
  }

  const { gridSize, snakes, food, winner } = multiplayerState;
  
  // Use a fixed aspect ratio container
  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl mx-auto p-4 pb-20">
      
      {/* Game Header/Status */}
      <div className="mb-6 text-center h-16 w-full flex justify-between items-center px-4">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {snakes.map((s: any) => (
            <div key={s.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${s.isDead ? 'opacity-30 border-border-default' : 'border-border-accent bg-surface-raised'}`}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
              <div className="text-xs font-bold">
                {s.id === player?.id ? 'You' : s.id.substring(0,4)}
                {s.isDead && ' (Dead)'}
              </div>
              <div className="text-xs text-text-muted">{s.score}</div>
            </div>
          ))}
        </div>
        
        {winner && (
          <div className="text-xl font-bold animate-pulse text-hrsh-accent ml-4 whitespace-nowrap">
            {winner === player?.id ? 'Victory!' : 'Match Over'}
          </div>
        )}
      </div>

      {/* Board */}
      <div className="bg-surface-base p-1 sm:p-2 rounded-xl shadow-inner border border-border-default relative select-none w-full max-w-[600px] aspect-square">
        {/* Render Grid cells conceptually using absolute positioning for performance */}
        {snakes.map((s: any) => (
          !s.isDead && s.body.map((segment: any, i: number) => (
            <div
              key={`${s.id}-${i}`}
              className="absolute rounded-sm transition-all duration-75"
              style={{
                left: `${(segment.x / gridSize.w) * 100}%`,
                top: `${(segment.y / gridSize.h) * 100}%`,
                width: `${100 / gridSize.w}%`,
                height: `${100 / gridSize.h}%`,
                backgroundColor: s.color,
                opacity: i === 0 ? 1 : 0.8,
                zIndex: i === 0 ? 10 : 5
              }}
            />
          ))
        ))}

        {/* Render Food */}
        {food && (
          <div
            className="absolute rounded-full bg-status-danger shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"
            style={{
              left: `${(food.x / gridSize.w) * 100}%`,
              top: `${(food.y / gridSize.h) * 100}%`,
              width: `${100 / gridSize.w}%`,
              height: `${100 / gridSize.h}%`,
            }}
          />
        )}
      </div>

      <div className="mt-4 text-xs text-text-muted">Use WASD or Arrow Keys to move</div>
    </div>
  );
}
