import { Chess } from 'chess.js';

export class MatchEngine {
  static initialize(gameId: string, settings: any, activePlayers: string[]) {
    if (gameId === 'tic-tac-toe') {
      return {
        board: Array(9).fill(null),
        turn: activePlayers[0],
        players: activePlayers,
        winner: null,
        winningLine: null,
        isDraw: false
      };
    } else if (gameId === 'connect-four') {
      return {
        board: Array(6).fill(null).map(() => Array(7).fill(null)),
        turn: activePlayers[0],
        players: activePlayers,
        winner: null,
        isDraw: false
      };
    } else if (gameId === 'snake-arena') {
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
      return {
        gridSize: { w: 40, h: 40 },
        players: activePlayers,
        snakes,
        food: { x: Math.floor(Math.random() * 40), y: Math.floor(Math.random() * 40) },
        winner: null,
      };
    } else if (gameId === 'chess') {
      const chess = new Chess();
      return {
        players: activePlayers,
        turn: activePlayers[0], // White
        fen: chess.fen(),
        history: [],
        winner: null,
        isDraw: false,
        whiteId: activePlayers[0],
        blackId: activePlayers[1] || null
      };
    } else if (gameId === 'word-guesser') {
      return {
        players: activePlayers,
        scores: Object.fromEntries(activePlayers.map(id => [id, 0])),
        turn: activePlayers[0],
        word: 'HRSH', // Hardcoded for initial version
        guesses: [],
        phase: 'picking',
        timeRemaining: 60,
        winner: null
      };
    } else if (gameId === 'typing-test') {
      const difficulty = settings?.gameSettings?.difficulty || 'normal';
      const duration = settings?.gameSettings?.duration || 60;
      
      const words = [
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with',
        'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
        'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up',
        'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
        'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
        'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
        'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
        'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'find', 'here', 'thing',
        'many', 'help', 'where', 'world', 'right', 'still', 'through', 'life', 'game', 'play'
      ];
      
      // Calculate word count needed (approx 100 words per minute + buffer)
      const wordCount = Math.ceil((duration / 60) * 120);
      const selected = [];
      for (let i = 0; i < wordCount; i++) {
        let word = words[Math.floor(Math.random() * words.length)];
        if (difficulty === 'hard' && Math.random() < 0.2) {
          // Capitalize randomly
          if (Math.random() < 0.5) word = word.charAt(0).toUpperCase() + word.slice(1);
          // Add punctuation
          const punc = [',', '.', '!', '?'];
          if (Math.random() < 0.5) word += punc[Math.floor(Math.random() * punc.length)];
        }
        selected.push(word);
      }
      
      return {
        challenge: selected.join(' '),
        duration: duration,
        startTime: Date.now() + 3000 // 3 seconds buffer to allow countdowns to sync
      };
    }
    return {};
  }

