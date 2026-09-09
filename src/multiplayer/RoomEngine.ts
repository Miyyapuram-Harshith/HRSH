import { useRoomStore, type ConnectionState } from '../stores/roomStore';
import { usePlayerStore } from '../stores/playerStore';

const MAX_RECONNECT_ATTEMPTS = 10;
const HEARTBEAT_INTERVAL = 15000; // 15s
const INITIAL_RECONNECT_DELAY = 1000;
const CONNECTION_TIMEOUT = 10000; // 10s

export class RoomEngine {
  private static ws: WebSocket | null = null;
  private static reconnectTimer: any = null;
  private static heartbeatTimer: any = null;
  private static connectionTimeoutTimer: any = null;
  private static reconnectAttempts = 0;
  private static currentRoomId: string | null = null;
  private static messageQueue: any[] = [];
  private static URL_BASE = import.meta.env.PROD 
    ? `wss://${window.location.host}`
    : 'ws://localhost:8787';

  static async connect(roomId: string, requestedTeamCode?: string | null) {
    const { player, settings } = usePlayerStore.getState();
    if (!player) return;

    const normalizedRoomId = roomId.trim().toUpperCase();

    // Prevent duplicate connections to the exact same room if socket is already open or connecting
    if (this.currentRoomId === normalizedRoomId && this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.currentRoomId = normalizedRoomId;
    this.disconnect(true); // silent disconnect from any prior room
    
    // Reset state if changing room
    if (useRoomStore.getState().roomId !== normalizedRoomId) {
      useRoomStore.getState().reset();
    }
    
    useRoomStore.getState().updateState({ roomId: normalizedRoomId, connectionState: 'CONNECTING', error: null });

    const wsUrl = `${this.URL_BASE}/api/room/${normalizedRoomId}?playerId=${encodeURIComponent(player.id)}&playerName=${encodeURIComponent(player.name || 'Anonymous')}`;
    
    // Check if we have initial settings from CreateRoom
    let initialSettings = null;
    const settingsStr = sessionStorage.getItem(`hrsh_initial_settings_${normalizedRoomId}`);
    if (settingsStr) {
      try {
        initialSettings = JSON.parse(settingsStr);
        sessionStorage.removeItem(`hrsh_initial_settings_${normalizedRoomId}`);
      } catch (e) {
        // Ignore JSON parse error
      }
    }

    const savedCustomization = (settings as any)?.customizations || {};

    try {
      this.ws = new WebSocket(wsUrl);
    } catch (err) {
      console.error('[RoomEngine] Failed to instantiate WebSocket:', err);
      useRoomStore.getState().updateState({ connectionState: 'ERROR', error: 'Could not connect to room server.' });
      return;
    }

    // Connection timeout
    if (this.connectionTimeoutTimer) clearTimeout(this.connectionTimeoutTimer);
    this.connectionTimeoutTimer = setTimeout(() => {
      const currentState = useRoomStore.getState().connectionState;
      if (currentState === 'CONNECTING' || currentState === 'AUTHENTICATING') {
        useRoomStore.getState().updateState({ connectionState: 'ERROR', error: 'Connection timed out. Please try again.' });
        if (this.ws) this.ws.close();
      }
    }, CONNECTION_TIMEOUT);

    this.ws.onopen = () => {
      if (this.connectionTimeoutTimer) clearTimeout(this.connectionTimeoutTimer);
      this.reconnectAttempts = 0;
      
      useRoomStore.getState().updateState({ connectionState: 'AUTHENTICATING', isConnected: true, error: null });
      
      // Explicit JOIN handshake with player info and customization
      this.ws?.send(JSON.stringify({
        type: 'ROOM_JOIN',
        playerId: player.id,
        playerName: player.name || 'Anonymous',
        initialSettings,
        requestedTeamCode,
        customization: savedCustomization
      }));

      // Start heartbeat
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        
        if (msg.type === 'ROOM_JOINED') {
          useRoomStore.getState().updateState({ connectionState: 'CONNECTED', error: null });
          // Flush queued messages after successful join
          for (const queuedMsg of this.messageQueue) {
            this.send(queuedMsg);
          }
          this.messageQueue = [];
        } else if (msg.type === 'ROOM_STATE') {
          const currentVersion = useRoomStore.getState().version;
          if (msg.state.version && msg.state.version < currentVersion) {
            return; // Ignore stale state
          }
          useRoomStore.getState().updateState({ ...msg.state, connectionState: 'CONNECTED', error: null });
        } else if (msg.type === 'ERROR') {
          useRoomStore.getState().updateState({ connectionState: 'ERROR', error: msg.message || 'Room error' });
          if (msg.code === 'ROOM_NOT_FOUND' || msg.code === 'ROOM_FULL' || msg.code === 'ROOM_CLOSED') {
             // Do not reconnect for explicit rejections
             this.disconnect(true);
          }
        } else if (msg.type === 'KICKED') {
          useRoomStore.getState().updateState({ connectionState: 'ERROR', error: 'You have been removed from the room by the host.' });
          this.disconnect();
        } else if (msg.type === 'MATCH_PROGRESS_UPDATE') {
          // Parse compact array: [id, progress, liveValue, rank, finished]
          const updatedPlayers = useRoomStore.getState().players.map(p => {
            const update = msg.leaderboard?.find((l: any[]) => l[0] === p.id);
            if (update) {
              return {
                ...p,
                progress: update[1],
                liveMetricValue: update[2],
                rank: update[3],
                finished: update[4] === 1
              };
            }
            return p;
          });
          useRoomStore.getState().updateState({ players: updatedPlayers });
        } else if (msg.type === 'PONG') {
          // Heartbeat response
        }
      } catch (e) {
        console.error('[RoomEngine] WebSocket message parsing error:', e);
      }
    };

    this.ws.onclose = (event) => {
      this.stopHeartbeat();
      if (this.connectionTimeoutTimer) clearTimeout(this.connectionTimeoutTimer);
      
      useRoomStore.getState().updateState({ isConnected: false });
      
      const error = useRoomStore.getState().error;
      const connectionState = useRoomStore.getState().connectionState;
      
      // Explicitly rejected or disconnected by user
      if (error || connectionState === 'DISCONNECTED') return;
      if (event.code === 4000) return; // Custom close code for explicit closure
      
      // Exponential backoff reconnect
      if (this.currentRoomId && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(
          INITIAL_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts),
          16000 // max 16s
        );
        this.reconnectAttempts++;
        useRoomStore.getState().updateState({ 
          connectionState: 'RECONNECTING',
          reconnectAttempts: this.reconnectAttempts,
        });
        this.reconnectTimer = setTimeout(() => this.connect(this.currentRoomId!), delay);
      } else if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        useRoomStore.getState().updateState({ connectionState: 'ERROR', error: 'Connection lost. Unable to reconnect.' });
      }
    };

    this.ws.onerror = () => {
      // Handled by onclose
    };
  }

  static disconnect(silent = false) {
    this.stopHeartbeat();
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }
    
    if (this.ws) {
      this.ws.close(4000); // 4000 = normal explicit close
      this.ws = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (!silent) {
      useRoomStore.getState().updateState({ connectionState: 'DISCONNECTED', isConnected: false });
      this.currentRoomId = null;
      this.reconnectAttempts = 0;
      this.messageQueue = [];
    }
  }

  private static startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING' }));
      }
    }, HEARTBEAT_INTERVAL);
  }

  private static stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  static send(msg: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && useRoomStore.getState().connectionState === 'CONNECTED') {
      this.ws.send(JSON.stringify(msg));
    } else {
      // Queue message if not yet fully joined
      if (msg.type !== 'PING') {
        this.messageQueue.push(msg);
      }
    }
  }

  static updateSettings(settings: Partial<any>) {
    this.send({ type: 'ROOM_SETTINGS_UPDATE', settings });
  }

  static toggleReady() {
    this.send({ type: 'TOGGLE_READY' });
  }

  static startNow() {
    this.send({ type: 'START_NOW' });
  }

  static kickPlayer(targetId: string) {
    this.send({ type: 'KICK_PLAYER', targetId });
  }

  static transferHost(targetId: string) {
    this.send({ type: 'TRANSFER_HOST', targetId });
  }

  static lockRoom() {
    this.send({ type: 'LOCK_ROOM' });
  }

  static unlockRoom() {
    this.send({ type: 'UNLOCK_ROOM' });
  }

  static joinTeam(teamCode: string) {
    this.send({ type: 'JOIN_TEAM', teamCode });
  }

  static sendGameAction(action: any) {
    this.send({ type: 'GAME_ACTION', action });
  }

  static sendMatchProgress(progress: number, liveMetricValue: number) {
    this.send({ type: 'MATCH_PROGRESS', payload: { progress, liveMetricValue } });
  }

  static sendMatchFinished(progress: number, liveMetricValue: number) {
    this.send({ type: 'MATCH_FINISHED', payload: { progress, liveMetricValue } });
  }

  static rematch() {
    this.send({ type: 'REMATCH' });
  }

  static requestRematch() {
    this.send({ type: 'REQUEST_REMATCH' });
  }

  static getConnectionState(): ConnectionState {
    return useRoomStore.getState().connectionState || 'DISCONNECTED';
  }
}
