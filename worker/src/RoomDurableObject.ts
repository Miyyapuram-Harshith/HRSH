import { Env } from './index';
import { GAME_SCHEMAS } from '../../src/data/gameSchemas';
import { Chess } from 'chess.js';

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

    const isHost = this.players.size === 0;
    
    if (!this.settings) {
      this.settings = {
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
      
      const schema = GAME_SCHEMAS['tic-tac-toe'];
      if (schema) {
        schema.forEach(s => {
          this.settings!.gameSettings![s.key] = s.defaultValue;
        });
      }
    }

    const isFull = Array.from(this.players.values()).filter(p => !p.isSpectator).length >= this.settings.maxPlayers;
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
    this.broadcastState();
    this.updateLiveIndex();

    ws.addEventListener('message', async (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        await this.handleMessage(playerId, msg);
      } catch (err) {
        console.error('Invalid message format', err);
      }
    });

    ws.addEventListener('close', () => {
      this.handleDisconnect(playerId);
    });
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
    
    // Initialize game state based on settings
    if (this.settings?.gameId === 'tic-tac-toe') {
      this.gameState = {
        board: Array(9).fill(null),
        turn: activePlayers[0],
        players: activePlayers,
        winner: null,
        winningLine: null,
        isDraw: false
      };
    } else if (this.settings?.gameId === 'connect-four') {
      this.gameState = {
        board: Array(6).fill(null).map(() => Array(7).fill(null)),
        turn: activePlayers[0],
        players: activePlayers,
        winner: null,
        isDraw: false
      };
    } else if (this.settings?.gameId === 'snake-arena') {
      const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#f97316', '#14b8a6'];
      const snakes = activePlayers.map((id, i) => ({
        id,
        color: colors[i % colors.length],
        body: [{ x: 10 + (i * 2), y: 10 + (i * 2) }],
        dir: { x: 1, y: 0 },
        nextDir: { x: 1, y: 0 },
        isDead: false,
        score: 0
      }));
      this.gameState = {
        gridSize: { w: 40, h: 40 },
        players: activePlayers,
        snakes,
        food: { x: Math.floor(Math.random() * 40), y: Math.floor(Math.random() * 40) },
        winner: null,
      };
      
      if (this.gameTickTimer) clearInterval(this.gameTickTimer);
      this.gameTickTimer = setInterval(() => this.tickSnakeArena(), 150);
    } else if (this.settings?.gameId === 'chess') {
      const chess = new Chess();
      this.gameState = {
        players: activePlayers,
        turn: activePlayers[0], // White
        fen: chess.fen(),
        history: [],
        winner: null,
        isDraw: false,
        whiteId: activePlayers[0],
        blackId: activePlayers[1] || null
      };
    } else if (this.settings?.gameId === 'word-guesser') {
      this.gameState = {
        players: activePlayers,
        scores: Object.fromEntries(activePlayers.map(id => [id, 0])),
        turn: activePlayers[0],
        word: 'HRSH', // Hardcoded for initial version
        guesses: [],
        phase: 'picking',
        timeRemaining: 60,
        winner: null
      };
    } else if (this.settings?.gameId === 'typing-test') {
      // Typing Race uses the MatchEngine progress system
      this.gameState = {
        challenge: 'This is a sample text for the typing race. We will implement server-side text generation soon.',
        duration: this.settings?.gameSettings?.duration || 60,
        startTime: Date.now()
      };
      
      if (this.progressTickTimer) clearInterval(this.progressTickTimer);
      this.progressTickTimer = setInterval(() => this.tickProgressBroadcast(), 500);
      
      // Also set a timer for the match duration
      setTimeout(() => this.endMatch(), this.gameState.duration * 1000 + 2000); // 2s buffer
    }

    this.broadcastState();
    this.updateLiveIndex();
  }

  private processGameAction(playerId: string, action: any) {
    if (!this.gameState || this.gameState.winner || this.gameState.isDraw) return;
    
    // Most turn-based games
    if (this.settings?.gameId !== 'snake-arena' && this.settings?.gameId !== 'typing-test') {
       if (this.gameState.turn !== playerId) return; 
    }

    if (this.settings?.gameId === 'tic-tac-toe') {
      if (action.type === 'PLACE' && typeof action.index === 'number') {
        const { index } = action;
        if (index >= 0 && index < 9 && this.gameState.board[index] === null) {
          const playerSymbol = this.gameState.players.indexOf(playerId) === 0 ? 'X' : 'O';
          this.gameState.board[index] = playerSymbol;
          this.checkTicTacToeWin();
          if (!this.gameState.winner && !this.gameState.isDraw) {
            this.gameState.turn = this.gameState.players.find((id: string) => id !== playerId);
          } else {
            this.status = 'RESULTS';
          }
          this.broadcastState();
        }
      }
    } else if (this.settings?.gameId === 'connect-four') {
      if (action.type === 'DROP' && typeof action.col === 'number') {
        const { col } = action;
        if (col >= 0 && col < 7) {
          const playerColor = this.gameState.players.indexOf(playerId) === 0 ? 'RED' : 'YELLOW';
          let row = -1;
          for (let r = 5; r >= 0; r--) {
            if (this.gameState.board[r][col] === null) {
              row = r;
              break;
            }
          }
          if (row !== -1) {
            this.gameState.board[row][col] = playerColor;
            this.checkConnectFourWin(row, col, playerColor);
            if (!this.gameState.winner && !this.gameState.isDraw) {
              this.gameState.turn = this.gameState.players.find((id: string) => id !== playerId);
            } else {
              this.status = 'RESULTS';
            }
            this.broadcastState();
          }
        }
      }
    } else if (this.settings?.gameId === 'chess') {
      if (action.type === 'MOVE') {
        const isWhiteTurn = this.gameState.turn === this.gameState.whiteId;
        if ((isWhiteTurn && playerId !== this.gameState.whiteId) || (!isWhiteTurn && playerId !== this.gameState.blackId)) {
          return; // Not their turn
        }
        
        try {
          const chess = new Chess(this.gameState.fen);
          const move = chess.move(action.move);
          if (move) {
            this.gameState.fen = chess.fen();
            this.gameState.history.push(move.san);
            
            if (chess.isCheckmate()) {
              this.gameState.winner = playerId;
              this.status = 'RESULTS';
            } else if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
              this.gameState.isDraw = true;
              this.status = 'RESULTS';
            } else {
              this.gameState.turn = isWhiteTurn ? this.gameState.blackId : this.gameState.whiteId;
            }
            this.broadcastState();
          }
        } catch (e) {
          // Invalid move
        }
      }
    } else if (this.settings?.gameId === 'snake-arena') {
      if (action.type === 'CHANGE_DIR') {
        const snake = this.gameState.snakes.find((s: any) => s.id === playerId);
        if (snake && !snake.isDead) {
          const { x, y } = action.dir;
          if (snake.dir.x !== -x || snake.dir.y !== -y) {
            snake.nextDir = { x, y };
          }
        }
      }
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

    const clientPlayers = activePlayers.map(p => ({
      id: p.id,
      progress: p.progress,
      liveMetricValue: p.liveMetricValue,
      rank: p.rank,
      finished: p.finished
    }));

    const msg = JSON.stringify({
      type: 'MATCH_PROGRESS_UPDATE',
      leaderboard: clientPlayers
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

  private tickSnakeArena() {
    if (this.status !== 'PLAYING') return;

    const { snakes, food, gridSize } = this.gameState;
    let aliveSnakes = 0;
    let lastAlive = null;

    for (const snake of snakes) {
      if (snake.isDead) continue;
      aliveSnakes++;
      lastAlive = snake;

      snake.dir = { ...snake.nextDir };
      const head = { ...snake.body[0] };
      head.x += snake.dir.x;
      head.y += snake.dir.y;

      if (head.x < 0 || head.x >= gridSize.w || head.y < 0 || head.y >= gridSize.h) {
        snake.isDead = true; continue;
      }

      let hit = false;
      for (const other of snakes) {
        if (other.isDead) continue;
        for (const segment of other.body) {
          if (segment.x === head.x && segment.y === head.y) {
            hit = true; break;
          }
        }
        if (hit) break;
      }
      if (hit) { snake.isDead = true; continue; }

      snake.body.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        snake.score += 10;
        food.x = Math.floor(Math.random() * gridSize.w);
        food.y = Math.floor(Math.random() * gridSize.h);
      } else {
        snake.body.pop();
      }
    }

    if (snakes.length > 1 && aliveSnakes <= 1) {
      this.status = 'RESULTS';
      this.gameState.winner = lastAlive ? lastAlive.id : null;
      if (this.gameTickTimer) { clearInterval(this.gameTickTimer); this.gameTickTimer = null; }
    } else if (snakes.length === 1 && aliveSnakes === 0) {
      this.status = 'RESULTS';
      if (this.gameTickTimer) { clearInterval(this.gameTickTimer); this.gameTickTimer = null; }
    }

    this.broadcastState();
  }

  private checkTicTacToeWin() {
    const b = this.gameState.board;
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const [x, y, z] of lines) {
      if (b[x] && b[x] === b[y] && b[x] === b[z]) {
        this.gameState.winner = this.gameState.players[b[x] === 'X' ? 0 : 1];
        this.gameState.winningLine = [x, y, z];
        return;
      }
    }
    if (!b.includes(null)) {
      this.gameState.isDraw = true;
    }
  }

  private checkConnectFourWin(row: number, col: number, color: string) {
    const b = this.gameState.board;
    const check = (dr: number, dc: number) => {
      let count = 1;
      let r = row + dr, c = col + dc;
      while (r >= 0 && r < 6 && c >= 0 && c < 7 && b[r][c] === color) { count++; r += dr; c += dc; }
      r = row - dr; c = col - dc;
      while (r >= 0 && r < 6 && c >= 0 && c < 7 && b[r][c] === color) { count++; r -= dr; c -= dc; }
      return count >= 4;
    };

    if (check(0, 1) || check(1, 0) || check(1, 1) || check(1, -1)) {
      this.gameState.winner = this.gameState.players[color === 'RED' ? 0 : 1];
    } else {
      let isDraw = true;
      for (let c = 0; c < 7; c++) {
        if (b[0][c] === null) isDraw = false;
      }
      this.gameState.isDraw = isDraw;
    }
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
      if (this.settings?.gameId === 'snake-arena') {
        const snake = this.gameState?.snakes?.find((s: any) => s.id === playerId);
        if (snake) snake.isDead = true;
      } else if (this.settings?.gameId === 'typing-test') {
        player.finished = true;
        this.checkMatchEnd();
      } else {
        this.status = 'RESULTS';
        if (this.gameState && this.gameState.players) {
          const remainingPlayer = this.gameState.players.find((id: string) => id !== playerId);
          this.gameState.winner = remainingPlayer;
        }
        if (this.gameTickTimer) {
          clearInterval(this.gameTickTimer);
          this.gameTickTimer = null;
        }
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
