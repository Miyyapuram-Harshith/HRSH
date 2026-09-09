import { create } from 'zustand';

export interface PlayerInfo {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isSpectator: boolean;
  connectionState: 'CONNECTED' | 'DISCONNECTED';
  teamId?: string;
  customization?: Record<string, any>;
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
  roomCode: string | null;
  version: number;
  status: RoomStatus;
  settings: RoomSettings | null;
  teamsEnabled: boolean;
  teams: any[];
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

export function normalizeRoomSnapshot(raw: Partial<RoomState>): Partial<RoomState> {
  const normalized: Partial<RoomState> = { ...raw };

  if (raw.settings) {
    normalized.settings = {
      gameId: raw.settings.gameId || 'tic-tac-toe',
      mode: raw.settings.mode || 'classic',
      maxPlayers: raw.settings.maxPlayers || 2,
      visibility: raw.settings.visibility || 'private',
      roomName: raw.settings.roomName || 'HRSH Room',
      spectatorsAllowed: raw.settings.spectatorsAllowed ?? true,
      autoStartWhenFull: raw.settings.autoStartWhenFull ?? false,
      countdownSeconds: raw.settings.countdownSeconds ?? 3,
      rematchSameRoom: raw.settings.rematchSameRoom ?? true,
      gameSettings: raw.settings.gameSettings || {},
    };
  }

  if (Array.isArray(raw.players)) {
    normalized.players = raw.players.map((p: any) => ({
      id: String(p?.id || 'unknown'),
      name: String(p?.name || 'Player'),
      isHost: Boolean(p?.isHost),
      isReady: Boolean(p?.isReady),
      isSpectator: Boolean(p?.isSpectator),
      connectionState: p?.connectionState === 'DISCONNECTED' ? 'DISCONNECTED' : 'CONNECTED',
      teamId: p?.teamId ? String(p.teamId) : undefined,
      customization: typeof p?.customization === 'object' && p?.customization !== null ? p.customization : {},
      progress: typeof p?.progress === 'number' ? p.progress : 0,
      liveMetricValue: typeof p?.liveMetricValue === 'number' ? p.liveMetricValue : 0,
      rank: typeof p?.rank === 'number' ? p.rank : undefined,
      finished: Boolean(p?.finished),
    }));
  }

  if (raw.teams && Array.isArray(raw.teams)) {
    normalized.teams = raw.teams.map((t: any) => ({
      id: String(t?.id || ''),
      name: String(t?.name || 'Team'),
      color: String(t?.color || '#3b82f6'),
      joinCode: String(t?.joinCode || ''),
    }));
  }

  return normalized;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomId: null,
  roomCode: null,
  version: 0,
  status: 'WAITING',
  settings: null,
  teamsEnabled: false,
  teams: [],
  players: [],
  gameState: null,
  countdown: 0,
  isConnected: false,
  connectionState: 'IDLE',
  reconnectAttempts: 0,
  error: null,

  updateState: (newState) => set((state) => {
    const normalized = normalizeRoomSnapshot(newState);
    return { ...state, ...normalized };
  }),
  setError: (error) => set({ error }),
  reset: () => set({
    roomId: null,
    roomCode: null,
    version: 0,
    status: 'WAITING',
    settings: null,
    teamsEnabled: false,
    teams: [],
    players: [],
    gameState: null,
    countdown: 0,
    isConnected: false,
    connectionState: 'IDLE',
    reconnectAttempts: 0,
    error: null,
  }),
}));

