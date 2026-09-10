// ============================================================
// HRSH — Score Engine
// ============================================================
// Tracks personal bests, compares scores, and emits events
// for the achievement and analytics engines.
// ============================================================

import { db } from '../lib/db/database';
import type { GameResult, GameEvent } from '../types/game';
import type { PersonalBest, GameHistoryEntry, RecentGame } from '../types/player';
import { MomentEngine } from './MomentEngine';
import { HRSHCommentaryEngine } from './HRSHCommentaryEngine';

type EventCallback = (event: GameEvent) => void;

class ScoreEngineImpl {
  private listeners: Set<EventCallback> = new Set();

  subscribe(callback: EventCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private emit(event: GameEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  /**
   * Normalizes a raw GameResult into a safe, predictable structure.
   */
  normalizeGameResult(result: GameResult): GameResult {
    return {
      ...result,
      score: Number.isFinite(result.score) ? result.score : 0,
      duration: Number.isFinite(result.duration) ? result.duration : 0,
      moves: Number.isFinite(result.moves) ? result.moves : 0,
      outcome: result.won ? 'won' : 'finished',
      data: result.data || {},
      stats: result.stats || result.data || {},
      ranking: result.ranking || null,
      leaderboard: Array.isArray(result.leaderboard) ? result.leaderboard : [],
      achievements: Array.isArray(result.achievements) ? result.achievements : [],
      moments: Array.isArray(result.moments) ? result.moments : [],
      commentary: result.commentary || null,
    };
  }

  /**
   * Record a completed game result. Returns whether it was a personal best.
   */
  async recordResult(playerId: string, rawResult: GameResult): Promise<{ normalizedResult: GameResult, isPersonalBest: boolean }> {
    const result = this.normalizeGameResult(rawResult);

    // Check for personal best
    const currentBest = await this.getPersonalBest(playerId, result.gameId, result.mode);
    const isPersonalBest = !currentBest || result.score > currentBest.score;

    // Save to history
    const historyEntry: GameHistoryEntry = {
      playerId,
      gameId: result.gameId,
      mode: result.mode,
      score: result.score,
      won: result.won,
      duration: result.duration,
      personalBest: isPersonalBest,
      data: result.data,
      playedAt: Date.now(),
    };
    await db.gameHistory.add(historyEntry);

    // Update personal best if needed
    if (isPersonalBest) {
      const bestEntry: PersonalBest = {
        playerId,
        gameId: result.gameId,
        mode: result.mode,
        score: result.score,
        data: result.data,
        achievedAt: Date.now(),
      };

      if (currentBest?.id) {
        await db.personalBests.update(currentBest.id, {
          score: result.score,
          data: result.data,
          achievedAt: Date.now()
        });
      } else {
        await db.personalBests.add(bestEntry);
      }

      this.emit({
        type: 'PERSONAL_BEST',
        gameId: result.gameId,
        timestamp: Date.now(),
        data: { score: result.score, previousBest: currentBest?.score },
      });
    }

    // Update recent games
    await this.updateRecentGame(playerId, result.gameId);

    // Detect Moments
    const moments = MomentEngine.detectMoments(result);
    if (isPersonalBest && !moments.some(m => m.type === 'PERSONAL_BEST')) {
        moments.push({
            id: `moment_${Date.now()}_pb`,
            type: 'PERSONAL_BEST',
            gameId: result.gameId,
            timestamp: Date.now(),
        });
    }

    // Generate Commentary
    const commentary = HRSHCommentaryEngine.generateCommentary({
        gameId: result.gameId,
        result,
        moments,
        humorLevel: 'ROAST', // Defaulting to ROAST for fun, can be customized later
    });

    // Mutate result to make it accessible to UI safely
    result.moments = moments;
    result.commentary = commentary;
    result.data = {
        ...result.data,
        moments,
        commentary
    };

    // Emit game events
    this.emit({
      type: 'GAME_FINISHED',
      gameId: result.gameId,
      timestamp: Date.now(),
      data: { score: result.score, won: result.won, duration: result.duration, moments, commentary },
    });

    if (result.won) {
      this.emit({
        type: 'GAME_WON',
        gameId: result.gameId,
        timestamp: Date.now(),
        data: { score: result.score },
      });
    }

    // Return the normalized result along with isPersonalBest
    return { normalizedResult: result, isPersonalBest };
  }

  async getPersonalBest(playerId: string, gameId: string, mode: string): Promise<PersonalBest | undefined> {
    return db.personalBests
      .where({ playerId, gameId, mode })
      .first();
  }

  async getAllPersonalBests(playerId: string): Promise<PersonalBest[]> {
    return db.personalBests.where({ playerId }).toArray();
  }

  async getGameHistory(playerId: string, gameId?: string, limit = 20): Promise<GameHistoryEntry[]> {
    let query = db.gameHistory.where('playerId').equals(playerId);
    if (gameId) {
      query = db.gameHistory.where({ playerId, gameId });
    }
    return query.reverse().sortBy('playedAt').then((results) => results.slice(0, limit));
  }

  async getRecentGames(playerId: string, limit = 10): Promise<RecentGame[]> {
    return db.recentGames
      .where('playerId')
      .equals(playerId)
      .reverse()
      .sortBy('lastPlayedAt')
      .then((results) => results.slice(0, limit));
  }

  async getStats(playerId: string) {
    const history = await db.gameHistory.where('playerId').equals(playerId).toArray();
    const gamesPlayed = history.length;
    const wins = history.filter((h) => h.won).length;
    const totalPlayTime = history.reduce((sum, h) => sum + h.duration, 0);

    // Find favorite game (most played)
    const gameCounts: Record<string, number> = {};
    for (const h of history) {
      gameCounts[h.gameId] = (gameCounts[h.gameId] || 0) + 1;
    }
    const favoriteGameId = Object.entries(gameCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      gamesPlayed,
      wins,
      losses: gamesPlayed - wins,
      winRate: gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0,
      totalPlayTime,
      favoriteGameId,
    };
  }

  private async updateRecentGame(playerId: string, gameId: string): Promise<void> {
    const existing = await db.recentGames.where({ playerId, gameId }).first();
    if (existing?.id) {
      await db.recentGames.update(existing.id, {
        lastPlayedAt: Date.now(),
        playCount: (existing.playCount || 0) + 1,
      });
    } else {
      await db.recentGames.add({
        playerId,
        gameId,
        lastPlayedAt: Date.now(),
        playCount: 1,
      });
    }
  }
}

export const ScoreEngine = new ScoreEngineImpl();
