import { db } from '../lib/db/database';
import type { GameEvent } from '../types/game';
import type { Quest, QuestProgress } from '../types/player';

export class QuestEngineImpl {
  
  // Hardcoded pool for daily quests
  private questPool: Quest[] = [
    {
      id: 'q_daily_play_3',
      title: 'Active Gamer',
      description: 'Play 3 games of any kind',
      type: 'daily',
      target: 3,
      xpReward: 100,
      expiresAt: 0,
      condition: { eventType: 'GAME_FINISHED' }
    },
    {
      id: 'q_daily_win_1',
      title: 'Taste of Victory',
      description: 'Win 1 game',
      type: 'daily',
      target: 1,
      xpReward: 150,
      expiresAt: 0,
      condition: { eventType: 'GAME_WON' }
    },
    {
      id: 'q_daily_snake_2',
      title: 'Snake Charmer',
      description: 'Play 2 games of Snake',
      type: 'daily',
      target: 2,
      xpReward: 120,
      expiresAt: 0,
      condition: { eventType: 'GAME_FINISHED', gameId: 'snake' }
    }
  ];

  async processEvent(playerId: string, event: GameEvent): Promise<QuestProgress[]> {
    const updatedQuests: QuestProgress[] = [];
    const activeQuests = await this.getActiveQuests(playerId);

    for (const q of activeQuests) {
      if (q.completed) continue;

      const def = this.questPool.find(p => p.id === q.questId);
      if (!def) continue;

      let match = false;
      if (def.condition.eventType === event.type) {
        if (!def.condition.gameId || def.condition.gameId === event.gameId) {
          match = true;
        }
      }

      if (match) {
        q.progress += 1;
        q.lastUpdated = Date.now();
        if (q.progress >= def.target) {
          q.progress = def.target;
          q.completed = true;
        }
        await db.questProgress.put(q);
        updatedQuests.push(q);
      }
    }
    return updatedQuests;
  }

  async getActiveQuests(playerId: string): Promise<QuestProgress[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const dayTimestamp = startOfDay.getTime();

    // In a real app, quests rotate automatically. We simulate a daily rotation by resetting progress if old.
    let progresses = await db.questProgress.where({ playerId }).toArray();
    
    // Simple mock logic: if we don't have exactly 3 quests for today, regenerate them.
    const valid = progresses.filter(p => p.lastUpdated >= dayTimestamp || (p.lastUpdated < dayTimestamp && !p.completed));
    
    if (valid.length === 0 || valid.some(p => p.lastUpdated < dayTimestamp)) {
      // Clear old
      await db.questProgress.where({ playerId }).delete();
      
      progresses = this.questPool.slice(0, 3).map(q => ({
        playerId,
        questId: q.id,
        progress: 0,
        completed: false,
        claimed: false,
        lastUpdated: Date.now()
      }));

      await db.questProgress.bulkAdd(progresses);
    }
    
    return progresses;
  }
}

export const QuestEngine = new QuestEngineImpl();
