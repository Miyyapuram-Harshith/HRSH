// ============================================================
// HRSH — Leaderboard Engine (Local-first)
// ============================================================

import { db } from '../lib/db/database';

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  achievedAt: number;
  gameId: string;
  mode: string;
}

class LeaderboardEngineImpl {
  /**
   * Get top scores for a game/mode
   */
  async getLeaderboard(gameId: string, mode: string, limit = 10): Promise<LeaderboardEntry[]> {
    const bests = await db.personalBests
      .where({ gameId, mode })
      .toArray();

    // Sort by score descending
    bests.sort((a, b) => b.score - a.score);
    const top = bests.slice(0, limit);

    const entries: LeaderboardEntry[] = [];
    for (let i = 0; i < top.length; i++) {
      const pb = top[i];
      const player = await db.players.get(pb.playerId);
      entries.push({
        rank: i + 1,
        playerId: pb.playerId,
        playerName: player?.name || 'Anonymous',
        score: pb.score,
        achievedAt: pb.achievedAt,
        gameId: pb.gameId,
        mode: pb.mode,
      });
    }

    return entries;
  }

  /**
   * Get player's rank for a specific game/mode
   */
  async getPlayerRank(playerId: string, gameId: string, mode: string): Promise<number | null> {
    const bests = await db.personalBests
      .where({ gameId, mode })
      .toArray();

    bests.sort((a, b) => b.score - a.score);
    const idx = bests.findIndex((b) => b.playerId === playerId);
    return idx >= 0 ? idx + 1 : null;
  }

  /**
   * Get all games that have leaderboard data
   */
  async getGamesWithScores(): Promise<string[]> {
    const bests = await db.personalBests.toArray();
    const gameIds = new Set(bests.map((b) => b.gameId));
    return Array.from(gameIds);
  }
}

export const LeaderboardEngine = new LeaderboardEngineImpl();
