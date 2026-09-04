import { useRoomStore } from '../stores/roomStore';
import { usePlayerStore } from '../stores/playerStore';

export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR';

const MAX_RECONNECT_ATTEMPTS = 10;
const HEARTBEAT_INTERVAL = 15000; // 15s
const INITIAL_RECONNECT_DELAY = 1000;

export class RoomEngine {
  private static ws: WebSocket | null = null;
  private static reconnectTimer: any = null;
  private static heartbeatTimer: any = null;
  private static reconnectAttempts = 0;
  private static currentRoomId: string | null = null;
  private static messageQueue: any[] = [];
  private static URL_BASE = import.meta.env.PROD 
    ? `wss://${window.location.host}`
    : 'ws://localhost:8787';

  static async connect(roomId: string) {
    const { player } = usePlayerStore.getState();
    if (!player) return;

    this.currentRoomId = roomId;
    this.disconnect(true); // silent disconnect (no state reset)
    useRoomStore.getState().reset();
    useRoomStore.getState().updateState({ roomId, connectionState: 'CONNECTING' });

    const wsUrl = `${this.URL_BASE}/api/room/${roomId}?playerId=${player.id}&playerName=${encodeURIComponent(player.name || 'Anonymous')}`;
    
    try {
      this.ws = new WebSocket(wsUrl);
    } catch {
      useRoomStore.getState().updateState({ connectionState: 'ERROR' });
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      useRoomStore.getState().updateState({ connectionState: 'CONNECTED', isConnected: true, error: null });
      
      // Flush queued messages
      for (const msg of this.messageQueue) {
        this.send(msg);
      }
      this.messageQueue = [];
      
      // Start heartbeat
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ROOM_STATE') {
          useRoomStore.getState().updateState(msg.state);
        } else if (msg.type === 'KICKED') {
          useRoomStore.getState().setError('You have been kicked from the room.');
          this.disconnect();
        } else if (msg.type === 'PONG') {
          // Heartbeat response — connection is alive
        }
      } catch (e) {
        console.error('WebSocket message parsing error', e);
      }
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      useRoomStore.getState().updateState({ isConnected: false });
      
      // Don't auto-reconnect if we were intentionally kicked
      const error = useRoomStore.getState().error;
      if (error === 'You have been kicked from the room.') return;
      
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
        useRoomStore.getState().updateState({ connectionState: 'ERROR' });
        useRoomStore.getState().setError('Connection lost. Please try again.');
      }
    };

    this.ws.onerror = () => {
      // Handled by onclose
    };
  }

  static disconnect(silent = false) {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (!silent) {
      this.currentRoomId = null;
      this.reconnectAttempts = 0;
      this.messageQueue = [];
    }
  }

  private static startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'PING' });
    }, HEARTBEAT_INTERVAL);
  }

  private static stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  static send(msg: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      // Queue message if not yet connected
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
