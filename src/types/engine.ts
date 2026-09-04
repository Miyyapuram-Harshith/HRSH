// ============================================================
// HRSH — Engine Type Definitions
// ============================================================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'gameplay' | 'milestone' | 'social' | 'challenge' | 'streak';
  gameId?: string; // null = platform-wide
  condition: AchievementCondition;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface AchievementCondition {
  type: 'event_count' | 'threshold' | 'streak' | 'speed' | 'custom';
  eventType?: string;
  gameId?: string;
  threshold?: number;
  comparator?: 'gte' | 'lte' | 'eq';
  customCheck?: string; // ID for custom achievement logic
}

export interface UnlockedAchievement {
  id?: number;
  playerId: string;
  achievementId: string;
  unlockedAt: number;
  gameId?: string;
  data?: Record<string, unknown>;
}

// ============================================================
// Analytics
// ============================================================

export type AnalyticsEventType =
  | 'HOME_VIEW'
  | 'GAME_OPEN'
  | 'GAME_START'
  | 'GAME_FINISH'
  | 'ROOM_CREATE'
  | 'ROOM_JOIN'
  | 'MATCH_START'
  | 'MATCH_FINISH'
  | 'CHALLENGE_CREATE'
  | 'CHALLENGE_ACCEPT'
  | 'SHARE'
  | 'REMATCH'
  | 'DAILY_CHALLENGE_PLAYED'
  | 'QUICK_PLAY'
  | 'PAGE_VIEW'
  | 'ACHIEVEMENT_UNLOCKED';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: number;
  data?: Record<string, unknown>;
}

// ============================================================
// Live Activity
// ============================================================

export interface LiveRoom {
  id: string;
  gameId: string;
  gameTitle: string;
  mode: string;
  currentPlayers: number;
  maxPlayers: number;
  status: 'lobby' | 'playing' | 'finished';
  spectators: number;
  joinable: boolean;
  watchable: boolean;
  icon: string;
}

// ============================================================
// Daily Challenge
// ============================================================

export interface DailyChallenge {
  id: string;
  gameId: string;
  mode: string;
  date: string; // YYYY-MM-DD
  seed: number;
  description: string;
  personalBest?: number;
  completed: boolean;
}

// ============================================================
// Multiplayer (interfaces for Phase 2+)
// ============================================================

export type RoomState =
  | 'created'
  | 'lobby'
  | 'ready'
  | 'countdown'
  | 'playing'
  | 'finished'
  | 'result'
  | 'closed';

export interface RoomSettings {
  gameId: string;
  mode: string;
  maxPlayers: number;
  visibility: 'private' | 'public';
  roomName?: string;
  spectatorsAllowed: boolean;
  autoStartWhenFull: boolean;
  countdownSeconds: number;
  rematchSameRoom: boolean;
}

export interface Room {
  id: string;
  code: string;
  settings: RoomSettings;
  state: RoomState;
  hostPlayerId: string;
  players: RoomPlayer[];
  spectators: number;
  createdAt: number;
}

export interface RoomPlayer {
  id: string;
  name: string;
  ready: boolean;
  connected: boolean;
  isHost: boolean;
}

// ============================================================
// Monetization (abstractions only)
// ============================================================

export type AdSlotPosition =
  | 'homepage-top'
  | 'homepage-mid'
  | 'game-info'
  | 'results'
  | 'leaderboard'
  | 'profile';

export interface AdSlotConfig {
  position: AdSlotPosition;
  width: number;
  height: number;
  enabled: boolean;
}
