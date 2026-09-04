import { create } from 'zustand';

export interface PlayerInfo {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  isSpectator: boolean;
}

export interface RoomSettings {
  gameId: string;
  mode: string;
  maxPlayers: number;
  visibility: 'private' | 'public';
  roomName: string;
  spectatorsAllowed: boolean;
  autoStartWhenFull: boolean;
  countdownSeconds: number;
  rematchSameRoom: boolean;
}

interface RoomState {
  roomId: string | null;
  status: 'LOBBY' | 'READY' | 'COUNTDOWN' | 'PLAYING' | 'FINISHED';
  settings: RoomSettings | null;
  players: PlayerInfo[];
  gameState: any;
  countdown: number;
  isConnected: boolean;
  error: string | null;

  updateState: (state: Partial<RoomState>) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomId: null,
  status: 'LOBBY',
  settings: null,
  players: [],
  gameState: null,
  countdown: 0,
  isConnected: false,
  error: null,

  updateState: (newState) => set((state) => ({ ...state, ...newState })),
  setError: (error) => set({ error }),
  reset: () => set({
    roomId: null,
    status: 'LOBBY',
    settings: null,
    players: [],
    gameState: null,
    countdown: 0,
    isConnected: false,
    error: null
  })
}));
