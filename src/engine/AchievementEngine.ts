// ============================================================
// HRSH — Achievement Engine
// ============================================================
// Event-driven achievement evaluation. Achievements are defined
// in data, not hardcoded per game. The engine subscribes to
// game events from ScoreEngine and evaluates conditions.
// ============================================================

import { db } from '../lib/db/database';
import type { GameEvent } from '../types/game';
import type { Achievement, UnlockedAchievement } from '../types/engine';
import { ACHIEVEMENTS } from '../data/achievements';

type AchievementCallback = (achievement: Achievement) => void;

class AchievementEngineImpl {
  private unlockListeners: Set<AchievementCallback> = new Set();
  private eventCounts: Map<string, number> = new Map();

  onUnlock(callback: AchievementCallback): () => void {
    this.unlockListeners.add(callback);
    return () => this.unlockListeners.delete(callback);
  }

  /**
   * Process a game event and check for new achievement unlocks.
   */
  async processEvent(playerId: string, event: GameEvent): Promise<Achievement[]> {
    // Update event counts
    const key = `${event.type}:${event.gameId}`;
    const globalKey = `${event.type}:*`;
    this.eventCounts.set(key, (this.eventCounts.get(key) || 0) + 1);
    this.eventCounts.set(globalKey, (this.eventCounts.get(globalKey) || 0) + 1);

    const unlocked: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      // Skip if already unlocked
      const existing = await db.achievements.where({
        playerId,
        achievementId: achievement.id,
      }).first();
      if (existing) continue;

      // Check if game-specific achievement matches the current game
      if (achievement.gameId && achievement.gameId !== event.gameId) continue;

      // Evaluate condition
      const met = this.evaluateCondition(achievement, event);
      if (met) {
        const unlock: UnlockedAchievement = {
          playerId,
          achievementId: achievement.id,
          unlockedAt: Date.now(),
          gameId: event.gameId,
          data: event.data,
        };
        await db.achievements.add(unlock);
        unlocked.push(achievement);

        for (const listener of this.unlockListeners) {
          listener(achievement);
        }
      }
    }

    return unlocked;
  }

  async getUnlockedAchievements(playerId: string): Promise<UnlockedAchievement[]> {
    return db.achievements.where('playerId').equals(playerId).toArray();
  }

  async getUnlockedCount(playerId: string): Promise<number> {
    return db.achievements.where('playerId').equals(playerId).count();
  }

  getAllAchievements(): Achievement[] {
    return ACHIEVEMENTS;
  }

  private evaluateCondition(achievement: Achievement, event: GameEvent): boolean {
    const { condition } = achievement;

    switch (condition.type) {
      case 'event_count': {
        const eventKey = achievement.gameId
          ? `${condition.eventType}:${achievement.gameId}`
          : `${condition.eventType}:*`;
        const count = this.eventCounts.get(eventKey) || 0;
        return count >= (condition.threshold || 1);
      }

      case 'threshold': {
        if (event.type !== condition.eventType) return false;
        const value = event.data[Object.keys(event.data)[0]] as number;
        switch (condition.comparator) {
          case 'gte': return value >= (condition.threshold || 0);
          case 'lte': return value <= (condition.threshold || 0);
          case 'eq': return value === condition.threshold;
          default: return value >= (condition.threshold || 0);
        }
      }

      case 'streak': {
        if (event.type !== 'STREAK_UPDATED') return false;
        const streak = event.data.currentStreak as number;
        return streak >= (condition.threshold || 1);
      }

      case 'speed': {
        if (event.type !== 'GAME_FINISHED') return false;
        const duration = event.data.duration as number;
        return duration <= (condition.threshold || 0);
      }

      default:
        return false;
    }
  }

  /**
   * Initialize event counts from stored history. Call on app start.
   */
  async initialize(playerId: string): Promise<void> {
    const history = await db.gameHistory.where('playerId').equals(playerId).toArray();

    for (const entry of history) {
      const finishKey = `GAME_FINISHED:${entry.gameId}`;
      const globalFinishKey = `GAME_FINISHED:*`;
      this.eventCounts.set(finishKey, (this.eventCounts.get(finishKey) || 0) + 1);
      this.eventCounts.set(globalFinishKey, (this.eventCounts.get(globalFinishKey) || 0) + 1);

      if (entry.won) {
        const winKey = `GAME_WON:${entry.gameId}`;
        const globalWinKey = `GAME_WON:*`;
        this.eventCounts.set(winKey, (this.eventCounts.get(winKey) || 0) + 1);
        this.eventCounts.set(globalWinKey, (this.eventCounts.get(globalWinKey) || 0) + 1);
      }
    }
  }
}

export const AchievementEngine = new AchievementEngineImpl();
