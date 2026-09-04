import type { LogicalAction } from '../../types/game';
import { InputManager } from '../../engine/InputManager';

interface TouchControlsProps {
  type: 'dpad' | 'action' | 'dpad-action';
  onAction?: (action: LogicalAction) => void;
}

function vibrate(ms = 10) {
  if (navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

export function TouchControls({ type }: TouchControlsProps) {
  const emit = (action: LogicalAction) => {
    vibrate(10);
    InputManager.emit(action, 'touch');
  };

  if (type === 'action') {
    return (
      <div className="flex justify-center lg:hidden mt-4">
        <button
          onTouchStart={(e) => { e.preventDefault(); emit('ACTION_PRIMARY'); }}
          onMouseDown={() => emit('ACTION_PRIMARY')}
          className="w-20 h-20 rounded-full bg-hrsh-accent/20 border-2 border-hrsh-accent/40 active:bg-hrsh-accent/40 active:scale-90 transition-all flex items-center justify-center text-hrsh-accent font-bold text-sm select-none touch-none"
          aria-label="Action"
        >
          TAP
        </button>
      </div>
    );
  }

  const dpadButton = (action: LogicalAction, ariaLabel: string, symbol: string) => (
    <button
      onTouchStart={(e) => { e.preventDefault(); emit(action); }}
      onMouseDown={() => emit(action)}
      className="w-14 h-14 rounded-xl bg-surface-overlay border border-border-default active:bg-hrsh-accent/20 active:border-hrsh-accent/40 active:scale-90 transition-all flex items-center justify-center text-lg select-none touch-none"
      aria-label={ariaLabel}
    >
      {symbol}
    </button>
  );

  return (
    <div className="lg:hidden mt-4">
      <div className="flex justify-center">
        <div className="grid grid-cols-3 gap-1.5 w-fit">
          {/* Top row */}
          <div />
          {dpadButton('MOVE_UP', 'Move up', '▲')}
          <div />

          {/* Middle row */}
          {dpadButton('MOVE_LEFT', 'Move left', '◀')}
          <div />
          {dpadButton('MOVE_RIGHT', 'Move right', '▶')}

          {/* Bottom row */}
          <div />
          {dpadButton('MOVE_DOWN', 'Move down', '▼')}
          <div />
        </div>

        {type === 'dpad-action' && (
          <div className="ml-8 flex items-center">
            <button
              onTouchStart={(e) => { e.preventDefault(); emit('ACTION_PRIMARY'); }}
              onMouseDown={() => emit('ACTION_PRIMARY')}
              className="w-14 h-14 rounded-full bg-hrsh-accent/20 border-2 border-hrsh-accent/40 active:bg-hrsh-accent/40 active:scale-90 transition-all flex items-center justify-center select-none touch-none"
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
