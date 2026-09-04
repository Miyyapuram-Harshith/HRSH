import { create } from 'zustand';

export interface PlayerInfo {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isSpectator: boolean;
  progress?: number;
  liveMetricValue?: number;
  rank?: number;
  finished?: boolean;
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
  status: 'WAITING' | 'READY' | 'COUNTDOWN' | 'PLAYING' | 'FINISHING' | 'RESULTS' | 'CLOSED';
  settings: RoomSettings | null;
  players: PlayerInfo[];
  gameState: any;
  countdown: number;
  isConnected: boolean;
  connectionState: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR';
  reconnectAttempts: number;
  error: string | null;

  updateState: (state: Partial<RoomState>) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomId: null,
  status: 'WAITING',
  settings: null,
  players: [],
  gameState: null,
  countdown: 0,
  isConnected: false,
  connectionState: 'DISCONNECTED',
  reconnectAttempts: 0,
  error: null,

  updateState: (newState) => set((state) => ({ ...state, ...newState })),
  setError: (error) => set({ error }),
  reset: () => set({
    roomId: null,
    status: 'WAITING',
    settings: null,
    players: [],
    gameState: null,
    countdown: 0,
    isConnected: false,
    connectionState: 'DISCONNECTED',
    reconnectAttempts: 0,
    error: null
  })
}));
