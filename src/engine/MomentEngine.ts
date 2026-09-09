// ============================================================
// HRSH — Moment Engine
// ============================================================
// Detects gameplay moments like CLUTCH, COMEBACK, PERSONAL_BEST
// ============================================================

import type { GameResult } from '../types/game';

export type MomentType = 
  | 'PERSONAL_BEST' 
  | 'RECORD' 
  | 'CLUTCH' 
  | 'COMEBACK' 
  | 'PHOTO_FINISH' 
  | 'PERFECT' 
  | 'DOMINATION' 
  | 'UPSET' 
  | 'NEAR_MISS' 
  | 'STREAK' 
  | 'GIANT_MERGE' 
  | 'SPEED_RECORD'
  | 'TERRIBLE_MISTAKE';

export interface Moment {
  id: string;
  type: MomentType;
  gameId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class MomentEngineImpl {
  detectMoments(result: GameResult, multiplayerData?: any): Moment[] {
    const moments: Moment[] = [];
    const timestamp = Date.now();

    // 1. Personal Best / Record
    if (result.personalBest) {
      moments.push({
        id: `moment_${timestamp}_pb`,
        type: 'PERSONAL_BEST',
        gameId: result.gameId,
        timestamp,
        metadata: { score: result.score }
      });
    }

    // 2. Perfect Game
    if (result.data?.accuracy === 100 && result.score > 0) {
      moments.push({
        id: `moment_${timestamp}_perfect`,
        type: 'PERFECT',
        gameId: result.gameId,
        timestamp,
        metadata: { accuracy: 100 }
      });
    }

    // 3. Multiplayer Moments
    if (multiplayerData && multiplayerData.participants) {
      const { participants, myPlayerId } = multiplayerData;
      const me = participants.find((p: any) => p.playerId === myPlayerId);
      const others = participants.filter((p: any) => p.playerId !== myPlayerId);
      
      if (me) {
        // Photo Finish (close score or time difference to 2nd place or whoever is near)
        const closestOpponent = others.reduce((prev: any, curr: any) => 
          Math.abs(curr.score - me.score) < Math.abs(prev.score - me.score) ? curr : prev
        , others[0]);

        if (closestOpponent && Math.abs(closestOpponent.score - me.score) <= 1) {
          moments.push({
            id: `moment_${timestamp}_photo`,
            type: 'PHOTO_FINISH',
            gameId: result.gameId,
            timestamp,
            metadata: { diff: Math.abs(closestOpponent.score - me.score) }
          });
        }

        // Domination (won by a large margin)
        if (me.rank === 1 && others.length > 0) {
          const secondPlace = others.find((p: any) => p.rank === 2);
          if (secondPlace && me.score - secondPlace.score > (secondPlace.score * 0.5)) {
            moments.push({
              id: `moment_${timestamp}_domination`,
              type: 'DOMINATION',
              gameId: result.gameId,
              timestamp,
              metadata: { lead: me.score - secondPlace.score }
            });
          }
        }
      }
    }

    // 4. Game-Specific Moments (Giant Merge for 2048)
    if (result.gameId === 'twenty48' && result.data?.highestMerge) {
      if ((result.data.highestMerge as number) >= 1024) {
        moments.push({
          id: `moment_${timestamp}_merge`,
          type: 'GIANT_MERGE',
          gameId: result.gameId,
          timestamp,
          metadata: { tile: result.data.highestMerge }
        });
      }
    }

    // 5. Game-Specific Moments (Reaction Test)
    if (result.gameId === 'reaction' && result.data?.reactionTime) {
      const time = result.data.reactionTime as number;
      if (time < 150) {
        moments.push({
          id: `moment_${timestamp}_speed`,
          type: 'SPEED_RECORD',
          gameId: result.gameId,
          timestamp,
          metadata: { time }
        });
      }
    }

    return moments;
  }
}

export const MomentEngine = new MomentEngineImpl();
