import { useEffect, useState, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useRoomStore } from '../../stores/roomStore';

export default function ChessGame({
  multiplayerState,
  multiplayerRole,
  onMultiplayerAction,
}: any) {
  const [chess] = useState(new Chess());
  const [fen, setFen] = useState(multiplayerState?.fen || 'start');
  const [displayClocks, setDisplayClocks] = useState({ w: 0, b: 0 });
  const clockInterval = useRef<any>(null);
  const room = useRoomStore();

  const isWhite = multiplayerRole === 'player1';
  const isBlack = multiplayerRole === 'player2';
  const isSpectator = multiplayerRole === 'spectator';
  const myColor = isWhite ? 'white' : (isBlack ? 'black' : 'white');

  // Sync state
  useEffect(() => {
    if (multiplayerState) {
      if (multiplayerState.fen !== fen) {
        chess.load(multiplayerState.fen);
        setFen(multiplayerState.fen);
      }
      setDisplayClocks(multiplayerState.clocks || { w: 0, b: 0 });
    }
  }, [multiplayerState, fen, chess]);

  // Local clock ticking for smooth display
  useEffect(() => {
    if (!multiplayerState || multiplayerState.winner || multiplayerState.isDraw) {
      if (clockInterval.current) clearInterval(clockInterval.current);
      return;
    }

    if (clockInterval.current) clearInterval(clockInterval.current);
    clockInterval.current = setInterval(() => {
      const isWhiteTurn = multiplayerState.turn === multiplayerState.whiteId;
      const key = isWhiteTurn ? 'w' : 'b';
      
      setDisplayClocks(prev => {
        const next = { ...prev };
        next[key] = Math.max(0, next[key] - 1);
        return next;
      });
    }, 1000);

    return () => {
      if (clockInterval.current) clearInterval(clockInterval.current);
    };
  }, [multiplayerState?.turn, multiplayerState?.lastMoveTime, multiplayerState?.winner, multiplayerState?.isDraw]);

  function makeAMove(move: any) {
    if (isSpectator) return false;
    const isWhiteTurn = multiplayerState?.turn === multiplayerState?.whiteId;
    if ((isWhite && !isWhiteTurn) || (isBlack && isWhiteTurn)) return false;

    const gameCopy = new Chess(fen);
    try {
      const result = gameCopy.move(move);
      if (result) {
        // Send move to server
        onMultiplayerAction({ type: 'MOVE', move: result.san });
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // Always promote to queen for simplicity in UI, could add a modal
    });
    return move;
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getPlayerName = (id: string) => {
    return room.players.find(p => p.id === id)?.name || 'Player';
  };

  const opponentId = isWhite ? multiplayerState?.blackId : multiplayerState?.whiteId;
  const myId = isWhite ? multiplayerState?.whiteId : multiplayerState?.blackId;
  
  const opponentTime = isWhite ? displayClocks.b : displayClocks.w;
  const myTime = isWhite ? displayClocks.w : displayClocks.b;
  
  const whitePlayerName = getPlayerName(multiplayerState?.whiteId);
  const blackPlayerName = getPlayerName(multiplayerState?.blackId);

  return (
    <div className="flex flex-col md:flex-row h-full gap-6 p-6">
      <div className="flex-1 max-w-[600px] flex flex-col justify-center mx-auto w-full">
        {/* Opponent Info */}
        <div className="flex justify-between items-center mb-4 bg-surface-base p-3 rounded-xl border border-border-default">
          <div className="font-bold flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-border-accent"></div>
            {isSpectator ? blackPlayerName : getPlayerName(opponentId)}
          </div>
          <div className="font-mono text-xl font-bold bg-surface-overlay px-4 py-1 rounded-lg border border-border-default">
            {formatTime(isSpectator ? displayClocks.b : opponentTime)}
          </div>
        </div>

        {/* Board */}
        <div className="rounded-xl overflow-hidden border-4 border-border-default shadow-2xl">
          <Chessboard
            {...({ position: fen } as any)}
            onPieceDrop={onDrop}
            boardOrientation={myColor}
            customDarkSquareStyle={{ backgroundColor: '#779556' }}
            customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
            animationDuration={200}
            arePiecesDraggable={!isSpectator && !multiplayerState?.winner && !multiplayerState?.isDraw}
          />
        </div>

        {/* My Info */}
        <div className="flex justify-between items-center mt-4 bg-surface-base p-3 rounded-xl border border-border-default">
          <div className="font-bold flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white border border-border-default"></div>
            {isSpectator ? whitePlayerName : getPlayerName(myId)}
            {isSpectator ? '' : ' (You)'}
          </div>
          <div className={`font-mono text-xl font-bold bg-surface-overlay px-4 py-1 rounded-lg border border-border-default ${((isWhite && multiplayerState?.turn === multiplayerState?.whiteId) || (isBlack && multiplayerState?.turn === multiplayerState?.blackId)) ? 'text-hrsh-accent border-hrsh-accent' : ''}`}>
            {formatTime(isSpectator ? displayClocks.w : myTime)}
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className="w-full md:w-64 flex flex-col gap-4">
        {/* Match Status */}
        <div className="bg-surface-base border border-border-default rounded-xl p-4 flex flex-col items-center justify-center text-center">
          {multiplayerState?.winner ? (
            <>
              <div className="text-3xl mb-2">🏆</div>
              <div className="font-bold text-hrsh-accent">{getPlayerName(multiplayerState.winner)} Wins</div>
              <div className="text-xs text-text-muted mt-1">{multiplayerState.reason}</div>
            </>
          ) : multiplayerState?.isDraw ? (
            <>
              <div className="text-3xl mb-2">🤝</div>
              <div className="font-bold">Draw</div>
              <div className="text-xs text-text-muted mt-1">{multiplayerState.reason}</div>
            </>
          ) : (
            <>
              <div className="font-bold mb-1">
                {multiplayerState?.turn === multiplayerState?.whiteId ? 'White to move' : 'Black to move'}
              </div>
              <div className="text-xs text-text-muted">
                {multiplayerState?.increment ? `+${multiplayerState.increment}s increment` : 'No increment'}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {!isSpectator && !multiplayerState?.winner && !multiplayerState?.isDraw && (
          <div className="flex flex-col gap-2">
            {multiplayerState?.drawOffer === opponentId ? (
               <div className="bg-surface-raised p-3 rounded-xl border border-hrsh-accent flex flex-col gap-2 text-center">
                 <div className="text-sm font-bold text-hrsh-accent">Opponent offered a draw</div>
                 <div className="flex gap-2">
                   <button onClick={() => onMultiplayerAction({ type: 'OFFER_DRAW' })} className="flex-1 bg-hrsh-accent text-white py-1 rounded text-sm font-bold">Accept</button>
                   <button onClick={() => onMultiplayerAction({ type: 'DECLINE_DRAW' })} className="flex-1 bg-surface-base border border-border-default py-1 rounded text-sm font-bold">Decline</button>
                 </div>
               </div>
            ) : (
              <button 
                onClick={() => onMultiplayerAction({ type: 'OFFER_DRAW' })}
                disabled={multiplayerState?.drawOffer === myId}
                className="w-full py-2 bg-surface-raised border border-border-default hover:border-border-accent rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
              >
                {multiplayerState?.drawOffer === myId ? 'Draw Offered' : 'Offer Draw'}
              </button>
            )}
            
            <button 
              onClick={() => onMultiplayerAction({ type: 'RESIGN' })}
              className="w-full py-2 bg-transparent border border-status-danger/30 text-status-danger hover:bg-status-danger hover:text-white rounded-lg font-bold text-sm transition-colors"
            >
              Resign
            </button>
          </div>
        )}

        {/* Move History */}
        <div className="flex-1 bg-surface-raised border border-border-default rounded-xl p-4 flex flex-col min-h-[200px]">
          <h3 className="font-bold text-sm mb-3 uppercase tracking-wider text-text-muted">Move History</h3>
          <div className="flex-1 overflow-y-auto space-y-1 font-mono text-sm pr-2">
            {multiplayerState?.history?.reduce((result: any[], _: string, index: number, array: string[]) => {
              if (index % 2 === 0) result.push(array.slice(index, index + 2));
              return result;
            }, []).map((pair: string[], i: number) => (
              <div key={i} className={`flex rounded px-2 py-1 ${i % 2 === 0 ? 'bg-surface-base' : ''}`}>
                <div className="w-8 text-text-muted text-right pr-2">{i + 1}.</div>
                <div className="flex-1 pl-2 font-bold">{pair[0]}</div>
                <div className="flex-1 font-bold">{pair[1] || ''}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