  static processAction(gameId: string, action: any, playerId: string, gameState: any): { updated: boolean; matchEnded: boolean } {
    let updated = false;
    let matchEnded = false;

    // Turn check
    if (gameId !== 'snake-arena' && gameId !== 'typing-test') {
       if (gameState.turn !== playerId) return { updated: false, matchEnded: false };
    }

    if (gameId === 'tic-tac-toe') {
      if (action.type === 'PLACE' && typeof action.index === 'number') {
        const { index } = action;
        if (index >= 0 && index < 9 && gameState.board[index] === null) {
          const playerSymbol = gameState.players.indexOf(playerId) === 0 ? 'X' : 'O';
          gameState.board[index] = playerSymbol;
          
          this.checkTicTacToeWin(gameState);
          
          if (!gameState.winner && !gameState.isDraw) {
            gameState.turn = gameState.players.find((id: string) => id !== playerId);
          } else {
            matchEnded = true;
          }
          updated = true;
        }
      }
    } else if (gameId === 'connect-four') {
      if (action.type === 'DROP' && typeof action.col === 'number') {
        const { col } = action;
        if (col >= 0 && col < 7) {
          const playerColor = gameState.players.indexOf(playerId) === 0 ? 'RED' : 'YELLOW';
          let row = -1;
          for (let r = 5; r >= 0; r--) {
            if (gameState.board[r][col] === null) {
              row = r;
              break;
            }
          }
          if (row !== -1) {
            gameState.board[row][col] = playerColor;
            this.checkConnectFourWin(gameState, row, col, playerColor);
            
            if (!gameState.winner && !gameState.isDraw) {
              gameState.turn = gameState.players.find((id: string) => id !== playerId);
            } else {
              matchEnded = true;
            }
            updated = true;
          }
        }
      }
    } else if (gameId === 'chess') {
      if (action.type === 'MOVE') {
        const isWhiteTurn = gameState.turn === gameState.whiteId;
        if ((isWhiteTurn && playerId !== gameState.whiteId) || (!isWhiteTurn && playerId !== gameState.blackId)) {
          return { updated: false, matchEnded: false };
        }
        try {
          const chess = new Chess(gameState.fen);
          const move = chess.move(action.move);
          if (move) {
            gameState.fen = chess.fen();
            gameState.history.push(move.san);
            
            if (chess.isCheckmate()) {
              gameState.winner = playerId;
              matchEnded = true;
            } else if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
              gameState.isDraw = true;
              matchEnded = true;
            } else {
              gameState.turn = isWhiteTurn ? gameState.blackId : gameState.whiteId;
            }
            updated = true;
          }
        } catch (e) {
          // Invalid move
        }
      }
    } else if (gameId === 'snake-arena') {
      if (action.type === 'CHANGE_DIR') {
        const snake = gameState.snakes.find((s: any) => s.id === playerId);
        if (snake && !snake.isDead) {
          const { x, y } = action.dir;
          if (snake.dir.x !== -x || snake.dir.y !== -y) {
            snake.nextDir = { x, y };
            // We don't broadcast immediately on change dir to reduce spam
          }
        }
      }
    }

    return { updated, matchEnded };
  }

  static tick(gameId: string, gameState: any): { updated: boolean; matchEnded: boolean } {
    if (gameId === 'snake-arena') {
      return this.tickSnakeArena(gameState);
    }
    return { updated: false, matchEnded: false };
  }

  static handleDisconnect(gameId: string, gameState: any, playerId: string): { updated: boolean; matchEnded: boolean } {
    if (gameId === 'snake-arena') {
      const snake = gameState?.snakes?.find((s: any) => s.id === playerId);
      if (snake) snake.isDead = true;
      return { updated: true, matchEnded: false };
    } else if (gameId === 'typing-test') {
      return { updated: false, matchEnded: false };
    } else {
      if (gameState && gameState.players) {
        const remainingPlayer = gameState.players.find((id: string) => id !== playerId);
        gameState.winner = remainingPlayer;
        return { updated: true, matchEnded: true };
      }
    }
    return { updated: false, matchEnded: false };
  }

  // --- Private Helpers ---

  private static checkTicTacToeWin(gameState: any) {
    const b = gameState.board;
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const [x, y, z] of lines) {
      if (b[x] && b[x] === b[y] && b[x] === b[z]) {
        gameState.winner = gameState.players[b[x] === 'X' ? 0 : 1];
        gameState.winningLine = [x, y, z];
        return;
      }
    }
    if (!b.includes(null)) {
      gameState.isDraw = true;
    }
  }

  private static checkConnectFourWin(gameState: any, row: number, col: number, color: string) {
    const b = gameState.board;
    const check = (dr: number, dc: number) => {
      let count = 1;
      let r = row + dr, c = col + dc;
      while (r >= 0 && r < 6 && c >= 0 && c < 7 && b[r][c] === color) { count++; r += dr; c += dc; }
      r = row - dr; c = col - dc;
      while (r >= 0 && r < 6 && c >= 0 && c < 7 && b[r][c] === color) { count++; r -= dr; c -= dc; }
      return count >= 4;
    };

    if (check(0, 1) || check(1, 0) || check(1, 1) || check(1, -1)) {
      gameState.winner = gameState.players[color === 'RED' ? 0 : 1];
    } else {
      let isDraw = true;
      for (let c = 0; c < 7; c++) {
        if (b[0][c] === null) isDraw = false;
      }
      gameState.isDraw = isDraw;
    }
  }

  private static tickSnakeArena(gameState: any): { updated: boolean; matchEnded: boolean } {
    const { snakes, food, gridSize } = gameState;
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
      gameState.winner = lastAlive ? lastAlive.id : null;
      return { updated: true, matchEnded: true };
    } else if (snakes.length === 1 && aliveSnakes === 0) {
      return { updated: true, matchEnded: true };
    }

    return { updated: true, matchEnded: false };
  }
}
