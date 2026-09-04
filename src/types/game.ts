// ============================================================
// HRSH — Game Type Definitions
// ============================================================

export type GameCategory = 'solo' | 'duels' | 'party' | 'chaos' | 'showpiece';
export type GameDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type GameStatus = 'idle' | 'ready' | 'playing' | 'paused' | 'finished';
export type InputDevice = 'keyboard' | 'mouse' | 'touch' | 'gamepad';

export interface GameMode {
  id: string;
  label: string;
  description?: string;
}

export interface GameControls {
  keyboard?: string[];
  touch?: boolean;
  mouse?: boolean;
  gamepad?: boolean;
}

export interface RoomConfig {
  visibility: ('private' | 'public')[];
  spectators: boolean;
  autoStart: boolean;
  countdown: number[];
  rematch: boolean;
}

export interface GameMetadata {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  category: GameCategory;
  multiplayer: boolean;
  minPlayers: number;
  maxPlayers: number;
  defaultMaxPlayers?: number;
  difficulty?: GameDifficulty;
  modes: GameMode[];
  controls: GameControls;
  room?: RoomConfig;
  tags: string[];
  color: string; // Accent color for the game
  icon: string;  // Emoji icon
  component: () => Promise<{ default: React.ComponentType<GameComponentProps> }>;
}

export interface GameState {
  status: GameStatus;
  score: number;
  startedAt: number | null;
  finishedAt: number | null;
  duration: number;
  moves: number;
  data: Record<string, unknown>; // Game-specific state
}

export interface GameResult {
  gameId: string;
  mode: string;
  score: number;
  won: boolean;
  duration: number;
  moves: number;
  personalBest: boolean;
  data: Record<string, unknown>; // Game-specific result data
  timestamp: number;
}

export interface GameComponentProps {
  mode?: string;
  onGameStart: () => void;
  onGameEnd: (result: GameResult) => void;
  onScoreUpdate: (score: number) => void;
  onPause: () => void;
  onResume: () => void;
  isPaused: boolean;
  multiplayerState?: any;
  multiplayerRole?: 'player1' | 'player2' | 'spectator';
  onMultiplayerAction?: (action: any) => void;
}

// ============================================================
// Input System
// ============================================================

export type LogicalAction =
  | 'MOVE_UP'
  | 'MOVE_DOWN'
  | 'MOVE_LEFT'
  | 'MOVE_RIGHT'
  | 'ACTION_PRIMARY'
  | 'ACTION_SECONDARY'
  | 'PAUSE'
  | 'RESTART'
  | 'BACK';

export interface InputEvent {
  action: LogicalAction;
  device: InputDevice;
  timestamp: number;
  rawEvent?: Event;
}

export type InputHandler = (event: InputEvent) => void;

// ============================================================
// Game Events (for AchievementEngine, Analytics, etc.)
// ============================================================

export type GameEventType =
  | 'GAME_STARTED'
  | 'GAME_FINISHED'
  | 'GAME_WON'
  | 'GAME_LOST'
  | 'PERSONAL_BEST'
  | 'STREAK_UPDATED'
  | 'PERFECT_GAME'
  | 'FAST_FINISH'
  | 'FIRST_PLAY'
  | 'MILESTONE_SCORE';

export interface GameEvent {
  type: GameEventType;
  gameId: string;
  timestamp: number;
  data: Record<string, unknown>;
}
