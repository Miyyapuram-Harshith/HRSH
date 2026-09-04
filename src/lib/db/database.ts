// ============================================================
// HRSH — IndexedDB Database (Dexie)
// ============================================================

import Dexie, { type EntityTable } from 'dexie';
import type {
  PersonalBest,
  GameHistoryEntry,
  FavoriteGame,
  RecentGame,
  Player,
  PlayerSettings,
  PlayerStreak,
} from '../../types/player';
import type { UnlockedAchievement } from '../../types/engine';

const db = new Dexie('HRSHDatabase') as Dexie & {
  players: EntityTable<Player, 'id'>;
  settings: EntityTable<PlayerSettings, 'playerId'>;
  personalBests: EntityTable<PersonalBest, 'id'>;
  gameHistory: EntityTable<GameHistoryEntry, 'id'>;
  favorites: EntityTable<FavoriteGame, 'id'>;
  recentGames: EntityTable<RecentGame, 'id'>;
  achievements: EntityTable<UnlockedAchievement, 'id'>;
  streaks: EntityTable<PlayerStreak, 'playerId'>;
};

db.version(1).stores({
  players: 'id',
  settings: 'playerId',
  personalBests: '++id, playerId, [playerId+gameId+mode], gameId',
  gameHistory: '++id, playerId, [playerId+gameId], gameId, playedAt',
  favorites: '++id, playerId, [playerId+gameId]',
  recentGames: '++id, playerId, [playerId+gameId], lastPlayedAt',
  achievements: '++id, playerId, [playerId+achievementId], achievementId',
  streaks: 'playerId',
});

export { db };
