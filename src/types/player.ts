// ============================================================
// HRSH — Player Type Definitions
// ============================================================

export interface Player {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  isPremium?: boolean;
}

export interface PlayerSettings {
  playerId: string;
  theme: 'dark' | 'light' | 'system';
  reducedMotion: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number;
  hapticFeedback: boolean;
}

export interface PersonalBest {
  id?: number;
  playerId: string;
  gameId: string;
  mode: string;
  score: number;
  data: Record<string, unknown>; // Game-specific best data (e.g., reaction time, WPM)
  achievedAt: number;
}

export interface GameHistoryEntry {
  id?: number;
  playerId: string;
  gameId: string;
  mode: string;
  score: number;
  won: boolean;
  duration: number;
  personalBest: boolean;
  data: Record<string, unknown>;
  playedAt: number;
}

export interface PlayerStreak {
  playerId: string;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string; // YYYY-MM-DD
  streakFreezes: number;
}

export interface PlayerStats {
  playerId: string;
  gamesPlayed: number;
  totalPlayTime: number;
  wins: number;
  losses: number;
  favoriteGameId: string | null;
}

export interface FavoriteGame {
  id?: number;
  playerId: string;
  gameId: string;
  addedAt: number;
}

export interface RecentGame {
  id?: number;
  playerId: string;
  gameId: string;
  lastPlayedAt: number;
  playCount: number;
}
