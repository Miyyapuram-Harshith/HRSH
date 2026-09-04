// ============================================================
// HRSH — Live Activity Service
// ============================================================
// Provides live room/match data for the homepage "LIVE NOW"
// section. Uses a mock provider in Phase 1 with clearly
// labeled fake data. Designed to consume real Cloudflare
// Durable Object snapshots in Phase 2+.
// ============================================================

import type { LiveRoom } from '../types/engine';

interface LiveActivityProvider {
  getRooms(): Promise<LiveRoom[]>;
}

// ============================================================
// MOCK PROVIDER — Clearly marked as development data.
// This does NOT represent real active rooms.
// Replace with CloudflareLiveProvider in Phase 2.
// ============================================================
class MockLiveActivityProvider implements LiveActivityProvider {
  private rooms: LiveRoom[] = [
    {
      id: 'mock-1',
      gameId: 'snake-arena',
      gameTitle: 'Snake Arena',
      mode: 'Classic',
      currentPlayers: 6,
      maxPlayers: 8,
      status: 'playing',
      spectators: 3,
      joinable: true,
      watchable: true,
      icon: '🐍',
    },
    {
      id: 'mock-2',
      gameId: 'bomb-party',
      gameTitle: 'Bomb Party',
      mode: 'Classic',
      currentPlayers: 5,
      maxPlayers: 8,
      status: 'lobby',
      spectators: 0,
      joinable: true,
      watchable: false,
      icon: '💣',
    },
    {
      id: 'mock-3',
      gameId: 'connect-four',
      gameTitle: 'Connect Four',
      mode: 'Casual',
      currentPlayers: 2,
      maxPlayers: 2,
      status: 'playing',
      spectators: 1,
      joinable: false,
      watchable: true,
      icon: '🔴',
    },
    {
      id: 'mock-4',
      gameId: 'hrsh-karts',
      gameTitle: 'HRSH Karts',
      mode: 'Grand Prix',
      currentPlayers: 7,
      maxPlayers: 8,
      status: 'lobby',
      spectators: 2,
      joinable: true,
      watchable: true,
      icon: '🏎️',
    },
  ];

  async getRooms(): Promise<LiveRoom[]> {
    // Simulate slight variation to make it feel alive
    return this.rooms.map((room) => ({
      ...room,
      currentPlayers: Math.max(
        1,
        room.currentPlayers + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0)
      ),
      spectators: Math.max(0, room.spectators + (Math.random() > 0.8 ? 1 : 0)),
    }));
  }
}

class LiveActivityServiceImpl {
  private provider: LiveActivityProvider = new MockLiveActivityProvider();
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(rooms: LiveRoom[]) => void> = new Set();
  private cachedRooms: LiveRoom[] = [];

  /**
   * Whether the current data is from a mock provider.
   */
  readonly isMock = true;

  setProvider(provider: LiveActivityProvider, isMock = false): void {
    this.provider = provider;
    (this as { isMock: boolean }).isMock = isMock;
  }

  subscribe(callback: (rooms: LiveRoom[]) => void): () => void {
    this.listeners.add(callback);
    // Immediately send cached data
    if (this.cachedRooms.length > 0) {
      callback(this.cachedRooms);
    }
    return () => this.listeners.delete(callback);
  }

  startPolling(intervalMs = 4000): void {
    if (this.pollingInterval) return;

    // Fetch immediately
    this.fetchRooms();

    this.pollingInterval = setInterval(() => {
      this.fetchRooms();
    }, intervalMs);
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async fetchRooms(): Promise<void> {
    try {
      this.cachedRooms = await this.provider.getRooms();
      for (const listener of this.listeners) {
        listener(this.cachedRooms);
      }
    } catch (err) {
      console.error('[LiveActivity] Failed to fetch rooms:', err);
    }
  }
}

export const LiveActivityService = new LiveActivityServiceImpl();
