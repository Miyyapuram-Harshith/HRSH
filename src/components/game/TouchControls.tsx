import type { LogicalAction } from '../../types/game';
import { InputManager } from '../../engine/InputManager';

interface TouchControlsProps {
  type: 'dpad' | 'action' | 'dpad-action';
  onAction?: (action: LogicalAction) => void;
}

export function TouchControls({ type }: TouchControlsProps) {
  const emit = (action: LogicalAction) => {
    InputManager.emit(action, 'touch');
  };

  if (type === 'action') {
    return (
      <div className="flex justify-center lg:hidden mt-4">
        <button
          onTouchStart={(e) => { e.preventDefault(); emit('ACTION_PRIMARY'); }}
          onMouseDown={() => emit('ACTION_PRIMARY')}
          className="w-20 h-20 rounded-full bg-hrsh-accent/20 border-2 border-hrsh-accent/40 active:bg-hrsh-accent/40 active:scale-95 transition-all flex items-center justify-center text-hrsh-accent font-bold text-sm select-none"
          aria-label="Action"
        >
          TAP
        </button>
      </div>
    );
  }

  return (
    <div className="lg:hidden mt-4">
      <div className="flex justify-center">
        <div className="grid grid-cols-3 gap-1 w-fit">
          {/* Top row */}
          <div />
          <button
            onTouchStart={(e) => { e.preventDefault(); emit('MOVE_UP'); }}
            onMouseDown={() => emit('MOVE_UP')}
            className="w-14 h-14 rounded-xl bg-surface-overlay active:bg-surface-hover active:scale-95 transition-all flex items-center justify-center text-lg select-none"
            aria-label="Move up"
          >
            ▲
          </button>
          <div />

          {/* Middle row */}
          <button
            onTouchStart={(e) => { e.preventDefault(); emit('MOVE_LEFT'); }}
            onMouseDown={() => emit('MOVE_LEFT')}
            className="w-14 h-14 rounded-xl bg-surface-overlay active:bg-surface-hover active:scale-95 transition-all flex items-center justify-center text-lg select-none"
            aria-label="Move left"
          >
            ◀
          </button>
          <div />
          <button
            onTouchStart={(e) => { e.preventDefault(); emit('MOVE_RIGHT'); }}
            onMouseDown={() => emit('MOVE_RIGHT')}
            className="w-14 h-14 rounded-xl bg-surface-overlay active:bg-surface-hover active:scale-95 transition-all flex items-center justify-center text-lg select-none"
            aria-label="Move right"
          >
            ▶
          </button>

          {/* Bottom row */}
          <div />
          <button
            onTouchStart={(e) => { e.preventDefault(); emit('MOVE_DOWN'); }}
            onMouseDown={() => emit('MOVE_DOWN')}
            className="w-14 h-14 rounded-xl bg-surface-overlay active:bg-surface-hover active:scale-95 transition-all flex items-center justify-center text-lg select-none"
            aria-label="Move down"
          >
            ▼
          </button>
          <div />
        </div>

        {type === 'dpad-action' && (
          <div className="ml-8 flex items-center">
            <button
              onTouchStart={(e) => { e.preventDefault(); emit('ACTION_PRIMARY'); }}
              onMouseDown={() => emit('ACTION_PRIMARY')}
              className="w-14 h-14 rounded-full bg-hrsh-accent/20 border-2 border-hrsh-accent/40 active:bg-hrsh-accent/40 active:scale-95 transition-all flex items-center justify-center select-none"
              aria-label="Action"
            >
              ●
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
