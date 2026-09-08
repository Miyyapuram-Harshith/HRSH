import { Env } from './index';
import { GAME_SCHEMAS } from '../../src/data/gameSchemas';
import { MatchEngine } from './MatchEngine';

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
  gameSettings?: Record<string, any>;
}

interface Player {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  isSpectator: boolean;
  ws?: WebSocket;
  // Match Engine generic fields
  progress: number;
  liveMetricValue: number;
  rank?: number;
  finished: boolean;
}

type RoomStatus = 'WAITING' | 'READY' | 'COUNTDOWN' | 'PLAYING' | 'FINISHING' | 'RESULTS' | 'CLOSED';

export class RoomDurableObject {
  private state: DurableObjectState;
  private env: Env;
  
  private players: Map<string, Player> = new Map();
  private settings: RoomSettings | null = null;
  private status: RoomStatus = 'WAITING';
  private roomId: string;
  private isCreated: boolean = false;
  
  private gameState: any = null; // Authoritative game state
  private countdownTimer: any = null;
  private countdownValue: number = 0;
  
  private gameTickTimer: any = null;
  private progressTickTimer: any = null; // For high-frequency throttled broadcasts

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.roomId = 'unknown'; 
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    this.roomId = segments[3];

    if (url.pathname.startsWith('/api/init/') && request.method === 'POST') {
      this.isCreated = true;
      return new Response('OK');
    }

    if (request.headers.get('Upgrade') === 'websocket') {
      if (!this.isCreated) {
        return new Response('Room Not Found', { status: 404 });
      }

      const [client, server] = Object.values(new WebSocketPair());
      const playerId = url.searchParams.get('playerId') || 'unknown';
      const playerName = url.searchParams.get('playerName') || 'Anonymous';
      
      await this.handleWebSocket(server, playerId, playerName);
      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response('Expected WebSocket', { status: 400 });
  }

