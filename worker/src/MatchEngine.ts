import { Chess } from 'chess.js';

export class MatchEngine {
  static initialize(gameId: string, settings: any, activePlayers: any[]) {
    const playerIds = activePlayers.map(p => p.id);
    if (gameId === 'tic-tac-toe') {
      return {
        board: Array(9).fill(null),
        turn: playerIds[0],
        players: playerIds,
        winner: null,
        winningLine: null,
        isDraw: false
      };
    } else if (gameId === '2048') {
      const size = parseInt(settings?.gameSettings?.boardSize || '4');
      return {
        boards: Object.fromEntries(playerIds.map(id => [id, Array(size * size).fill(0)])),
        scores: Object.fromEntries(playerIds.map(id => [id, 0])),
        finished: Object.fromEntries(playerIds.map(id => [id, false])),
        size,
        players: playerIds,
        winner: null,
      };
    } else if (gameId === 'minesweeper') {
      return {
        boards: Object.fromEntries(activePlayers.map(id => [id, { cells: [], width: 10, height: 10, mines: 10 }])), // Simplified empty state, clients handle local clicks and send verified updates
        scores: Object.fromEntries(activePlayers.map(id => [id, 0])),
        finished: Object.fromEntries(activePlayers.map(id => [id, false])),
        players: activePlayers,
        winner: null,
      };
    } else if (gameId === 'reaction-test') {
      return {
        round: 1,
        maxRounds: settings?.gameSettings?.rounds || 5,
        targetTime: Date.now() + 2000 + Math.random() * 3000,
        scores: Object.fromEntries(activePlayers.map(id => [id, 0])),
        finished: Object.fromEntries(activePlayers.map(id => [id, false])),
        players: activePlayers,
        winner: null,
      };
    } else if (gameId === 'sudoku') {
      return {
        puzzle: '', // Will be generated or selected
        progress: Object.fromEntries(activePlayers.map(id => [id, 0])),
        finished: Object.fromEntries(activePlayers.map(id => [id, false])),
        players: activePlayers,
        winner: null,
      };
    } else if (gameId === 'connect-four') {
      return {
        board: Array(6).fill(null).map(() => Array(7).fill(null)),
        turn: playerIds[0],
        players: playerIds,
        winner: null,
        isDraw: false
      };
    } else if (gameId === 'snake-arena') {
      const fallbackColors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#f97316', '#14b8a6'];
      const snakes = activePlayers.map((p, i) => ({
        id: p.id,
        color: p.customization?.primaryColor || fallbackColors[i % fallbackColors.length],
        skin: p.customization?.skin || 'classic',
        trail: p.customization?.trail || 'none',
        body: [{ x: 10 + (i * 2), y: 10 + (i * 2) }],
        dir: { x: 1, y: 0 },
        nextDir: { x: 1, y: 0 },
        isDead: false,
        score: 0
      }));
      return {
        gridSize: { w: 40, h: 40 },
        players: playerIds,
        snakes,
        food: { x: Math.floor(Math.random() * 40), y: Math.floor(Math.random() * 40) },
        winner: null,
      };
    } else if (gameId === 'chess') {
      const chess = new Chess();
      let initialTime = 600; // 10 min
      let increment = 0;
      
      const tc = settings?.gameSettings?.timeControl || '10+0';
      const [minStr, incStr] = tc.split('+');
      if (minStr && incStr) {
        initialTime = parseInt(minStr) * 60;
        increment = parseInt(incStr);
      }

      return {
        players: playerIds,
        turn: playerIds[0], // White
        fen: chess.fen(),
        history: [],
        winner: null,
        isDraw: false,
        whiteId: playerIds[0],
        blackId: playerIds[1] || null,
        clocks: {
          w: initialTime,
          b: initialTime
        },
        increment,
        lastMoveTime: Date.now(),
        drawOffer: null,
        reason: null
      };
    } else if (gameId === 'word-guesser') {
      return {
        players: playerIds,
        scores: Object.fromEntries(playerIds.map(id => [id, 0])),
        turn: playerIds[0],
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
    } else if (gameId === 'imposter') {
        const words = ['APPLE', 'BANANA', 'ELEPHANT', 'GUITAR', 'PIRATE', 'GALAXY', 'OCEAN', 'MOUNTAIN', 'ROBOT', 'VAMPIRE'];
        const word = words[Math.floor(Math.random() * words.length)];
        const imposterId = playerIds[Math.floor(Math.random() * playerIds.length)];
        
        return {
            phase: 'clue',
            players: playerIds,
            word: word,
            imposterId: imposterId,
            clues: {}, // playerId -> clue
            votes: {}, // playerId -> targetPlayerId
            winner: null,
            imposterGuessedWord: false,
            imposterGuess: null,
            timeLimit: Date.now() + 60000,
        };
    }
    return {};
  }

  static getMaskedState(gameId: string, gameState: any, playerId: string): any {
      if (!gameState) return gameState;
      
      if (gameId === 'imposter') {
          // Mask secretWord and imposterId for non-imposters during active gameplay
          const masked = { ...gameState };
          if (gameState.phase !== 'reveal' && gameState.phase !== 'result' && !gameState.winner) {
              if (playerId !== gameState.imposterId) {
                  masked.imposterId = null;
              } else {
                  masked.word = null;
              }
          }
          return masked;
      }
      return gameState;
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

    } else if (gameId === '2048') {
      if (action.type === 'UPDATE_SCORE') {
        gameState.scores[playerId] = action.score;
        return { updated: true, matchEnded: false };
      } else if (action.type === 'GAME_OVER') {
        gameState.finished[playerId] = true;
        if (Object.values(gameState.finished).every(f => f)) {
          // Find winner
          let maxScore = -1;
          for (const id in gameState.scores) {
            if (gameState.scores[id] > maxScore) {
              maxScore = gameState.scores[id];
              gameState.winner = id;
            }
          }
          return { updated: true, matchEnded: true };
        }
        return { updated: true, matchEnded: false };
      }
    } else if (gameId === 'minesweeper') {
      if (action.type === 'WIN') {
        gameState.scores[playerId] = action.time; // lower is better
        gameState.finished[playerId] = true;
        gameState.winner = playerId; // first to win gets it
        return { updated: true, matchEnded: true };
      } else if (action.type === 'LOSE') {
        gameState.finished[playerId] = true;
        if (Object.values(gameState.finished).every(f => f)) {
          return { updated: true, matchEnded: true };
        }
        return { updated: true, matchEnded: false };
      }
    } else if (gameId === 'reaction-test') {
      if (action.type === 'REACT') {
        if (!gameState.finished[playerId]) {
          const reactTime = Date.now() - gameState.targetTime;
          // Basic anticheat: if too fast, penalty
          const finalTime = reactTime < 100 ? 5000 : reactTime;
          gameState.scores[playerId] += finalTime;
          gameState.finished[playerId] = true;
          
          if (Object.values(gameState.finished).every(f => f)) {
            if (gameState.round >= gameState.maxRounds) {
              // Find winner (lowest average)
              let minScore = Infinity;
              for (const id in gameState.scores) {
                if (gameState.scores[id] < minScore) {
                  minScore = gameState.scores[id];
                  gameState.winner = id;
                }
              }
              return { updated: true, matchEnded: true };
            } else {
              // Next round
              gameState.round++;
              gameState.targetTime = Date.now() + 2000 + Math.random() * 3000;
              for (const id in gameState.finished) gameState.finished[id] = false;
              return { updated: true, matchEnded: false };
            }
          }
        }
      }
    } else if (gameId === 'sudoku') {
      if (action.type === 'SOLVE') {
        gameState.winner = playerId;
        return { updated: true, matchEnded: true };
      } else if (action.type === 'UPDATE_PROGRESS') {
        gameState.progress[playerId] = action.progress;
        return { updated: true, matchEnded: false };
      }
    } else if (gameId === 'chess') {
      const isWhiteTurn = gameState.turn === gameState.whiteId;
      const isWhite = playerId === gameState.whiteId;
      const isBlack = playerId === gameState.blackId;
      
      if (!isWhite && !isBlack) return { updated: false, matchEnded: false }; // Spectator

      if (action.type === 'RESIGN') {
        gameState.winner = isWhite ? gameState.blackId : gameState.whiteId;
        gameState.reason = 'Resignation';
        return { updated: true, matchEnded: true };
      }

      if (action.type === 'OFFER_DRAW') {
        if (gameState.drawOffer === playerId) return { updated: false, matchEnded: false };
        if (gameState.drawOffer && gameState.drawOffer !== playerId) {
          // Accept draw
          gameState.isDraw = true;
          gameState.reason = 'Draw by Agreement';
          return { updated: true, matchEnded: true };
        } else {
          gameState.drawOffer = playerId;
          return { updated: true, matchEnded: false };
        }
      }

      if (action.type === 'DECLINE_DRAW') {
        if (gameState.drawOffer && gameState.drawOffer !== playerId) {
          gameState.drawOffer = null;
          return { updated: true, matchEnded: false };
        }
      }

      if (action.type === 'MOVE') {
        if ((isWhiteTurn && !isWhite) || (!isWhiteTurn && !isBlack)) {
          return { updated: false, matchEnded: false };
        }
        
        // Update clocks before moving
        const now = Date.now();
        const elapsed = Math.floor((now - gameState.lastMoveTime) / 1000);
        const colorKey = isWhiteTurn ? 'w' : 'b';
        gameState.clocks[colorKey] = Math.max(0, gameState.clocks[colorKey] - elapsed);

        if (gameState.clocks[colorKey] === 0) {
          gameState.winner = isWhiteTurn ? gameState.blackId : gameState.whiteId;
          gameState.reason = 'Timeout';
          return { updated: true, matchEnded: true };
        }

        try {
          const chess = new Chess(gameState.fen);
          const move = chess.move(action.move);
          if (move) {
            // Apply increment
            gameState.clocks[colorKey] += gameState.increment;
            
            gameState.fen = chess.fen();
            gameState.history.push(move.san);
            gameState.lastMoveTime = now;
            gameState.drawOffer = null; // moving cancels draw offers
            
            if (chess.isCheckmate()) {
              gameState.winner = playerId;
              gameState.reason = 'Checkmate';
              matchEnded = true;
            } else if (chess.isStalemate()) {
              gameState.isDraw = true;
              gameState.reason = 'Stalemate';
              matchEnded = true;
            } else if (chess.isThreefoldRepetition()) {
              gameState.isDraw = true;
              gameState.reason = 'Threefold Repetition';
              matchEnded = true;
            } else if (chess.isInsufficientMaterial()) {
              gameState.isDraw = true;
              gameState.reason = 'Insufficient Material';
              matchEnded = true;
            } else if (chess.isDraw()) {
              gameState.isDraw = true;
              gameState.reason = 'Fifty-move Rule';
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
    } else if (gameId === 'imposter') {
        if (gameState.phase === 'clue' && action.type === 'SUBMIT_CLUE') {
            if (!gameState.clues[playerId]) {
                gameState.clues[playerId] = action.clue;
                updated = true;
                if (Object.keys(gameState.clues).length === gameState.players.length) {
                    gameState.phase = 'discussion';
                    gameState.timeLimit = Date.now() + 60000;
                }
            }
        } else if (gameState.phase === 'discussion' && action.type === 'START_VOTING') {
            gameState.phase = 'voting';
            gameState.timeLimit = Date.now() + 30000;
            updated = true;
        } else if (gameState.phase === 'voting' && action.type === 'SUBMIT_VOTE') {
            gameState.votes[playerId] = action.targetId;
            updated = true;
            if (Object.keys(gameState.votes).length === gameState.players.length) {
                gameState.phase = 'reveal';
            }
        } else if (gameState.phase === 'reveal' && action.type === 'IMPOSTER_GUESS') {
            if (playerId === gameState.imposterId) {
                gameState.imposterGuess = action.guess;
                if (action.guess.toUpperCase() === gameState.word.toUpperCase()) {
                    gameState.imposterGuessedWord = true;
                    gameState.winner = gameState.imposterId; // Imposter wins
                } else {
                    // Imposter loses, civilians win (represented by "CIVILIANS" or null winner depending on client logic)
                    gameState.winner = "CIVILIANS";
                }
                matchEnded = true;
                updated = true;
            }
        } else if (gameState.phase === 'reveal' && action.type === 'CONTINUE_REVEAL') {
             // Tally votes
             const counts: Record<string, number> = {};
             for (const v of Object.values(gameState.votes)) {
                 const target = v as string;
                 counts[target] = (counts[target] || 0) + 1;
             }
             let maxVotes = 0;
             let votedOut = null;
             for (const [p, c] of Object.entries(counts)) {
                 if (c > maxVotes) { maxVotes = c; votedOut = p; }
                 else if (c === maxVotes) { votedOut = null; } // Tie
             }
             
             if (votedOut === gameState.imposterId) {
                 // Caught! Imposter has to guess word.
             } else {
                 // Imposter wins
                 gameState.winner = gameState.imposterId;
                 matchEnded = true;
                 updated = true;
             }
        }
    }

    return { updated, matchEnded };
  }

  static tick(gameId: string, gameState: any): { updated: boolean; matchEnded: boolean } {
    if (gameId === 'snake-arena') {
      return this.tickSnakeArena(gameState);
    } else if (gameId === 'chess') {
      const now = Date.now();
      const isWhiteTurn = gameState.turn === gameState.whiteId;
      const colorKey = isWhiteTurn ? 'w' : 'b';
      const elapsed = Math.floor((now - gameState.lastMoveTime) / 1000);
      
      // Calculate display clock
      const timeRemaining = Math.max(0, gameState.clocks[colorKey] - elapsed);
      
      if (timeRemaining === 0) {
        // Apply timeout
        gameState.clocks[colorKey] = 0;
        gameState.winner = isWhiteTurn ? gameState.blackId : gameState.whiteId;
        gameState.reason = 'Timeout';
        return { updated: true, matchEnded: true };
      }
      return { updated: false, matchEnded: false }; // No state updates to broadcast continuously, we assume clients predict time
    }
    return { updated: false, matchEnded: false };
  }

  static handleDisconnect(gameId: string, gameState: any, playerId: string): { updated: boolean; matchEnded: boolean } {
    if (gameId === 'snake-arena') {
      const snake = gameState?.snakes?.find((s: any) => s.id === playerId);
      if (snake) snake.isDead = true;
      return { updated: true, matchEnded: false };
    } else if (gameId === 'chess') {
      const isWhite = playerId === gameState.whiteId;
      const isBlack = playerId === gameState.blackId;
      if (isWhite || isBlack) {
        gameState.winner = isWhite ? gameState.blackId : gameState.whiteId;
        gameState.reason = 'Abandonment';
        return { updated: true, matchEnded: true };
      }
      return { updated: false, matchEnded: false };
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
