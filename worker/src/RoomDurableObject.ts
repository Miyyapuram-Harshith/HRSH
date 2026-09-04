import { Env } from './index';

interface RoomSettings {
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

interface Player {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  isSpectator: boolean;
  ws?: WebSocket;
}

type RoomStatus = 'LOBBY' | 'READY' | 'COUNTDOWN' | 'PLAYING' | 'FINISHED';

export class RoomDurableObject {
  private state: DurableObjectState;
  private env: Env;
  
  private players: Map<string, Player> = new Map();
  private settings: RoomSettings | null = null;
  private status: RoomStatus = 'LOBBY';
  private roomId: string;
  private gameState: any = null; // Authoritative game state
  private countdownTimer: any = null;
  private countdownValue: number = 0;
  private gameTickTimer: any = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    // We don't have the room ID directly, but we can extract it if needed or assume it's part of the state
    this.roomId = 'unknown'; // Will be set on first connect or init
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // Extract roomId from URL path (e.g. /api/room/X7K9Q)
    const segments = url.pathname.split('/');
    this.roomId = segments[3];

    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
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

    // If room is new, first player is host
    const isHost = this.players.size === 0;
    
    // Initialize default settings if first player
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
        rematchSameRoom: true
      };
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
        if (player.isHost && this.status === 'LOBBY') {
          this.settings = { ...this.settings, ...msg.settings } as RoomSettings;
          this.broadcastState();
          this.updateLiveIndex();
        }
        break;

      case 'TOGGLE_READY':
        if (this.status === 'LOBBY') {
          player.isReady = !player.isReady;
          this.broadcastState();
          this.checkAutoStart();
        }
        break;

      case 'START_NOW':
        if (player.isHost && this.status === 'LOBBY') {
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
        if (this.status === 'PLAYING') {
          this.processGameAction(playerId, msg.action);
        }
        break;

      case 'REMATCH':
        if (this.status === 'FINISHED' && player.isHost) {
          this.status = 'LOBBY';
          this.gameState = null;
          if (this.gameTickTimer) {
            clearInterval(this.gameTickTimer);
            this.gameTickTimer = null;
          }
          for (const p of this.players.values()) {
            p.isReady = false;
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
    }

    this.broadcastState();
    this.updateLiveIndex();
  }

  private processGameAction(playerId: string, action: any) {
    if (!this.gameState || this.gameState.winner || this.gameState.isDraw) return;
    if (this.gameState.turn !== playerId) return; // Not their turn

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
            this.status = 'FINISHED';
          }
          this.broadcastState();
        }
      }
    } else if (this.settings?.gameId === 'connect-four') {
      if (action.type === 'DROP' && typeof action.col === 'number') {
        const { col } = action;
        if (col >= 0 && col < 7) {
          const playerColor = this.gameState.players.indexOf(playerId) === 0 ? 'RED' : 'YELLOW';
          // Find lowest empty row
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
              this.status = 'FINISHED';
            }
            this.broadcastState();
          }
        }
      }
    } else if (this.settings?.gameId === 'snake-arena') {
      if (action.type === 'CHANGE_DIR') {
        const snake = this.gameState.snakes.find((s: any) => s.id === playerId);
        if (snake && !snake.isDead) {
          const { x, y } = action.dir;
          // Prevent 180 turns
          if (snake.dir.x !== -x || snake.dir.y !== -y) {
            snake.nextDir = { x, y };
          }
        }
      }
    } else if (this.settings?.gameId === 'word-guesser') {
      if (action.type === 'GUESS') {
        if (this.gameState.phase === 'picking') {
          if (playerId === this.gameState.turn) {
            this.gameState.word = action.word.toUpperCase();
            this.gameState.phase = 'guessing';
            this.broadcastState();
          }
        } else if (this.gameState.phase === 'guessing') {
          const isCorrect = action.word.toUpperCase() === this.gameState.word;
          this.gameState.guesses.push({ playerId, text: action.word, isCorrect });
          if (isCorrect) {
            this.gameState.scores[playerId] += 10;
            this.gameState.phase = 'round-end';
            this.gameState.winner = playerId;
            this.status = 'FINISHED';
          }
          this.broadcastState();
        }
      }
    }
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

      // Wall collision
      if (head.x < 0 || head.x >= gridSize.w || head.y < 0 || head.y >= gridSize.h) {
        snake.isDead = true;
        continue;
      }

      // Self or other snake collision
      let hit = false;
      for (const other of snakes) {
        if (other.isDead) continue;
        for (const segment of other.body) {
          if (segment.x === head.x && segment.y === head.y) {
            hit = true;
            break;
          }
        }
        if (hit) break;
      }
      if (hit) {
        snake.isDead = true;
        continue;
      }

      snake.body.unshift(head);

      // Food collision
      if (head.x === food.x && head.y === food.y) {
        snake.score += 10;
        food.x = Math.floor(Math.random() * gridSize.w);
        food.y = Math.floor(Math.random() * gridSize.h);
      } else {
        snake.body.pop();
      }
    }

    if (snakes.length > 1 && aliveSnakes <= 1) {
      this.status = 'FINISHED';
      this.gameState.winner = lastAlive ? lastAlive.id : null;
      if (this.gameTickTimer) {
        clearInterval(this.gameTickTimer);
        this.gameTickTimer = null;
      }
    } else if (snakes.length === 1 && aliveSnakes === 0) {
      this.status = 'FINISHED';
      if (this.gameTickTimer) {
        clearInterval(this.gameTickTimer);
        this.gameTickTimer = null;
      }
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
      // Check draw
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
      // Room empty, clean up
      this.updateLiveIndex(true);
      return;
    }

    if (player.isHost) {
      // Host migration
      const nextHost = Array.from(this.players.values())[0];
      if (nextHost) {
        nextHost.isHost = true;
      }
    }

    // If game was playing and active player left, handle forfeit or pause
    if (this.status === 'PLAYING' && !player.isSpectator) {
      if (this.settings?.gameId === 'snake-arena') {
        const snake = this.gameState?.snakes?.find((s: any) => s.id === playerId);
        if (snake) snake.isDead = true;
      } else {
        this.status = 'FINISHED';
        if (this.gameState) {
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
      isSpectator: p.isSpectator
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
        try {
          p.ws.send(msg);
        } catch (e) {
          // Stale socket
        }
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
        joinable: this.status === 'LOBBY' && activePlayers < (this.settings?.maxPlayers || 2),
        watchable: this.settings?.spectatorsAllowed,
        icon: this.settings?.gameId === 'tic-tac-toe' ? '❌' : '🔴'
      }
    };

    // Fire and forget
    liveIndex.fetch('http://internal/api/live/update', {
      method: 'POST',
      body: JSON.stringify(payload)
    }).catch(() => {});
  }
}
