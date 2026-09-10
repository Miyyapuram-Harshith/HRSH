import { useRoomStore } from '../../stores/roomStore';
import { usePlayerStore } from '../../stores/playerStore';
import { RoomEngine } from '../../multiplayer/RoomEngine';
import { Confetti } from '../shared/LoadingStates';
import { useMemo } from 'react';
import { HRSHCommentaryEngine } from '../../engine/HRSHCommentaryEngine';

export function MultiplayerResultScreen({ game }: { game: any }) {
  const room = useRoomStore();
  const { player } = usePlayerStore();
  
  const safePlayers = Array.isArray(room?.players) ? room.players : [];
  const me = safePlayers.find(p => p?.id === player?.id);
  const isHost = me?.isHost || false;
  
  const sortedPlayers = useMemo(() => {
    if (room?.gameState?.winner) {
      return [...safePlayers].filter(p => !p?.isSpectator).sort((a, b) => {
        if (game?.id === 'imposter' && room.gameState.winner === 'CIVILIANS') {
           const aIsCiv = a?.id !== room.gameState.imposterId;
           const bIsCiv = b?.id !== room.gameState.imposterId;
           if (aIsCiv && !bIsCiv) return -1;
           if (!aIsCiv && bIsCiv) return 1;
           return 0;
        }
        if (a?.id === room.gameState.winner) return -1;
        if (b?.id === room.gameState.winner) return 1;
        return 0;
      });
    }
    
    return [...safePlayers]
      .filter(p => !p?.isSpectator)
      .sort((a, b) => {
        if (a?.rank && b?.rank) return a.rank - b.rank;
        return (b?.progress || 0) - (a?.progress || 0);
      });
  }, [safePlayers, room?.gameState?.winner, game?.id, room?.gameState?.imposterId]);

  const myRank = sortedPlayers.findIndex(p => p?.id === player?.id) + 1;
  let didIWin = myRank === 1 && !room?.gameState?.isDraw && sortedPlayers.length > 0;
  if (game?.id === 'imposter' && room?.gameState?.winner === 'CIVILIANS') {
      didIWin = player?.id !== room?.gameState?.imposterId;
  }
  const isDraw = room?.gameState?.isDraw;

  const commentary = useMemo(() => {
      if (!player?.id || !game?.id) return '';
      try {
        const raw = HRSHCommentaryEngine.generateCommentary({
            gameId: game.id,
            result: { won: didIWin } as any,
            moments: [],
            rank: myRank > 0 ? myRank : undefined,
            totalPlayers: Math.max(1, sortedPlayers.length),
            humorLevel: 'ROAST'
        });
        return Array.isArray(raw) ? raw[0] : (typeof raw === 'string' ? raw : '');
      } catch (e) {
        return '';
      }
  }, [game?.id, didIWin, myRank, sortedPlayers.length, player?.id]);

  return (
    <>
      <Confetti active={didIWin} />
      <div className="absolute inset-0 z-40 bg-surface-base/80 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-[fade-in_0.3s_ease-out]">
        <div className="w-full max-w-md bg-surface-raised border border-border-default rounded-2xl p-6 shadow-2xl animate-[scale-in_0.4s_ease-out]">
          
          <div className="text-center mb-8">
            <div className="text-5xl mb-3 animate-[bounce-in_0.5s_ease-out]">
              {isDraw ? '🤝' : (didIWin ? '🏆' : '👏')}
            </div>
            <h2 className="text-3xl font-bold text-text-primary tracking-tight">
              {isDraw ? 'It\'s a Draw!' : (didIWin ? 'Victory!' : 'Match Finished')}
            </h2>
            {!isDraw && sortedPlayers[0] && !didIWin && (
              <p className="text-text-muted mt-1">{sortedPlayers[0].name} won the match</p>
            )}
            
            {commentary && (
              <div className="mt-4 p-3 bg-surface-base rounded-xl border border-border-default text-text-secondary italic text-sm">
                 "{commentary}"
              </div>
            )}
          </div>

          <div className="space-y-3 mb-8">
            {sortedPlayers.map((p, idx) => {
              const isMe = p?.id === player?.id;
              let medal = '';
              if (idx === 0) medal = '🥇';
              else if (idx === 1) medal = '🥈';
              else if (idx === 2) medal = '🥉';

              const metricValue = Number.isFinite(p?.liveMetricValue) ? p.liveMetricValue : null;
              const progressPct = Number.isFinite(p?.progress) ? Math.round((p.progress || 0) * 100) : null;

              return (
                <div 
                  key={p?.id || idx} 
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    isMe 
                      ? 'bg-hrsh-accent/10 border-hrsh-accent text-text-primary' 
                      : 'bg-surface-base border-border-default text-text-secondary'
                  }`}
                  style={{ animation: `slide-up 0.4s ease-out ${idx * 0.1}s both` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl w-6 text-center">{medal || `#${idx + 1}`}</span>
                    <span className="font-semibold text-lg">{p?.name || 'Unknown'} {isMe && '(You)'}</span>
                  </div>
                  <div className="font-mono font-bold text-lg" style={{ color: game?.color }}>
                    {metricValue != null ? metricValue.toLocaleString() : (progressPct != null ? `${progressPct}%` : '')}
                  </div>
                </div>
              );
            })}
          </div>

          {isHost ? (
            <div className="flex gap-3">
              <button 
                onClick={() => RoomEngine.rematch()} 
                className="flex-1 py-4 bg-hrsh-accent text-white font-bold rounded-xl shadow-lg hover:bg-hrsh-accent-hover transition-colors active:scale-[0.98]"
              >
                Play Again
              </button>
              <button 
                onClick={() => {
                  RoomEngine.updateSettings({}); // Or whatever returns to lobby without resetting
                  // For now rematch returns to lobby implicitly in DO
                }} 
                className="flex-1 py-4 bg-surface-base border border-border-default hover:bg-surface-raised font-bold rounded-xl transition-colors active:scale-[0.98]"
              >
                Lobby Settings
              </button>
            </div>
          ) : (
            <div className="text-center p-4 bg-surface-base rounded-xl border border-border-default animate-pulse">
              <p className="text-sm font-semibold text-text-muted">Waiting for host to choose next action...</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
