import { Env } from './index';
import { GAME_SCHEMAS } from '../../src/data/gameSchemas';
import { MatchEngine } from './MatchEngine';
import { Database } from './db';

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
  customization?: Record<string, any>;
  ws?: WebSocket;
  connectionState: 'CONNECTED' | 'DISCONNECTED';
  disconnectTimer?: any;
  teamId?: string; // Team support
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
  private version: number = 0;
  
  private gameId: string = 'tic-tac-toe';
  private mode: string = 'classic';
  private gameSettings: any = {};
  private roomCode: string = '';
  private createdAt: number = 0;
  
  // Team systems
  private teamsEnabled: boolean = false;
  private teams: any[] = [];
  
  private gameState: any = null; // Authoritative game state
  private countdownTimer: any = null;
  private countdownValue: number = 0;
  
  private gameTickTimer: any = null;
  private progressTickTimer: any = null; // For high-frequency throttled broadcasts

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.roomId = 'unknown'; 
    
    this.state.blockConcurrencyWhile(async () => {
      this.isCreated = (await this.state.storage.get('isCreated')) || false;
      const savedSettings = await this.state.storage.get<RoomSettings>('settings');
      if (savedSettings) this.settings = savedSettings;
      
      this.gameId = (await this.state.storage.get('gameId')) || 'tic-tac-toe';
      this.mode = (await this.state.storage.get('mode')) || 'classic';
      this.gameSettings = (await this.state.storage.get('gameSettings')) || {};
      this.roomCode = (await this.state.storage.get('roomCode')) || '';
      this.createdAt = (await this.state.storage.get('createdAt')) || Date.now();
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    this.roomId = segments[3];

    if (url.pathname.startsWith('/api/init/') && request.method === 'POST') {
      this.isCreated = true;
      let payload: any = {};
      try {
        payload = await request.json();
      } catch (e) {
        // ignore
      }
      
      const gameId = payload.gameId || payload.settings?.gameId || 'tic-tac-toe';
      const mode = payload.mode || payload.settings?.mode || 'classic';
      const gameSettings = payload.gameSettings || payload.settings?.gameSettings || {};
      
      const baseSettings: RoomSettings = {
        gameId,
        mode,
        maxPlayers: payload.maxPlayers || payload.settings?.maxPlayers || 2,
        visibility: payload.visibility || payload.settings?.visibility || 'private',
        roomName: payload.roomName || payload.settings?.roomName || 'HRSH Room',
        spectatorsAllowed: payload.spectatorsAllowed ?? payload.settings?.spectatorsAllowed ?? true,
        autoStartWhenFull: payload.autoStartWhenFull ?? payload.settings?.autoStartWhenFull ?? false,
        countdownSeconds: payload.countdownSeconds ?? payload.settings?.countdownSeconds ?? 3,
        rematchSameRoom: payload.rematchSameRoom ?? payload.settings?.rematchSameRoom ?? true,
        gameSettings: { ...gameSettings }
      };

      // Ensure defaults exist for gameSettings based on schema
      const schema = GAME_SCHEMAS[gameId];
      if (schema) {
        schema.forEach(s => {
          if (baseSettings.gameSettings![s.key] === undefined) {
            baseSettings.gameSettings![s.key] = s.defaultValue;
          }
        });
      }

      this.gameId = gameId;
      this.mode = mode;
      this.settings = baseSettings;
      this.gameSettings = baseSettings.gameSettings;
      this.roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      this.createdAt = Date.now();
      
      await Promise.all([
        this.state.storage.put('isCreated', true),
        this.state.storage.put('gameId', this.gameId),
        this.state.storage.put('mode', this.mode),
        this.state.storage.put('settings', this.settings),
        this.state.storage.put('gameSettings', this.gameSettings),
        this.state.storage.put('roomCode', this.roomCode),
        this.state.storage.put('createdAt', this.createdAt)
      ]);

      return new Response(JSON.stringify({
        roomCode: this.roomCode,
        gameId: this.gameId,
        mode: this.mode,
        settings: this.settings,
        gameSettings: this.gameSettings,
        createdAt: this.createdAt
      }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    if (request.headers.get('Upgrade') === 'websocket') {
      const [client, server] = Object.values(new WebSocketPair());
      const playerId = url.searchParams.get('playerId') || 'unknown';
      const playerName = url.searchParams.get('playerName') || 'Anonymous';
      
      this.state.acceptWebSocket(server, [playerId]);
      server.serializeAttachment({ playerId, playerName });
      
      if (!this.isCreated) {
        server.send(JSON.stringify({ type: 'ERROR', code: 'ROOM_NOT_FOUND', message: 'Room not found.' }));
        server.close(4004, 'Room Not Found');
        return new Response(null, { status: 101, webSocket: client });
      }

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response('Expected WebSocket', { status: 400 });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    try {
      const msg = JSON.parse(message as string);
      const attachment = ws.deserializeAttachment();
      const playerId = msg.playerId || attachment?.playerId || 'unknown';
      
      if (msg.type === 'ROOM_JOIN') {
        await this.handleRoomJoin(ws, msg, attachment);
      } else if (msg.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
      } else {
        await this.handleMessage(playerId, msg);
      }
    } catch (err) {
      console.error('Invalid message format', err);
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    const attachment = ws.deserializeAttachment();
    if (attachment?.playerId) {
      this.handleDisconnect(attachment.playerId);
    }
  }

  async webSocketError(ws: WebSocket, error: unknown) {
    const attachment = ws.deserializeAttachment();
    if (attachment?.playerId) {
      this.handleDisconnect(attachment.playerId);
    }
  }

  private async handleRoomJoin(ws: WebSocket, msg: any, attachment: any) {
    const playerId = msg.playerId || attachment?.playerId;
    const playerName = msg.playerName || attachment?.playerName;
    const initialSettings = msg.initialSettings;
    
    if (this.status === 'CLOSED') {
      ws.send(JSON.stringify({ type: 'ERROR', code: 'ROOM_CLOSED', message: 'This room is closed.' }));
      return;
    }

    // Check if player is already in room (reconnect)
    const existingPlayer = this.players.get(playerId);
    if (existingPlayer) {
      existingPlayer.ws = ws;
      existingPlayer.name = playerName || existingPlayer.name;
      if (msg.customization) {
        existingPlayer.customization = { ...existingPlayer.customization, ...msg.customization };
      }
      existingPlayer.connectionState = 'CONNECTED';
      if (existingPlayer.disconnectTimer) {
        clearTimeout(existingPlayer.disconnectTimer);
        existingPlayer.disconnectTimer = undefined;
      }
      ws.send(JSON.stringify({ type: 'ROOM_JOINED' }));
      this.broadcastState();
      return;
    }

    const isHost = this.players.size === 0;

    if (!this.settings || !this.settings.gameId) {
      // If this is the first player and initialSettings are provided, use them
      const initSettings = initialSettings || {};
      const gameId = initSettings.gameId || this.gameId || 'tic-tac-toe';
      const baseSettings: RoomSettings = {
        gameId,
        mode: initSettings.mode || this.mode || 'classic',
        maxPlayers: initSettings.maxPlayers || 2,
        visibility: initSettings.visibility || 'private',
        roomName: initSettings.roomName || `${playerName}'s Room`,
        spectatorsAllowed: initSettings.spectatorsAllowed ?? true,
        autoStartWhenFull: initSettings.autoStartWhenFull ?? false,
        countdownSeconds: initSettings.countdownSeconds ?? 3,
        rematchSameRoom: initSettings.rematchSameRoom ?? true,
        gameSettings: initSettings.gameSettings || {}
      };

      this.settings = { ...baseSettings, ...initSettings };
      this.gameId = this.settings.gameId;
      this.mode = this.settings.mode;
      
      // Ensure defaults exist for gameSettings based on schema
      const schema = GAME_SCHEMAS[this.settings.gameId];
      if (schema) {
        if (!this.settings.gameSettings) this.settings.gameSettings = {};
        schema.forEach(s => {
          if (this.settings!.gameSettings![s.key] === undefined) {
            this.settings!.gameSettings![s.key] = s.defaultValue;
          }
        });
      }
      
      this.gameSettings = this.settings.gameSettings;
      this.state.storage.put('settings', this.settings);
      this.state.storage.put('gameId', this.gameId);
      this.state.storage.put('mode', this.mode);
      this.state.storage.put('gameSettings', this.gameSettings);
      
      // Initialize teams if needed
      if (this.settings.gameSettings?.teamMode || this.settings.gameSettings?.teams) {
        this.initializeTeams();
      }
    }

    const activePlayersCount = Array.from(this.players.values()).filter(p => !p.isSpectator).length;
    const isFull = activePlayersCount >= this.settings.maxPlayers;
    
    if (isFull && !this.settings.spectatorsAllowed) {
      ws.send(JSON.stringify({ type: 'ERROR', code: 'ROOM_FULL', message: 'Room is full.' }));
      return;
    }

    const isSpectator = isFull;

    let assignedTeamId: string | undefined;
    
    if (this.teamsEnabled && msg.requestedTeamCode) {
      const requestedTeam = this.teams.find(t => t.joinCode === msg.requestedTeamCode);
      if (requestedTeam) {
        // Count players in team
        const teamPlayers = Array.from(this.players.values()).filter(p => p.teamId === requestedTeam.id);
        const maxPerTeam = this.settings.maxPlayers / this.teams.length;
        if (teamPlayers.length >= maxPerTeam) {
          ws.send(JSON.stringify({ type: 'ERROR', code: 'TEAM_FULL', message: 'This team is full.' }));
          return;
        }
        assignedTeamId = requestedTeam.id;
      } else {
        ws.send(JSON.stringify({ type: 'ERROR', code: 'INVALID_TEAM', message: 'Invalid team code.' }));
        return;
      }
    } else if (this.teamsEnabled) {
      // Auto-assign to smallest team
      let smallestTeam = this.teams[0];
      let smallestCount = Infinity;
      for (const t of this.teams) {
        const count = Array.from(this.players.values()).filter(p => p.teamId === t.id).length;
        if (count < smallestCount) {
          smallestCount = count;
          smallestTeam = t;
        }
      }
      if (smallestTeam) {
        assignedTeamId = smallestTeam.id;
      }
    }

    const player: Player = {
      id: playerId,
      name: playerName,
      isReady: false,
      isHost,
      isSpectator,
      customization: msg.customization || {},
      ws,
      connectionState: 'CONNECTED',
      progress: 0,
      liveMetricValue: 0,
      finished: false,
      teamId: assignedTeamId
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
          this.state.storage.put('settings', this.settings);
          
          if (newSettings.gameSettings?.teamMode || newSettings.gameSettings?.teams) {
            if (!this.teamsEnabled) {
              this.initializeTeams();
            }
          } else {
            this.teamsEnabled = false;
            this.teams = [];
            for (const p of this.players.values()) {
              p.teamId = undefined;
            }
          }
          
          this.broadcastState();
          this.updateLiveIndex();
        }
        break;

      case 'JOIN_TEAM':
        if (this.status === 'WAITING' && this.teamsEnabled) {
          const teamCode = msg.teamCode?.toUpperCase();
          const targetTeam = this.teams.find(t => t.joinCode === teamCode);
          if (targetTeam) {
            // Validate capacity
            const teamMembers = Array.from(this.players.values()).filter(p => p.teamId === targetTeam.id);
            const teamSizeLimit = this.settings?.gameSettings?.teamSize || 5; // default 5
            if (teamMembers.length < teamSizeLimit) {
              player.teamId = targetTeam.id;
              this.broadcastState();
            } else {
              player.ws?.send(JSON.stringify({ type: 'ERROR', message: 'Team is full.' }));
            }
          } else {
            player.ws?.send(JSON.stringify({ type: 'ERROR', message: 'Invalid team code.' }));
          }
        }
        break;

      case 'PLAYER_CUSTOMIZATION_UPDATE':
        if (this.status === 'WAITING' || this.status === 'READY') {
          player.customization = msg.customization || {};
          this.broadcastState();
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

      case 'TRANSFER_HOST':
        if (player.isHost && msg.targetId && msg.targetId !== playerId) {
          const target = this.players.get(msg.targetId);
          if (target) {
            player.isHost = false;
            target.isHost = true;
            this.broadcastState();
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

  private initializeTeams() {
    this.teamsEnabled = true;
    const generateCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    
    this.teams = [
      { id: 'team-red', name: 'Red Team', color: '#ef4444', joinCode: generateCode() },
      { id: 'team-blue', name: 'Blue Team', color: '#3b82f6', joinCode: generateCode() }
    ];
    
    // Auto-assign existing players if unassigned
    let redCount = 0;
    let blueCount = 0;
    for (const p of this.players.values()) {
      if (!p.isSpectator && !p.teamId) {
        if (redCount <= blueCount) {
          p.teamId = 'team-red';
          redCount++;
        } else {
          p.teamId = 'team-blue';
          blueCount++;
        }
      } else if (p.teamId === 'team-red') {
        redCount++;
      } else if (p.teamId === 'team-blue') {
        blueCount++;
      }
    }
  }

  private startGame() {
    this.status = 'PLAYING';
    
    const activePlayers = Array.from(this.players.values()).filter(p => !p.isSpectator);
    
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
    } else if (this.settings?.gameId === 'chess') {
      if (this.gameTickTimer) clearInterval(this.gameTickTimer);
      this.gameTickTimer = setInterval(() => {
        const { updated, matchEnded } = MatchEngine.tick(this.settings?.gameId || '', this.gameState);
        if (matchEnded) {
          this.status = 'RESULTS';
          if (this.gameTickTimer) { clearInterval(this.gameTickTimer); this.gameTickTimer = null; }
          this.broadcastState();
        } else if (updated) {
          this.broadcastState();
        }
      }, 1000);
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
      
      // Save match to D1 Database
      if (this.env.DB) {
        const db = new Database(this.env.DB);
        const playersData = Array.from(this.players.values()).filter(p => !p.isSpectator).map(p => ({
          id: p.id,
          score: p.progress,
          rank: p.rank || 0,
          metrics: { liveValue: p.liveMetricValue }
        }));
        
        db.recordMatch(
          this.settings?.gameId || 'tic-tac-toe',
          this.settings?.mode || 'classic',
          this.settings || {},
          this.gameState.winner || null,
          playersData
        ).catch(err => console.error("Failed to save match to DB:", err));
        
        // Add XP to participants (e.g. 50 for win, 10 for loss/draw)
        playersData.forEach(p => {
          const xp = p.id === this.gameState.winner ? 50 : 10;
          db.addXP(p.id, xp).catch(err => console.error("Failed to add XP:", err));
        });
      }
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
    
    // Save match to D1 Database
    if (this.env.DB && this.settings?.gameId) {
        const db = new Database(this.env.DB);
        const playersData = Array.from(this.players.values()).filter(p => !p.isSpectator).map(p => ({
          id: p.id,
          score: p.progress,
          rank: p.rank || 0,
          metrics: { liveValue: p.liveMetricValue }
        }));
        
        // Find winner (player with highest progress, or lowest time, etc)
        // For generic progress-based games:
        const sorted = [...playersData].sort((a, b) => {
            if (a.rank && b.rank) return a.rank - b.rank;
            return b.score - a.score;
        });
        const winnerId = sorted.length > 0 ? sorted[0].id : null;
        
        db.recordMatch(
          this.settings.gameId,
          this.settings.mode || 'classic',
          this.settings || {},
          winnerId,
          playersData
        ).catch(err => console.error("Failed to save match to DB in endMatch:", err));
        
        playersData.forEach(p => {
          const xp = p.id === winnerId ? 50 : 10;
          db.addXP(p.id, xp).catch(err => console.error("Failed to add XP:", err));
        });
    }

    this.broadcastState();
  }



  private handleDisconnect(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return;

    player.connectionState = 'DISCONNECTED';
    player.ws = undefined;
    this.broadcastState();

    // 30 second grace period
    player.disconnectTimer = setTimeout(() => {
      this.players.delete(playerId);

      if (this.players.size === 0) {
        this.updateLiveIndex(true);
        return;
      }

      if (player.isHost) {
        const nextHost = Array.from(this.players.values()).find(p => p.connectionState === 'CONNECTED');
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
    }, 30000);
  }

  private broadcastState() {
    this.version++;
    const clientPlayers = Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      isReady: p.isReady,
      isHost: p.isHost,
      isSpectator: p.isSpectator,
      connectionState: p.connectionState,
      teamId: p.teamId,
      customization: p.customization || {},
      progress: p.progress,
      liveMetricValue: p.liveMetricValue,
      rank: p.rank,
      finished: p.finished
    }));

    for (const p of this.players.values()) {
      if (p.ws && p.ws.readyState === WebSocket.READY_STATE_OPEN) {
        
        // Mask state per player if needed
        let playerGameState = this.gameState;
        if (this.gameState && this.settings?.gameId) {
            playerGameState = MatchEngine.getMaskedState(this.settings.gameId, this.gameState, p.id);
        }

        const statePayload = {
          type: 'ROOM_STATE',
          state: {
            roomId: this.roomId,
            roomCode: this.roomCode,
            version: this.version,
            status: this.status,
            settings: this.settings,
            teamsEnabled: this.teamsEnabled,
            teams: this.teams,
            players: clientPlayers,
            gameState: playerGameState,
            countdown: this.countdownValue
          }
        };

        try { p.ws.send(JSON.stringify(statePayload)); } catch (e) {}
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
