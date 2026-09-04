// ============================================================
// HRSH — XP & Leveling Engine
// ============================================================

import { db } from '../lib/db/database';
import type { GameResult } from '../types/game';

// XP required per level: level N requires N * 100 XP total
// Level 1 = 100 XP, Level 2 = 200 XP cumulative, etc.
const XP_PER_LEVEL = 100;

export interface XPGain {
  xpGained: number;
  totalXP: number;
  newLevel: number;
  previousLevel: number;
  leveledUp: boolean;
}

export interface LevelProgress {
  level: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpIntoLevel: number;
  percentage: number;
}

export class XPEngine {
  /**
   * Calculate XP gained from a game result
   */
  static calculateXP(result: GameResult): number {
    let xp = 10; // Base XP for playing
    if (result.won) xp += 15; // Win bonus
    xp += Math.min(50, Math.floor(result.score / 100)); // Score bonus (capped at 50)
    return xp;
  }

  /**
   * Get level from total XP
   */
  static getLevel(totalXP: number): number {
    // Quadratic: level N requires sum(1..N) * 100 / 2 ≈ simpler linear
    return Math.floor(totalXP / XP_PER_LEVEL) + 1;
  }

  /**
   * Get detailed level progress
   */
  static getLevelProgress(totalXP: number): LevelProgress {
    const level = this.getLevel(totalXP);
    const xpForCurrentLevel = (level - 1) * XP_PER_LEVEL;
    const xpForNextLevel = level * XP_PER_LEVEL;
    const xpIntoLevel = totalXP - xpForCurrentLevel;
    const percentage = Math.min(100, Math.round((xpIntoLevel / XP_PER_LEVEL) * 100));

    return {
      level,
      currentXP: totalXP,
      xpForCurrentLevel,
      xpForNextLevel,
      xpIntoLevel,
      percentage,
    };
  }

  /**
   * Award XP to a player and return the result
   */
  static async awardXP(playerId: string, result: GameResult): Promise<XPGain> {
    const xpGained = this.calculateXP(result);

    const player = await db.players.get(playerId);
    if (!player) throw new Error('Player not found');

    const currentXP = (player as any).xp || 0;
    const totalXP = currentXP + xpGained;
    const previousLevel = this.getLevel(currentXP);
    const newLevel = this.getLevel(totalXP);

    await db.players.update(playerId, {
      xp: totalXP,
      level: newLevel,
    } as any);

    return {
      xpGained,
      totalXP,
      newLevel,
      previousLevel,
      leveledUp: newLevel > previousLevel,
    };
  }

  /**
   * Get XP stats for a player
   */
  static async getXPStats(playerId: string): Promise<LevelProgress> {
    const player = await db.players.get(playerId);
    const totalXP = (player as any)?.xp || 0;
    return this.getLevelProgress(totalXP);
  }

  /**
   * Get level title/badge
   */
  static getLevelTitle(level: number): string {
    if (level >= 50) return 'Legend';
    if (level >= 40) return 'Master';
    if (level >= 30) return 'Expert';
    if (level >= 20) return 'Veteran';
    if (level >= 15) return 'Skilled';
    if (level >= 10) return 'Dedicated';
    if (level >= 5) return 'Regular';
    if (level >= 3) return 'Rookie';
    return 'Newcomer';
  }

  static getLevelColor(level: number): string {
    if (level >= 50) return '#f59e0b'; // Gold
    if (level >= 40) return '#a855f7'; // Purple
    if (level >= 30) return '#3b82f6'; // Blue
    if (level >= 20) return '#22c55e'; // Green
    if (level >= 10) return '#0ea5e9'; // Sky
    return '#a1a1aa'; // Gray
  }
}
