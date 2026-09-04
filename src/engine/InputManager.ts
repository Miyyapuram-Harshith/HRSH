// ============================================================
// HRSH — Input Manager
// ============================================================
// Normalizes keyboard, mouse, touch, pointer, and gamepad
// inputs into logical game actions. Games receive device-
// agnostic events — they never need to know the input source.
// ============================================================

import type { InputDevice, InputEvent, InputHandler, LogicalAction } from '../types/game';

// Default keyboard mappings
const KEYBOARD_MAP: Record<string, LogicalAction> = {
  ArrowUp: 'MOVE_UP',
  ArrowDown: 'MOVE_DOWN',
  ArrowLeft: 'MOVE_LEFT',
  ArrowRight: 'MOVE_RIGHT',
  w: 'MOVE_UP',
  W: 'MOVE_UP',
  s: 'MOVE_DOWN',
  S: 'MOVE_DOWN',
  a: 'MOVE_LEFT',
  A: 'MOVE_LEFT',
  d: 'MOVE_RIGHT',
  D: 'MOVE_RIGHT',
  ' ': 'ACTION_PRIMARY',
  Enter: 'ACTION_PRIMARY',
  Escape: 'PAUSE',
  p: 'PAUSE',
  P: 'PAUSE',
  r: 'RESTART',
  R: 'RESTART',
  Backspace: 'BACK',
};

// Gamepad button mappings (standard layout)
const GAMEPAD_MAP: Record<number, LogicalAction> = {
  0: 'ACTION_PRIMARY',     // A / Cross
  1: 'ACTION_SECONDARY',   // B / Circle
  9: 'PAUSE',              // Start
  12: 'MOVE_UP',           // D-pad up
  13: 'MOVE_DOWN',         // D-pad down
  14: 'MOVE_LEFT',         // D-pad left
  15: 'MOVE_RIGHT',        // D-pad right
};

class InputManagerImpl {
  private handlers: Set<InputHandler> = new Set();
  private gamepadAnimFrame: number | null = null;
  private previousGamepadButtons: boolean[] = [];
  private customKeyMap: Record<string, LogicalAction> = {};
  private enabled = false;

  /**
   * Start listening for input events on the given element (or document).
   */
  start(element?: HTMLElement): void {
    if (this.enabled) return;
    this.enabled = true;

    const target = element || document;

    target.addEventListener('keydown', this.handleKeyDown as EventListener);
    window.addEventListener('gamepadconnected', this.handleGamepadConnected);

    this.startGamepadPolling();
  }

  /**
   * Stop listening for all input events.
   */
  stop(): void {
    this.enabled = false;

    document.removeEventListener('keydown', this.handleKeyDown as EventListener);
    window.removeEventListener('gamepadconnected', this.handleGamepadConnected);

    if (this.gamepadAnimFrame !== null) {
      cancelAnimationFrame(this.gamepadAnimFrame);
      this.gamepadAnimFrame = null;
    }
  }

  /**
   * Subscribe to logical input events.
   */
  subscribe(handler: InputHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  /**
   * Emit a logical action (used by touch controls, UI buttons, etc.)
   */
  emit(action: LogicalAction, device: InputDevice = 'touch'): void {
    if (!this.enabled) return;
    const event: InputEvent = {
      action,
      device,
      timestamp: performance.now(),
    };
    this.dispatch(event);
  }

  /**
   * Override default key mappings for a specific game.
   */
  setCustomKeyMap(map: Record<string, LogicalAction>): void {
    this.customKeyMap = map;
  }

  /**
   * Clear custom key mappings.
   */
  clearCustomKeyMap(): void {
    this.customKeyMap = {};
  }

  // ---- Private ----

  private dispatch(event: InputEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    // Check custom map first, then default
    const action = this.customKeyMap[e.key] || KEYBOARD_MAP[e.key];
    if (!action) return;

    // Prevent default browser behavior for game keys
    e.preventDefault();

    const event: InputEvent = {
      action,
      device: 'keyboard',
      timestamp: performance.now(),
      rawEvent: e,
    };
    this.dispatch(event);
  };

  private handleGamepadConnected = (): void => {
    if (!this.gamepadAnimFrame) {
      this.startGamepadPolling();
    }
  };

  private startGamepadPolling(): void {
    const poll = () => {
      if (!this.enabled) return;

      const gamepads = navigator.getGamepads?.();
      if (!gamepads) return;

      for (const gamepad of gamepads) {
        if (!gamepad) continue;
        this.processGamepad(gamepad);
      }

      this.gamepadAnimFrame = requestAnimationFrame(poll);
    };

    this.gamepadAnimFrame = requestAnimationFrame(poll);
  }

  private processGamepad(gamepad: Gamepad): void {
    // Check buttons (edge detection: only fire on press, not hold)
    gamepad.buttons.forEach((button, index) => {
      const wasPressed = this.previousGamepadButtons[index] || false;
      const isPressed = button.pressed;

      if (isPressed && !wasPressed) {
        const action = GAMEPAD_MAP[index];
        if (action) {
          this.dispatch({
            action,
            device: 'gamepad',
            timestamp: performance.now(),
          });
        }
      }

      this.previousGamepadButtons[index] = isPressed;
    });

    // Check left stick (with deadzone)
    const DEADZONE = 0.5;
    const lx = gamepad.axes[0] || 0;
    const ly = gamepad.axes[1] || 0;

    if (lx < -DEADZONE) this.emit('MOVE_LEFT', 'gamepad');
    if (lx > DEADZONE) this.emit('MOVE_RIGHT', 'gamepad');
    if (ly < -DEADZONE) this.emit('MOVE_UP', 'gamepad');
    if (ly > DEADZONE) this.emit('MOVE_DOWN', 'gamepad');
  }
}

export const InputManager = new InputManagerImpl();
