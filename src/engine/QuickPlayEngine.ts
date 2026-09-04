// ============================================================
// HRSH — Quick Play Engine
// ============================================================
// Instantly starts a game based on player history:
// 1. Check recently played games
// 2. Check favorites
// 3. Fallback to a random solo game
// Goal: CLICK → GAME
// ============================================================

import { GameRegistry } from './GameRegistry';
import { db } from '../lib/db/database';

class QuickPlayEngineImpl {
  /**
   * Choose the best game to quick-play for this player.
   * Returns a game slug.
   */
  async chooseGame(playerId: string): Promise<string> {
    // 1. Try recently played (most recent first)
    const recent = await db.recentGames
      .where('playerId')
      .equals(playerId)
      .reverse()
      .sortBy('lastPlayedAt');

    if (recent.length > 0) {
      // Pick from top 3 recent, with some randomness
      const pool = recent.slice(0, 3);
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      const game = GameRegistry.get(chosen.gameId);
      if (game) return game.slug;
    }

    // 2. Try favorites
    const favorites = await db.favorites
      .where('playerId')
      .equals(playerId)
      .toArray();

    if (favorites.length > 0) {
      const chosen = favorites[Math.floor(Math.random() * favorites.length)];
      const game = GameRegistry.get(chosen.gameId);
      if (game) return game.slug;
    }

    // 3. Fallback: random solo game
    const soloGames = GameRegistry.getSolo();
    if (soloGames.length > 0) {
      const chosen = soloGames[Math.floor(Math.random() * soloGames.length)];
      return chosen.slug;
    }

    // Ultimate fallback
    return 'snake';
  }
}

export const QuickPlayEngine = new QuickPlayEngineImpl();
