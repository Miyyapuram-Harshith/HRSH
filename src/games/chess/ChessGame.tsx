import { useEffect, useState, useCallback } from 'react';
import type { GameComponentProps, GameResult } from '../../types/game';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useRoomStore } from '../../stores/roomStore';
import { usePlayerStore } from '../../stores/playerStore';

export default function ChessGame({ onGameEnd, multiplayerState, onMultiplayerAction }: GameComponentProps) {
  const [chess] = useState(new Chess());
  const [fen, setFen] = useState(chess.fen());
  const myPlayerId = usePlayerStore(state => state.player?.id);
  const players = useRoomStore(state => state.players);

  // Synchronize state with multiplayer server
  useEffect(() => {
    if (multiplayerState && multiplayerState.fen) {
      if (multiplayerState.fen !== chess.fen()) {
        try {
          chess.load(multiplayerState.fen);
          setFen(chess.fen());
        } catch (e) {
          console.error("Invalid FEN from server", e);
        }
      }
      
      // Auto-end game locally if server declared winner
      if (multiplayerState.winner || multiplayerState.isDraw) {
        const result: GameResult = {
          gameId: 'chess',
          mode: 'casual',
          score: multiplayerState.winner === myPlayerId ? 1 : 0,
          won: multiplayerState.winner === myPlayerId,
          duration: 0,
          moves: chess.history().length,
          personalBest: false,
          data: {},
          timestamp: Date.now()
        };
        onGameEnd(result);
      }
    }
  }, [multiplayerState, chess, onGameEnd, myPlayerId]);

  const onDrop = useCallback((sourceSquare: string, targetSquare: string) => {
    if (!multiplayerState) return false;
    
    // Check if it's our turn
    const isWhiteTurn = chess.turn() === 'w';
    const amIWhite = multiplayerState.whiteId === myPlayerId;
    const amIBlack = multiplayerState.blackId === myPlayerId;
    
    if (isWhiteTurn && !amIWhite) return false;
    if (!isWhiteTurn && !amIBlack) return false;
    if (multiplayerState.winner || multiplayerState.isDraw) return false;

    try {
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // Always promote to queen for simplicity in UI
      });
      
      if (move === null) return false;
      
      setFen(chess.fen());
      if (onMultiplayerAction) {
        onMultiplayerAction({ type: 'MOVE', move: move.san });
      }
      return true;
    } catch (e) {
      return false;
    }
  }, [chess, multiplayerState, myPlayerId, onMultiplayerAction]);

  const amIBlack = multiplayerState?.blackId === myPlayerId;
  
  // Decide board orientation
  const boardOrientation = amIBlack ? 'black' : 'white';

  const whitePlayer = players.find(p => p.id === multiplayerState?.whiteId);
  const blackPlayer = players.find(p => p.id === multiplayerState?.blackId);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto py-8">
      {/* Player info (Top) */}
      <div className="w-full max-w-[600px] flex justify-between mb-4 bg-surface-raised p-4 rounded-xl shadow-lg border border-border-default">
        <div className="flex items-center gap-3">
           <div className={`w-4 h-4 rounded-full ${boardOrientation === 'black' ? 'bg-white' : 'bg-black'}`} />
           <span className="font-semibold text-lg">{boardOrientation === 'black' ? whitePlayer?.name || 'White' : blackPlayer?.name || 'Black'}</span>
        </div>
        <div className="text-text-muted font-mono">10:00</div>
      </div>

      <div className="w-full max-w-[600px] aspect-square rounded-xl overflow-hidden shadow-2xl border-4 border-surface-raised bg-surface-overlay">
        {/* @ts-ignore */}
        <Chessboard 
          {...{ position: fen } as any}
          onPieceDrop={onDrop}
          boardOrientation={boardOrientation as any}
          customDarkSquareStyle={{ backgroundColor: '#475569' }}
          customLightSquareStyle={{ backgroundColor: '#e2e8f0' }}
        />
      </div>
      
      {/* Player info (Bottom) */}
      <div className="w-full max-w-[600px] flex justify-between mt-4 bg-surface-raised p-4 rounded-xl shadow-lg border border-border-default">
        <div className="flex items-center gap-3">
           <div className={`w-4 h-4 rounded-full ${boardOrientation === 'black' ? 'bg-black' : 'bg-white'}`} />
           <span className="font-semibold text-lg">{boardOrientation === 'black' ? blackPlayer?.name || 'Black' : whitePlayer?.name || 'White'} {myPlayerId === (boardOrientation === 'black' ? multiplayerState?.blackId : multiplayerState?.whiteId) && '(You)'}</span>
        </div>
        <div className="text-text-muted font-mono">10:00</div>
      </div>
    </div>
  );
}
