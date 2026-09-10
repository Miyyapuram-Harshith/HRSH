import { useMemo, memo } from 'react';
import { useRoomStore } from '../../stores/roomStore';
import type { PlayerInfo } from '../../stores/roomStore';

interface TypingLeaderboardProps {
  players: PlayerInfo[];
  myPlayerId?: string;
  maxDisplay?: number;
}

export const TypingLeaderboard = memo(function TypingLeaderboard({ players, myPlayerId, maxDisplay = 10 }: TypingLeaderboardProps) {
  const room = useRoomStore();
  const { teamsEnabled, teams } = room;

  const sortedPlayers = useMemo(() => {
    const safePlayers = Array.isArray(players) ? players : [];
    return [...safePlayers]
      .filter(p => !p?.isSpectator)
      .sort((a, b) => {
        if (a?.rank && b?.rank) return a.rank - b.rank;
        return (b?.progress || 0) - (a?.progress || 0);
      });
  }, [players]);

  // Slicing logic for massive multiplayer efficiently
  const displayPlayers = useMemo(() => {
    if (sortedPlayers.length <= maxDisplay) return sortedPlayers;

    const myIndex = sortedPlayers.findIndex(p => p?.id === myPlayerId);
    
    // Always show top 3
    const top3 = sortedPlayers.slice(0, 3);
    
    // If I'm not in top 3, find my surroundings
    let mySurroundings: PlayerInfo[] = [];
    if (myIndex >= 3) {
      const start = Math.max(3, myIndex - 2); // Avoid overlapping with top3
      const end = Math.min(sortedPlayers.length, myIndex + 3); // Me + 2 below
      mySurroundings = sortedPlayers.slice(start, end);
    }
    
    // Merge without duplicates (using Set or direct array concat since we know indices don't overlap if done right)
    const combined = [...top3];
    if (mySurroundings.length > 0 && myIndex - 2 > 3) {
      combined.push({ id: 'ellipsis-1', name: '...', isSpectator: true } as any); // Fake item for gap
    }
    combined.push(...mySurroundings);
    
    const remaining = sortedPlayers.length - combined.filter(p => p?.id && !p.id.startsWith('ellipsis')).length;
    if (remaining > 0 && combined.length > 0 && sortedPlayers.length > 0 && combined[combined.length - 1].id !== sortedPlayers[sortedPlayers.length - 1].id) {
       combined.push({ id: 'ellipsis-2', name: `${remaining} more racers`, isSpectator: true } as any);
    }
    
    return combined;
  }, [sortedPlayers, myPlayerId, maxDisplay]);

  if (teamsEnabled && teams.length > 0) {
    // Team mode rendering
    const teamStats = teams.map(team => {
      const teamPlayers = sortedPlayers.filter(p => p.teamId === team.id);
      const totalProgress = teamPlayers.reduce((sum, p) => sum + (p.progress || 0), 0);
      const totalWPM = teamPlayers.reduce((sum, p) => sum + (p.liveMetricValue || 0), 0);
      const avgProgress = teamPlayers.length > 0 ? totalProgress / teamPlayers.length : 0;
      const avgWpm = teamPlayers.length > 0 ? Math.round(totalWPM / teamPlayers.length) : 0;
      const allFinished = teamPlayers.length > 0 && teamPlayers.every((p: any) => p.finished);
      
      return {
        ...team,
        players: teamPlayers,
        progress: avgProgress,
        wpm: avgWpm,
        finished: allFinished
      };
    }).sort((a, b) => b.progress - a.progress);

    return (
      <div className="bg-surface-raised border border-border-default rounded-xl p-4 w-full">
        <h3 className="font-semibold text-xs mb-4 uppercase tracking-wider text-text-muted flex justify-between">
          <span>Team Race</span>
          <span>{teams.length} Teams</span>
        </h3>
        <div className="flex flex-col gap-4">
          {teamStats.map((team, index) => {
            const isMyTeam = team.players.some((p: any) => p.id === myPlayerId);
            const progressPct = Math.min(100, Math.max(0, team.progress * 100));
            return (
              <div key={team.id} className={`flex flex-col gap-2 p-3 rounded-xl border ${isMyTeam ? 'bg-surface-overlay' : 'bg-surface-base'}`} style={{ borderColor: isMyTeam ? team.color : 'var(--color-border-default)' }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 font-mono font-bold text-xs text-text-muted">#{index + 1}</div>
                    <div className="font-bold text-sm truncate" style={{ color: team.color }}>{team.name} {isMyTeam && '(Your Team)'}</div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-text-muted">{team.finished ? 'FINISHED' : `${team.wpm} AVG WPM`}</span>
                    <span className="font-bold" style={{ color: team.color }}>{Math.round(progressPct)}%</span>
                  </div>
                </div>
                
                <div className="w-full bg-surface-overlay h-2.5 rounded-full overflow-hidden shadow-inner border border-border-default">
                  <div 
                    className="h-full transition-all duration-300 ease-out" 
                    style={{ width: `${progressPct}%`, backgroundColor: team.color }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-raised border border-border-default rounded-xl p-4 w-full">
      <h3 className="font-semibold text-xs mb-3 uppercase tracking-wider text-text-muted flex justify-between">
        <span>Live Race</span>
        <span>{sortedPlayers.length} Racers</span>
      </h3>
      <div className="flex flex-col gap-2 relative">
        {displayPlayers.map((p) => {
          if (p.id.startsWith('ellipsis')) {
            return (
              <div key={p.id} className="text-center text-xs text-text-muted py-1 font-mono">
                {p.name}
              </div>
            );
          }

          const isMe = p.id === myPlayerId;
          const progressPct = Math.min(100, Math.max(0, (p.progress || 0) * 100));
          const rank = p.rank || sortedPlayers.findIndex(sp => sp.id === p.id) + 1;

          return (
            <div 
              key={p.id} 
              className={`flex items-center gap-2 sm:gap-3 p-2 rounded-lg transition-colors ${
                isMe ? 'bg-hrsh-accent/10 border border-hrsh-accent/20' : 'bg-surface-base'
              }`}
            >
              <div className="font-mono text-xs sm:text-sm w-6 font-bold text-text-muted">#{rank}</div>
              <div className={`flex-1 font-medium text-xs sm:text-sm ${isMe ? 'text-hrsh-accent' : 'text-text-primary'} truncate max-w-[80px] sm:max-w-[120px]`}>
                {p.name} {isMe && '(You)'}
              </div>
              <div className="flex flex-col flex-1 items-end max-w-[120px] sm:max-w-xs">
                <div className="flex justify-between w-full text-[10px] sm:text-xs mb-1">
                  <span className="font-mono text-text-muted">{p.finished ? 'FINISHED' : `${p.liveMetricValue || 0} WPM`}</span>
                  <span className="font-mono font-semibold text-hrsh-accent">{Math.round(progressPct)}%</span>
                </div>
                <div className="w-full bg-surface-overlay h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ease-out ${p.finished ? 'bg-status-success' : 'bg-hrsh-accent'}`} 
                    style={{ width: `${progressPct}%` }} 
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
