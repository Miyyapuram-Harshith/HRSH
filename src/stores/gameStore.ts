// ============================================================
// HRSH — Game Store (Zustand)
// ============================================================

import { create } from 'zustand';
import type { GameResult, GameStatus } from '../types/game';
import type { Achievement } from '../types/engine';

interface GameStore {
  // Current game state
  currentGameId: string | null;
  status: GameStatus;
  score: number;
  startedAt: number | null;
  isPaused: boolean;

  // Result
  lastResult: GameResult | null;
  wasPersonalBest: boolean;

  // Recently unlocked achievements (for toast notifications)
  recentAchievements: Achievement[];

  // Actions
  startGame: (gameId: string) => void;
  updateScore: (score: number) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: (result: GameResult, personalBest: boolean) => void;
  resetGame: () => void;
  addAchievement: (achievement: Achievement) => void;
  clearAchievements: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  currentGameId: null,
  status: 'idle',
  score: 0,
  startedAt: null,
  isPaused: false,
  lastResult: null,
  wasPersonalBest: false,
  recentAchievements: [],

  startGame: (gameId: string) =>
    set({
      currentGameId: gameId,
      status: 'playing',
      score: 0,
      startedAt: Date.now(),
      isPaused: false,
      lastResult: null,
      wasPersonalBest: false,
    }),

  updateScore: (score: number) =>
    set({ score }),

  pauseGame: () =>
    set({ status: 'paused', isPaused: true }),

  resumeGame: () =>
    set({ status: 'playing', isPaused: false }),

  endGame: (result: GameResult, personalBest: boolean) =>
    set({
      status: 'finished',
      score: result.score,
      lastResult: result,
      wasPersonalBest: personalBest,
      isPaused: false,
    }),

  resetGame: () =>
    set({
      status: 'idle',
      score: 0,
      startedAt: null,
      isPaused: false,
      lastResult: null,
      wasPersonalBest: false,
    }),

  addAchievement: (achievement: Achievement) =>
    set((state) => ({
      recentAchievements: [...state.recentAchievements, achievement],
    })),

  clearAchievements: () =>
    set({ recentAchievements: [] }),
}));
