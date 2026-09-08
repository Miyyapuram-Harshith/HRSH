// ============================================================
// HRSH — Player Service
// ============================================================
// Manages anonymous local player identity. No fake auth.
// Uses IndexedDB for persistence.
// ============================================================

import { db } from '../db/database';
import type { Player, PlayerSettings, PlayerStreak } from '../../types/player';

function generateId(): string {
  return crypto.randomUUID();
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export class PlayerService {
  /**
   * Get or create the local player.
   */
  static async getOrCreatePlayer(): Promise<Player> {
    let player: Player | undefined;
    const players = await db.players.toArray();
    
    if (players.length > 0) {
      player = players[0];
    } else {
      // First visit — create anonymous player
      player = {
        id: generateId(),
        name: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await db.players.add(player);

      // Create default settings
      const settings: PlayerSettings = {
        playerId: player.id,
        theme: 'dark',
        reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false,
        soundEnabled: true,
        musicEnabled: false,
        volume: 0.7,
        hapticFeedback: true,
      };
      await db.settings.add(settings);
    }
    
    // Sync with D1 backend
    try {
      const URL_BASE = import.meta.env.PROD 
        ? window.location.origin
        : 'http://localhost:8787';
      const res = await fetch(`${URL_BASE}/api/player/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: player.id, name: player.name })
      });
      if (res.ok) {
        const remotePlayer = await res.json();
        // Merge XP, level, games_played from remote
        await db.players.update(player.id, {
          xp: remotePlayer.xp,
          level: remotePlayer.level,
          gamesPlayed: remotePlayer.games_played,
          wins: remotePlayer.wins,
          losses: remotePlayer.losses,
          title: remotePlayer.title
        });
        player = await db.players.get(player.id) as Player;
      }
    } catch (err) {
      console.warn("Failed to sync player profile with server:", err);
    }
    
    return player;
  }

  static async updateName(playerId: string, name: string): Promise<Player> {
    await db.players.update(playerId, { name, updatedAt: Date.now() });
    const player = await db.players.get(playerId);
    if (!player) throw new Error('Player not found');
    return player;
  }

  static async setPremium(playerId: string, isPremium: boolean): Promise<Player> {
    await db.players.update(playerId, { isPremium, updatedAt: Date.now() });
    const player = await db.players.get(playerId);
    if (!player) throw new Error('Player not found');
    return player;
  }

  static async getSettings(playerId: string): Promise<PlayerSettings | undefined> {
    return db.settings.get(playerId);
  }

  static async updateSettings(playerId: string, updates: Partial<PlayerSettings>): Promise<void> {
    await db.settings.update(playerId, updates);
  }

  // ---- Streak ----

  static async updateStreak(playerId: string): Promise<PlayerStreak> {
    let streak = await db.streaks.get(playerId);
    if (!streak) {
      streak = {
        playerId,
        currentStreak: 0,
        longestStreak: 0,
        lastPlayedDate: '',
        streakFreezes: 0,
      };
      await db.streaks.add(streak);
    }

    const today = getTodayString();
    
    if (streak.lastPlayedDate === today) {
      // Already played today
      return streak;
    }

    // Check if missed days can be covered by freezes
    if (streak.lastPlayedDate !== '') {
      const lastDate = new Date(streak.lastPlayedDate);
      const currDate = new Date(today);
      const diffDays = Math.floor((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        // Perfect streak continues
        streak.currentStreak += 1;
      } else if (diffDays > 1) {
        // Missed one or more days
        const missedDays = diffDays - 1;
        if (streak.streakFreezes >= missedDays) {
          // Consume freezes
          streak.streakFreezes -= missedDays;
          streak.currentStreak += 1; // Count today
        } else {
          // Streak broken
          streak.currentStreak = 1;
        }
      }
    } else {
      // First ever play
      streak.currentStreak = 1;
    }

    streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    streak.lastPlayedDate = today;

    await db.streaks.update(playerId, streak);
    return streak;
  }

  static async getStreak(playerId: string): Promise<PlayerStreak | undefined> {
    return db.streaks.get(playerId);
  }

  static async addStreakFreeze(playerId: string): Promise<PlayerStreak> {
    let streak = await db.streaks.get(playerId);
    if (!streak) {
      streak = {
        playerId,
        currentStreak: 0,
        longestStreak: 0,
        lastPlayedDate: '',
        streakFreezes: 0,
      };
      await db.streaks.add(streak);
    }
    streak.streakFreezes += 1;
    await db.streaks.update(playerId, streak);
    return streak;
  }

  // ---- Favorites ----

  static async toggleFavorite(playerId: string, gameId: string): Promise<boolean> {
    const existing = await db.favorites.where({ playerId, gameId }).first();
    if (existing?.id) {
      await db.favorites.delete(existing.id);
      return false;
    } else {
      await db.favorites.add({ playerId, gameId, addedAt: Date.now() });
      return true;
    }
  }

  static async isFavorite(playerId: string, gameId: string): Promise<boolean> {
    const count = await db.favorites.where({ playerId, gameId }).count();
    return count > 0;
  }

  static async getFavorites(playerId: string): Promise<string[]> {
    const favs = await db.favorites.where('playerId').equals(playerId).toArray();
    return favs.map((f) => f.gameId);
  }

  /**
   * Check if this is the player's first visit (no name set).
   */
  static async isFirstVisit(playerId: string): Promise<boolean> {
    const player = await db.players.get(playerId);
    return !player?.name;
  }
}
