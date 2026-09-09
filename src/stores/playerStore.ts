// ============================================================
// HRSH — Player Store (Zustand)
// ============================================================

import { create } from 'zustand';
import type { Player, PlayerSettings, PlayerStreak } from '../types/player';
import { PlayerService } from '../lib/player/PlayerService';

export type PlayerStatus = 'BOOTING' | 'LOADING_PLAYER' | 'NEEDS_PLAYER_SETUP' | 'PLAYER_READY';

interface PlayerState {
  player: Player | null;
  settings: PlayerSettings | null;
  streak: PlayerStreak | null;
  favorites: string[];
  isLoading: boolean;
  status: PlayerStatus;
  isFirstVisit: boolean;
  showOnboarding: boolean;
  pendingDestination: string | null;

  // Actions
  initialize: () => Promise<void>;
  setName: (name: string) => Promise<Player>;
  setPremium: (isPremium: boolean) => Promise<void>;
  updateSettings: (updates: Partial<PlayerSettings>) => Promise<void>;
  updateStreak: () => Promise<void>;
  addStreakFreeze: () => Promise<void>;
  toggleFavorite: (gameId: string) => Promise<boolean>;
  setPendingDestination: (dest: string | null) => void;
  completeOnboarding: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  player: null,
  settings: null,
  streak: null,
  favorites: [],
  isLoading: true,
  status: 'BOOTING',
  isFirstVisit: false,
  showOnboarding: false,
  pendingDestination: null,

  initialize: async () => {
    set({ status: 'LOADING_PLAYER' });
    try {
      const player = await PlayerService.getOrCreatePlayer();
      const settings = await PlayerService.getSettings(player.id);
      const streak = await PlayerService.getStreak(player.id);
      const favorites = await PlayerService.getFavorites(player.id);
      const isFirstVisit = await PlayerService.isFirstVisit(player.id);

      const status: PlayerStatus = isFirstVisit ? 'NEEDS_PLAYER_SETUP' : 'PLAYER_READY';

      set({
        player,
        settings: settings || null,
        streak: streak || null,
        favorites,
        isLoading: false,
        status,
        isFirstVisit,
        showOnboarding: isFirstVisit,
      });
    } catch (err) {
      console.error('[PlayerStore] Failed to initialize player profile:', err);
      // Create safe in-memory fallback so app never white-screens
      const fallbackId = crypto.randomUUID?.() || `player_${Date.now()}`;
      const fallbackPlayer: Player = {
        id: fallbackId,
        name: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      set({
        player: fallbackPlayer,
        settings: null,
        streak: null,
        favorites: [],
        isLoading: false,
        status: 'NEEDS_PLAYER_SETUP',
        isFirstVisit: true,
        showOnboarding: true,
      });
    }
  },

  setName: async (name: string) => {
    const { player } = get();
    if (!player) {
      throw new Error('No player profile available');
    }
    const newPlayer = await PlayerService.updateName(player.id, name);
    set({
      player: newPlayer,
      isFirstVisit: false,
      showOnboarding: false,
      status: 'PLAYER_READY',
    });
    return newPlayer;
  },

  setPremium: async (isPremium: boolean) => {
    const { player } = get();
    if (!player) return;
    const newPlayer = await PlayerService.setPremium(player.id, isPremium);
    set({ player: newPlayer });
  },

  updateSettings: async (updates: Partial<PlayerSettings>) => {
    const { player, settings } = get();
    if (!player) return;
    await PlayerService.updateSettings(player.id, updates);
    set({ settings: { ...(settings || { playerId: player.id, theme: 'dark', reducedMotion: false, soundEnabled: true, musicEnabled: false, volume: 0.7, hapticFeedback: true }), ...updates } });
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

  setPendingDestination: (dest: string | null) => {
    set({ pendingDestination: dest });
  },

  completeOnboarding: () => {
    set({ showOnboarding: false, isFirstVisit: false, status: 'PLAYER_READY' });
  },
}));

