import { db } from '../lib/db/database';
import type { GameEvent } from '../types/game';
import type { LeagueProgress, LeagueTier } from '../types/player';

export class LeagueEngineImpl {
  // A mapping of game complexity to XP weight
  private gameWeights: Record<string, number> = {
    'chess': 5.0,
    'minesweeper': 2.0,
    'sudoku': 3.0,
    'snake': 1.0,
    'typing-test': 1.5,
    '2048': 1.5,
    'reaction': 0.5,
    'tic-tac-toe': 0.5,
    'connect-four': 1.0,
    'word-guesser': 1.0,
    'snake-arena': 1.5
  };

  async processEvent(playerId: string, event: GameEvent): Promise<LeagueProgress | null> {
    if (event.type !== 'GAME_FINISHED' && event.type !== 'GAME_WON') {
      return null;
    }

    const currentWeekId = this.getCurrentWeekId();
    let progress = await db.leagueProgress.where({ playerId }).first();

    if (!progress || progress.weekId !== currentWeekId) {
      if (false) {
        // We delete or could archive. But the schema is just playerId for primary in Dexie? No, it's just ID increment.
      }
      progress = {
        playerId,
        weekId: currentWeekId,
        tier: 'Bronze', // Default
        xp: 0,
        rank: 100, // starting rank placeholder
        lastUpdated: Date.now()
      } as any;
    }

    // Calculate XP
    const base = event.type === 'GAME_WON' ? 50 : 15;
    const weight = this.gameWeights[event.gameId] || 1.0;
    
    // Add time bonus if available
    const duration = event.data.duration as number || 0;
    const durationBonus = Math.min(Math.floor(duration / 60000) * 5, 50); // max 50 extra xp for long games

    const xpEarned = Math.floor((base + durationBonus) * weight);
    progress!.xp += xpEarned;
    progress!.lastUpdated = Date.now();

    // Check for tier promotion (mock threshold)
    progress!.tier = this.calculateTier(progress!.xp);

    await db.leagueProgress.put(progress!);
    return progress!;
  }

  async getProgress(playerId: string): Promise<LeagueProgress> {
    const currentWeekId = this.getCurrentWeekId();
    let progress = await db.leagueProgress.where({ playerId }).first();
    
    if (!progress || progress.weekId !== currentWeekId) {
      progress = {
        playerId,
        weekId: currentWeekId,
        tier: 'Bronze',
        xp: 0,
        rank: 100,
        lastUpdated: Date.now()
      };
      await db.leagueProgress.put(progress);
    }
    return progress;
  }

  private calculateTier(xp: number): LeagueTier {
    if (xp > 5000) return 'HRSH Elite';
    if (xp > 2500) return 'Diamond';
    if (xp > 1000) return 'Platinum';
    if (xp > 500) return 'Gold';
    if (xp > 200) return 'Silver';
    return 'Bronze';
  }

  private getCurrentWeekId(): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return `${d.getUTCFullYear()}-W${weekNo}`;
  }
}

export const LeagueEngine = new LeagueEngineImpl();