  private async handleWebSocket(ws: WebSocket, playerId: string, playerName: string) {
    this.state.acceptWebSocket(ws);

    // Instead of joining immediately, we wait for ROOM_JOIN message
    // We bind a temporary listener
    ws.addEventListener('message', async (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === 'ROOM_JOIN') {
          await this.handleRoomJoin(ws, msg);
        } else if (msg.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG' }));
        } else {
          // If already joined, process normally. 
          // We extract playerId from the connected player if possible, or use the one from URL fallback.
          await this.handleMessage(msg.playerId || playerId, msg);
        }
      } catch (err) {
        console.error('Invalid message format', err);
      }
    });

    ws.addEventListener('close', () => {
      this.handleDisconnect(playerId);
    });
  }

  private async handleRoomJoin(ws: WebSocket, msg: any) {
    const { playerId, playerName, initialSettings } = msg;
    
    if (this.status === 'CLOSED') {
      ws.send(JSON.stringify({ type: 'ERROR', code: 'ROOM_CLOSED', message: 'This room is closed.' }));
      return;
    }

    // Check if player is already in room (reconnect)
    const existingPlayer = this.players.get(playerId);
    if (existingPlayer) {
      existingPlayer.ws = ws;
      existingPlayer.name = playerName || existingPlayer.name;
      ws.send(JSON.stringify({ type: 'ROOM_JOINED' }));
      this.broadcastState();
      return;
    }

    const isHost = this.players.size === 0;

    if (!this.settings) {
      // If this is the first player and initialSettings are provided, use them
      const baseSettings: RoomSettings = {
        gameId: 'tic-tac-toe',
        mode: 'casual',
        maxPlayers: 2,
        visibility: 'private',
        roomName: `${playerName}'s Room`,
        spectatorsAllowed: true,
        autoStartWhenFull: false,
        countdownSeconds: 3,
        rematchSameRoom: true,
        gameSettings: {}
      };

      this.settings = { ...baseSettings, ...initialSettings };
      
      // Ensure defaults exist for gameSettings based on schema
      if (this.settings?.gameId) {
        const schema = GAME_SCHEMAS[this.settings.gameId];
        if (schema) {
          if (!this.settings.gameSettings) this.settings.gameSettings = {};
          schema.forEach(s => {
            if (this.settings!.gameSettings![s.key] === undefined) {
              this.settings!.gameSettings![s.key] = s.defaultValue;
            }
          });
        }
      }
    }

    const activePlayersCount = Array.from(this.players.values()).filter(p => !p.isSpectator).length;
    const isFull = activePlayersCount >= this.settings.maxPlayers;
    
    if (isFull && !this.settings.spectatorsAllowed) {
      ws.send(JSON.stringify({ type: 'ERROR', code: 'ROOM_FULL', message: 'Room is full.' }));
      return;
    }

    const isSpectator = isFull;

    const player: Player = {
      id: playerId,
      name: playerName,
      isReady: false,
      isHost,
      isSpectator,
      ws,
      progress: 0,
      liveMetricValue: 0,
      finished: false
    };

    this.players.set(playerId, player);
    
    ws.send(JSON.stringify({ type: 'ROOM_JOINED' }));
    this.broadcastState();
    this.updateLiveIndex();
  }

  private async handleMessage(playerId: string, msg: any) {
    const player = this.players.get(playerId);
    if (!player) return;

    switch (msg.type) {
      case 'ROOM_SETTINGS_UPDATE':
        if (player.isHost && this.status === 'WAITING') {
          const newSettings = { ...this.settings, ...msg.settings } as RoomSettings;
          
          if (newSettings.gameSettings && newSettings.gameId) {
            const schema = GAME_SCHEMAS[newSettings.gameId];
            if (schema) {
              const validatedGameSettings: Record<string, any> = {};
              for (const s of schema) {
                const val = newSettings.gameSettings[s.key];
                if (val !== undefined) {
                  if (s.type === 'slider' || s.type === 'number') {
                    validatedGameSettings[s.key] = Number(val) || s.defaultValue;
                  } else {
                    validatedGameSettings[s.key] = val;
                  }
                } else {
                  validatedGameSettings[s.key] = s.defaultValue;
                }
              }
              newSettings.gameSettings = validatedGameSettings;
            }
          }

          this.settings = newSettings;
          this.broadcastState();
          this.updateLiveIndex();
        }
        break;

      case 'TOGGLE_READY':
        if (this.status === 'WAITING') {
          player.isReady = !player.isReady;
          this.broadcastState();
          this.checkAutoStart();
        }
        break;

      case 'START_NOW':
        if (player.isHost && this.status === 'WAITING') {
          this.startCountdown();
        }
        break;

      case 'KICK_PLAYER':
        if (player.isHost && msg.targetId && msg.targetId !== playerId) {
          const target = this.players.get(msg.targetId);
          if (target && target.ws) {
            target.ws.send(JSON.stringify({ type: 'KICKED' }));
            target.ws.close();
            this.handleDisconnect(msg.targetId);
          }
        }
        break;

      case 'GAME_ACTION':
        if (this.status === 'PLAYING' || this.status === 'FINISHING') {
          this.processGameAction(playerId, msg.action);
        }
        break;

      case 'MATCH_PROGRESS':
        if (this.status === 'PLAYING' || this.status === 'FINISHING') {
          if (!player.finished) {
            player.progress = msg.payload.progress;
            player.liveMetricValue = msg.payload.liveMetricValue;
          }
        }
        break;

      case 'MATCH_FINISHED':
        if (this.status === 'PLAYING' || this.status === 'FINISHING') {
          player.finished = true;
          player.progress = msg.payload.progress;
          player.liveMetricValue = msg.payload.liveMetricValue;
          this.checkMatchEnd();
        }
        break;

      case 'REMATCH':
        if (this.status === 'RESULTS' && player.isHost) {
          this.status = 'WAITING';
          this.gameState = null;
          if (this.gameTickTimer) {
            clearInterval(this.gameTickTimer);
            this.gameTickTimer = null;
          }
          if (this.progressTickTimer) {
            clearInterval(this.progressTickTimer);
            this.progressTickTimer = null;
          }
          for (const p of this.players.values()) {
            p.isReady = false;
            p.progress = 0;
            p.liveMetricValue = 0;
            p.finished = false;
            p.rank = undefined;
          }
          this.broadcastState();
        }
        break;
    }
  }

  private checkAutoStart() {
    if (this.settings?.autoStartWhenFull) {
      const activePlayers = Array.from(this.players.values()).filter(p => !p.isSpectator);
      if (activePlayers.length === this.settings.maxPlayers && activePlayers.every(p => p.isReady)) {
        this.startCountdown();
      }
    }
  }

  private startCountdown() {
    this.status = 'COUNTDOWN';
    this.countdownValue = this.settings?.countdownSeconds || 3;
    this.broadcastState();

    if (this.countdownTimer) clearInterval(this.countdownTimer);
    
    this.countdownTimer = setInterval(() => {
      this.countdownValue--;
      if (this.countdownValue <= 0) {
        clearInterval(this.countdownTimer);
        this.startGame();
      } else {
        this.broadcastState();
      }
    }, 1000);
  }

  private startGame() {
    this.status = 'PLAYING';
    
    const activePlayers = Array.from(this.players.values()).filter(p => !p.isSpectator).map(p => p.id);
    
    // Use MatchEngine to initialize state
    this.gameState = MatchEngine.initialize(this.settings?.gameId || '', this.settings, activePlayers);
    
    if (this.settings?.gameId === 'snake-arena') {
      if (this.gameTickTimer) clearInterval(this.gameTickTimer);
      this.gameTickTimer = setInterval(() => {
        const { updated, matchEnded } = MatchEngine.tick(this.settings?.gameId || '', this.gameState);
        if (matchEnded) {
          this.status = 'RESULTS';
          if (this.gameTickTimer) { clearInterval(this.gameTickTimer); this.gameTickTimer = null; }
        }
        if (updated) this.broadcastState();
      }, 150);
    } else if (this.settings?.gameId === 'typing-test') {
      if (this.progressTickTimer) clearInterval(this.progressTickTimer);
      this.progressTickTimer = setInterval(() => this.tickProgressBroadcast(), 500);
      
      setTimeout(() => this.endMatch(), this.gameState.duration * 1000 + 2000);
    }

    this.broadcastState();
    this.updateLiveIndex();
  }

  private processGameAction(playerId: string, action: any) {
    if (!this.gameState || this.gameState.winner || this.gameState.isDraw) return;
    
    const { updated, matchEnded } = MatchEngine.processAction(
      this.settings?.gameId || '',
      action,
      playerId,
      this.gameState
    );

    if (matchEnded) {
      this.status = 'RESULTS';
    }

    if (updated || matchEnded) {
      this.broadcastState();
    }
  }

  private tickProgressBroadcast() {
    if (this.status !== 'PLAYING' && this.status !== 'FINISHING') return;

    const activePlayers = Array.from(this.players.values()).filter(p => !p.isSpectator);
    // Sort players by progress or score to compute ranks
    const sorted = [...activePlayers].sort((a, b) => b.progress - a.progress);
    sorted.forEach((p, index) => {
      p.rank = index + 1;
    });

    const clientPlayers = activePlayers.map(p => ([
      p.id,
      p.progress,
      p.liveMetricValue,
      p.rank,
      p.finished ? 1 : 0
    ]));

    const msg = JSON.stringify({
      type: 'MATCH_PROGRESS_UPDATE',
      leaderboard: clientPlayers // Compact format: [id, progress, liveValue, rank, finished]
    });

    for (const p of this.players.values()) {
      if (p.ws && p.ws.readyState === WebSocket.READY_STATE_OPEN) {
        try { p.ws.send(msg); } catch (e) {}
      }
    }
  }

  private checkMatchEnd() {
    const activePlayers = Array.from(this.players.values()).filter(p => !p.isSpectator);
    const allFinished = activePlayers.every(p => p.finished);
    if (allFinished) {
      this.endMatch();
    } else if (this.status === 'PLAYING') {
      this.status = 'FINISHING';
      this.broadcastState();
    }
  }

  private endMatch() {
    this.status = 'RESULTS';
    if (this.progressTickTimer) {
      clearInterval(this.progressTickTimer);
      this.progressTickTimer = null;
    }
    this.tickProgressBroadcast(); // Final flush
    this.broadcastState();
  }



  private handleDisconnect(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return;

    this.players.delete(playerId);

    if (this.players.size === 0) {
      this.updateLiveIndex(true);
      return;
    }

    if (player.isHost) {
      const nextHost = Array.from(this.players.values())[0];
      if (nextHost) nextHost.isHost = true;
    }

    if ((this.status === 'PLAYING' || this.status === 'FINISHING') && !player.isSpectator) {
      const { matchEnded } = MatchEngine.handleDisconnect(this.settings?.gameId || '', this.gameState, playerId);
      if (matchEnded) {
        this.status = 'RESULTS';
        if (this.gameTickTimer) {
          clearInterval(this.gameTickTimer);
          this.gameTickTimer = null;
        }
      } else if (this.settings?.gameId === 'typing-test') {
        player.finished = true;
        this.checkMatchEnd();
      }
    }

    this.broadcastState();
    this.updateLiveIndex();
  }

  private broadcastState() {
    const clientPlayers = Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      isReady: p.isReady,
      isHost: p.isHost,
      isSpectator: p.isSpectator,
      progress: p.progress,
      liveMetricValue: p.liveMetricValue,
      rank: p.rank,
      finished: p.finished
    }));

    const statePayload = {
      type: 'ROOM_STATE',
      state: {
        roomId: this.roomId,
        status: this.status,
        settings: this.settings,
        players: clientPlayers,
        gameState: this.gameState,
        countdown: this.countdownValue
      }
    };

    const msg = JSON.stringify(statePayload);
    for (const p of this.players.values()) {
      if (p.ws && p.ws.readyState === WebSocket.READY_STATE_OPEN) {
        try { p.ws.send(msg); } catch (e) {}
      }
    }
  }

  private updateLiveIndex(remove = false) {
    if (this.settings?.visibility === 'private') {
      remove = true;
    }

    const liveIndexId = this.env.LIVE_INDEX.idFromName('GLOBAL_INDEX');
    const liveIndex = this.env.LIVE_INDEX.get(liveIndexId);

    const activePlayers = Array.from(this.players.values()).filter(p => !p.isSpectator).length;

    const payload = remove ? {
      action: 'remove',
      roomId: this.roomId
    } : {
      action: 'update',
      roomId: this.roomId,
      roomData: {
        id: this.roomId,
        gameId: this.settings?.gameId,
        gameTitle: this.settings?.gameId === 'tic-tac-toe' ? 'Tic-Tac-Toe' : 'Connect Four',
        mode: this.settings?.mode,
        currentPlayers: activePlayers,
        maxPlayers: this.settings?.maxPlayers,
        joinable: this.status === 'WAITING' && activePlayers < (this.settings?.maxPlayers || 2),
        watchable: this.settings?.spectatorsAllowed,
        icon: this.settings?.gameId === 'tic-tac-toe' ? '❌' : '🔴'
      }
    };

    liveIndex.fetch('http://internal/api/live/update', {
      method: 'POST',
      body: JSON.stringify(payload)
    }).catch(() => {});
  }
}
