import { useRoomStore } from '../stores/roomStore';
import { usePlayerStore } from '../stores/playerStore';

export class RoomEngine {
  private static ws: WebSocket | null = null;
  private static reconnectTimer: any = null;
  private static URL_BASE = import.meta.env.PROD 
    ? `wss://${window.location.host}`
    : 'ws://localhost:8787';

  static async connect(roomId: string) {
    const { player } = usePlayerStore.getState();
    if (!player) return;

    this.disconnect();
    useRoomStore.getState().reset();
    useRoomStore.getState().updateState({ roomId });

    const wsUrl = `${this.URL_BASE}/api/room/${roomId}?playerId=${player.id}&playerName=${encodeURIComponent(player.name || 'Anonymous')}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      useRoomStore.getState().updateState({ isConnected: true, error: null });
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ROOM_STATE') {
          useRoomStore.getState().updateState(msg.state);
        } else if (msg.type === 'KICKED') {
          useRoomStore.getState().setError('You have been kicked from the room.');
          this.disconnect();
        }
      } catch (e) {
        console.error('WebSocket message parsing error', e);
      }
    };

    this.ws.onclose = () => {
      useRoomStore.getState().updateState({ isConnected: false });
      // Don't auto-reconnect if we were intentionally kicked
      if (useRoomStore.getState().error !== 'You have been kicked from the room.') {
        this.reconnectTimer = setTimeout(() => this.connect(roomId), 3000);
      }
    };

    this.ws.onerror = () => {
      // Handled by onclose
    };
  }

  static disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  static send(msg: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
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

  static sendGameAction(action: any) {
    this.send({ type: 'GAME_ACTION', action });
  }

  static rematch() {
    this.send({ type: 'REMATCH' });
  }
}
