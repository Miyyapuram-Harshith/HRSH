import { useState, useEffect } from 'react';
import type { LeagueProgress, PlayerStreak, RecentGame } from '../../types/player';
import { db } from '../../lib/db/database';

interface PlayerCardProps {
  playerId: string;
  playerName: string;
  children: React.ReactNode;
}

export function PlayerCard({ playerId, playerName, children }: PlayerCardProps) {
  const [show, setShow] = useState(false);
  const [league, setLeague] = useState<LeagueProgress | null>(null);
  const [streak, setStreak] = useState<PlayerStreak | null>(null);
  const [recent, setRecent] = useState<RecentGame[]>([]);

  useEffect(() => {
    if (show) {
      db.leagueProgress.where({ playerId }).first().then(l => setLeague(l || null));
      db.streaks.where({ playerId }).first().then(s => setStreak(s || null));
      db.recentGames.where({ playerId }).reverse().sortBy('lastPlayedAt').then(r => setRecent(r.slice(0, 3)));
    }
  }, [show, playerId]);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-surface-raised border border-border-default rounded-xl p-4 shadow-floating animate-slide-up pointer-events-none">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-hrsh-accent to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-inner">
              {playerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-sm text-text-primary">{playerName}</div>
              <div className="text-xs font-semibold" style={{ color: getLeagueColor(league?.tier) }}>
                {league?.tier || 'Unranked'}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-xs text-text-muted mb-2">
            <span>Current Streak:</span>
            <span className="font-mono font-bold text-status-warning flex items-center gap-1">
              🔥 {streak?.currentStreak || 0}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-text-muted mb-1 tracking-wider">Top Games</div>
            {recent.length > 0 ? recent.map(r => (
              <div key={r.id} className="flex justify-between text-xs bg-surface-overlay px-2 py-1 rounded">
                <span className="capitalize">{r.gameId}</span>
                <span className="font-mono text-text-secondary">{r.playCount} plays</span>
              </div>
            )) : (
              <div className="text-xs text-text-secondary italic">No games played yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getLeagueColor(tier?: string) {
  switch (tier) {
    case 'Bronze': return '#cd7f32';
    case 'Silver': return '#c0c0c0';
    case 'Gold': return '#ffd700';
    case 'Platinum': return '#e5e4e2';
    case 'Diamond': return '#b9f2ff';
    case 'HRSH Elite': return '#a855f7'; // purple
    default: return '#71717a'; // muted
  }
}
