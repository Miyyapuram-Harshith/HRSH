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
  visibility: 'private' | 'public' | 'unlisted';
  roomName: string;
  spectatorsAllowed: boolean;
  autoStartWhenFull: boolean;
  countdownSeconds: number;
  rematchSameRoom: boolean;
  gameSettings?: Record<string, any>;
}

export type ConnectionState = 'IDLE' | 'CONNECTING' | 'LOADING_ROOM' | 'AUTHENTICATING' | 'CONNECTED' | 'JOINED' | 'READY' | 'STARTING' | 'PLAYING' | 'FINISHING' | 'RESULTS' | 'RECONNECTING' | 'DISCONNECTED' | 'ROOM_FULL' | 'ROOM_CLOSED' | 'ROOM_NOT_FOUND' | 'ERROR';

export type RoomStatus = 'WAITING' | 'READY' | 'COUNTDOWN' | 'PLAYING' | 'FINISHING' | 'RESULTS' | 'CLOSED';

interface RoomState {
  roomId: string | null;
  status: RoomStatus;
  settings: RoomSettings | null;
  players: PlayerInfo[];
  gameState: any;
  countdown: number;
  isConnected: boolean;
  connectionState: ConnectionState;
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
  connectionState: 'IDLE',
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
    connectionState: 'IDLE',
    reconnectAttempts: 0,
    error: null
  })
}));
