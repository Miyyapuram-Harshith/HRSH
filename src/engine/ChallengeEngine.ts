import { GameRegistry } from './GameRegistry';

export interface DailyChallenge {
  id: string; // e.g. "2026-09-04"
  gameId: string;
  mode: string;
  targetScore: number;
  description: string;
}

export class ChallengeEngine {
  /**
   * Deterministically generates a daily challenge based on the date string
   */
  static getDailyChallenge(dateString: string): DailyChallenge {
    // A simple deterministic selection using string hashing
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      hash = (hash << 5) - hash + dateString.charCodeAt(i);
      hash |= 0;
    }
    
    // We only use solo games for daily challenges for simplicity
    const soloGames = GameRegistry.getByCategory('solo');
    const selectedGameIndex = Math.abs(hash) % soloGames.length;
    const game = soloGames[selectedGameIndex];
    
    // Generate a plausible target score (this would be better tuned per game)
    const baseTarget = (Math.abs(hash * 13) % 50) * 100 + 500;
    
    return {
      id: dateString,
      gameId: game.id,
      mode: game.modes[0]?.id || 'classic',
      targetScore: baseTarget,
      description: `Score at least ${baseTarget.toLocaleString()} points in ${game.title}.`
    };
  }

  static getTodayDateString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
