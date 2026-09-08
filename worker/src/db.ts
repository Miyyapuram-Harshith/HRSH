export class Database {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // Player Operations
  async getPlayer(id: string) {
    return await this.db.prepare('SELECT * FROM players WHERE id = ?').bind(id).first();
  }

  async createOrUpdatePlayer(id: string, name: string) {
    const now = Date.now();
    await this.db.prepare(`
      INSERT INTO players (id, name, created_at, updated_at) 
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        name = excluded.name,
        updated_at = excluded.updated_at
    `).bind(id, name, now, now).run();
  }

  async addXP(id: string, xpGained: number) {
    const player: any = await this.getPlayer(id);
    if (!player) return;

    let newXp = player.xp + xpGained;
    let newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1; // Basic XP curve

    await this.db.prepare(`
      UPDATE players SET xp = ?, level = ?, updated_at = ? WHERE id = ?
    `).bind(newXp, newLevel, Date.now(), id).run();
    
    return { xp: newXp, level: newLevel };
  }

  async recordMatch(gameId: string, mode: string, settings: any, winnerId: string | null, players: any[]) {
    const matchId = crypto.randomUUID();
    const now = Date.now();

    await this.db.prepare(`
      INSERT INTO matches (id, game_id, mode, settings, winner_id, played_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(matchId, gameId, mode, JSON.stringify(settings), winnerId, now).run();

    for (const p of players) {
      await this.db.prepare(`
        INSERT INTO match_players (match_id, player_id, score, rank, metrics)
        VALUES (?, ?, ?, ?, ?)
      `).bind(matchId, p.id, p.score || 0, p.rank || 0, JSON.stringify(p.metrics || {})).run();

      // Update games played & wins/losses
      const isWinner = winnerId === p.id;
      await this.db.prepare(`
        UPDATE players SET 
          games_played = games_played + 1,
          wins = wins + ?,
          losses = losses + ?,
          updated_at = ?
        WHERE id = ?
      `).bind(isWinner ? 1 : 0, isWinner ? 0 : 1, now, p.id).run();
    }
    
    return matchId;
  }

  async unlockAchievement(playerId: string, achievementId: string) {
    await this.db.prepare(`
      INSERT OR IGNORE INTO achievements (player_id, achievement_id, unlocked_at)
      VALUES (?, ?, ?)
    `).bind(playerId, achievementId, Date.now()).run();
  }

  async getAchievements(playerId: string) {
    const res = await this.db.prepare('SELECT achievement_id, unlocked_at FROM achievements WHERE player_id = ?').bind(playerId).all();
    return res.results;
  }
}
