import { useState } from 'react';
import type { GameComponentProps } from '../../types/game';

export default function ConnectFourGame({ multiplayerState, multiplayerRole, onMultiplayerAction }: GameComponentProps) {
  const [hoverCol, setHoverCol] = useState<number | null>(null);

  if (!multiplayerState) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted">Waiting for game state...</div>
      </div>
    );
  }

  const { board, turn, players, winner, isDraw } = multiplayerState;
  
  const myPlayerId = multiplayerRole === 'player1' ? players[0] : (multiplayerRole === 'player2' ? players[1] : null);
  const isMyTurn = myPlayerId && turn === myPlayerId;
  const myColor = multiplayerRole === 'player1' ? 'RED' : (multiplayerRole === 'player2' ? 'YELLOW' : null);

  const handleColumnClick = (col: number) => {
    if (!isMyTurn || winner || isDraw || board[0][col] !== null) return;
    onMultiplayerAction?.({ type: 'DROP', col });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-lg mx-auto p-4 pb-20">
      
      {/* Game Header/Status */}
      <div className="mb-6 text-center h-16">
        {winner ? (
          <div className="text-2xl font-bold animate-pulse" style={{ color: winner === myPlayerId ? (myColor === 'RED' ? '#ef4444' : '#eab308') : '#888' }}>
            {winner === myPlayerId ? 'You Win!' : 'You Lose!'}
          </div>
        ) : isDraw ? (
          <div className="text-2xl font-bold text-text-secondary">Draw!</div>
        ) : (
          <div className="text-xl font-medium flex items-center justify-center gap-3">
            <div className={`w-4 h-4 rounded-full ${turn === players[0] ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'}`} />
            {isMyTurn ? (
              <span className="text-white">Your Turn</span>
            ) : myPlayerId ? (
              <span className="text-text-muted">Opponent's Turn</span>
            ) : (
              <span className="text-text-muted">Spectating</span>
            )}
          </div>
        )}
      </div>

      {/* Board */}
      <div className="bg-blue-700/80 p-2 sm:p-4 rounded-xl shadow-2xl relative select-none">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {board.map((row: (string | null)[], r: number) => (
            row.map((cell: string | null, c: number) => (
              <div 
                key={`${r}-${c}`}
                className="w-10 h-10 sm:w-14 sm:h-14 bg-surface-base rounded-full overflow-hidden relative shadow-inner cursor-pointer transition-transform"
                onClick={() => handleColumnClick(c)}
                onMouseEnter={() => setHoverCol(c)}
                onMouseLeave={() => setHoverCol(null)}
              >
                {/* Hover indicator (ghost piece) */}
                {isMyTurn && !winner && hoverCol === c && r === 0 && board[0][c] === null && (
                  <div className={`absolute -top-10 left-0 w-full h-full rounded-full opacity-30 ${myColor === 'RED' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                )}
                
                {/* Placed piece */}
                {cell && (
                  <div 
                    className={`absolute inset-0 rounded-full shadow-[inset_0_-4px_8px_rgba(0,0,0,0.3)]
                      ${cell === 'RED' ? 'bg-red-500' : 'bg-yellow-500'}
                    `}
                  />
                )}
              </div>
            ))
          ))}
        </div>
      </div>

    </div>
  );
}
