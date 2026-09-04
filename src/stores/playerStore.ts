// ============================================================
// HRSH — Player Store (Zustand)
// ============================================================

import { create } from 'zustand';
import type { Player, PlayerSettings, PlayerStreak } from '../types/player';
import { PlayerService } from '../lib/player/PlayerService';

interface PlayerState {
  player: Player | null;
  settings: PlayerSettings | null;
  streak: PlayerStreak | null;
  favorites: string[];
  isLoading: boolean;
  isFirstVisit: boolean;
  showOnboarding: boolean;

  // Actions
  initialize: () => Promise<void>;
  setName: (name: string) => Promise<void>;
  setPremium: (isPremium: boolean) => Promise<void>;
  updateSettings: (updates: Partial<PlayerSettings>) => Promise<void>;
  updateStreak: () => Promise<void>;
  addStreakFreeze: () => Promise<void>;
  toggleFavorite: (gameId: string) => Promise<boolean>;
  completeOnboarding: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  player: null,
  settings: null,
  streak: null,
  favorites: [],
  isLoading: true,
  isFirstVisit: false,
  showOnboarding: false,

  initialize: async () => {
    try {
      const player = await PlayerService.getOrCreatePlayer();
      const settings = await PlayerService.getSettings(player.id);
      const streak = await PlayerService.getStreak(player.id);
      const favorites = await PlayerService.getFavorites(player.id);
      const isFirstVisit = await PlayerService.isFirstVisit(player.id);

      set({
        player,
        settings: settings || null,
        streak: streak || null,
        favorites,
        isLoading: false,
        isFirstVisit,
        showOnboarding: isFirstVisit,
      });
    } catch (err) {
      console.error('[PlayerStore] Failed to initialize:', err);
      set({ isLoading: false });
    }
  },

  setName: async (name: string) => {
    const { player } = get();
    if (!player) return;
    const newPlayer = await PlayerService.updateName(player.id, name);
    set({ player: newPlayer });
  },

  setPremium: async (isPremium: boolean) => {
    const { player } = get();
    if (!player) return;
    const newPlayer = await PlayerService.setPremium(player.id, isPremium);
    set({ player: newPlayer });
  },

  updateSettings: async (updates: Partial<PlayerSettings>) => {
    const { player, settings } = get();
    if (!player || !settings) return;
    await PlayerService.updateSettings(player.id, updates);
    set({ settings: { ...settings, ...updates } });
  },

  updateStreak: async () => {
    const { player } = get();
    if (!player) return;
    const newStreak = await PlayerService.updateStreak(player.id);
    set({ streak: newStreak });
  },

  addStreakFreeze: async () => {
    const { player } = get();
    if (!player) return;
    const newStreak = await PlayerService.addStreakFreeze(player.id);
    set({ streak: newStreak });
  },

  toggleFavorite: async (gameId: string) => {
    const { player, favorites } = get();
    if (!player) return false;
    const isFav = await PlayerService.toggleFavorite(player.id, gameId);
    if (isFav) {
      set({ favorites: [...favorites, gameId] });
    } else {
      set({ favorites: favorites.filter((f) => f !== gameId) });
    }
    return isFav;
  },

  completeOnboarding: () => {
    set({ showOnboarding: false });
  },
}));
