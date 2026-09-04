import type { GameComponentProps } from '../../types/game';

export default function TicTacToeGame({ multiplayerState, multiplayerRole, onMultiplayerAction }: GameComponentProps) {
  // If it's single player or not connected yet, we can render a loading or offline state
  // But for now, Tic-Tac-Toe is multiplayer only in this implementation
  if (!multiplayerState) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted">Waiting for game state...</div>
      </div>
    );
  }

  const { board, turn, players, winner, winningLine, isDraw } = multiplayerState;
  
  // Figure out if it's my turn
  // multiplayerRole gives us 'player1', 'player2' or 'spectator'
  const myPlayerId = multiplayerRole === 'player1' ? players[0] : (multiplayerRole === 'player2' ? players[1] : null);
  const isMyTurn = myPlayerId && turn === myPlayerId;
  const mySymbol = multiplayerRole === 'player1' ? 'X' : (multiplayerRole === 'player2' ? 'O' : null);

  const handleCellClick = (index: number) => {
    if (!isMyTurn || winner || isDraw || board[index] !== null) return;
    onMultiplayerAction?.({ type: 'PLACE', index });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full pb-20">
      
      {/* Game Header/Status */}
      <div className="mb-8 text-center h-16">
        {winner ? (
          <div className="text-2xl font-bold text-hrsh-accent animate-pulse">
            {winner === myPlayerId ? 'You Win!' : 'You Lose!'}
          </div>
        ) : isDraw ? (
          <div className="text-2xl font-bold text-text-secondary">Draw!</div>
        ) : (
          <div className="text-xl font-medium">
            {isMyTurn ? (
              <span className="text-hrsh-accent">Your Turn</span>
            ) : myPlayerId ? (
              <span className="text-text-muted">Opponent's Turn</span>
            ) : (
              <span className="text-text-muted">Spectating</span>
            )}
          </div>
        )}
        {mySymbol && !winner && !isDraw && (
          <div className="text-sm text-text-muted mt-1">You are {mySymbol}</div>
        )}
      </div>

      {/* Board */}
      <div className="grid grid-cols-3 gap-2 bg-surface-base p-2 rounded-2xl w-full max-w-[300px] aspect-square shadow-inner">
        {board.map((cell: string | null, i: number) => {
          const isWinningCell = winningLine?.includes(i);
          return (
            <button
              key={i}
              onClick={() => handleCellClick(i)}
              disabled={!isMyTurn || winner || isDraw || cell !== null}
              className={`
                flex items-center justify-center text-6xl font-bold rounded-xl transition-all
                ${cell === null && isMyTurn && !winner ? 'hover:bg-surface-raised cursor-pointer' : 'cursor-default'}
                ${cell === null ? 'bg-surface-overlay' : 'bg-surface-raised shadow-md'}
                ${isWinningCell ? 'ring-2 ring-hrsh-accent ring-inset bg-hrsh-accent/10' : ''}
                ${cell === 'X' ? 'text-hrsh-accent' : 'text-status-warning'}
              `}
            >
              {cell}
            </button>
          );
        })}
      </div>

    </div>
  );
}
