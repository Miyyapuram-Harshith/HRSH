import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LeaderboardEngine, type LeaderboardEntry } from '../engine/LeaderboardEngine';
import { GameRegistry } from '../engine/GameRegistry';
import { usePlayerStore } from '../stores/playerStore';
import { EmptyState } from '../components/shared/LoadingStates';

export default function Leaderboard() {
  const { player } = usePlayerStore();
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const soloGames = useMemo(() => GameRegistry.getByCategory('solo'), []);

  useEffect(() => {
    document.title = 'Leaderboard — HRSH';
    if (soloGames.length > 0 && !selectedGameId) {
      setSelectedGameId(soloGames[0].id);
    }
  }, [soloGames, selectedGameId]);

  useEffect(() => {
    if (!selectedGameId) return;
    setLoading(true);
    const game = GameRegistry.get(selectedGameId);
    const mode = game?.modes[0]?.id || 'classic';

    Promise.all([
      LeaderboardEngine.getLeaderboard(selectedGameId, mode, 10),
      player ? LeaderboardEngine.getPlayerRank(player.id, selectedGameId, mode) : Promise.resolve(null),
    ]).then(([lb, rank]) => {
      setEntries(lb);
      setPlayerRank(rank);
      setLoading(false);
    });
  }, [selectedGameId, player]);

  const selectedGame = selectedGameId ? GameRegistry.get(selectedGameId) : null;

  const medalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-[fade-in_0.2s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-text-muted text-sm mt-1">Your personal best scores across all games</p>
      </div>

      {/* Game Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {soloGames.map((game) => (
          <button
            key={game.id}
            onClick={() => setSelectedGameId(game.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all active-press ${
              selectedGameId === game.id
                ? 'text-white shadow-lg'
                : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay border border-border-default'
            }`}
            style={selectedGameId === game.id ? { backgroundColor: game.color, boxShadow: `0 4px 12px ${game.color}30` } : {}}
          >
            <span>{game.icon}</span>
            {game.title}
          </button>
        ))}
      </div>

      {/* Your Rank Card */}
      {playerRank && selectedGame && (
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between animate-[slide-up_0.3s_ease-out]">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{medalEmoji(playerRank)}</div>
            <div>
              <div className="text-xs text-text-muted">Your Rank</div>
              <div className="text-lg font-bold">#{playerRank}</div>
            </div>
          </div>
          <Link
            to={`/games/${selectedGame.slug}`}
            className="px-4 py-2 bg-surface-overlay hover:bg-surface-hover rounded-xl text-xs font-medium transition-colors"
          >
            Play to Improve →
          </Link>
        </div>
      )}

      {/* Leaderboard Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      ) : entries.length > 0 ? (
        <div className="space-y-6">
          {/* #1 Player Hero Banner */}
          <div className="bg-gradient-to-br from-hrsh-accent/20 via-surface-raised to-surface-base border-2 border-hrsh-accent/50 rounded-2xl p-6 shadow-[0_0_30px_rgba(var(--hrsh-accent-rgb),0.15)] relative overflow-hidden animate-[slide-up_0.4s_ease-out]">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl">🥇</div>
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-4xl shadow-xl shadow-yellow-500/20 border-4 border-surface-base">
                  {entries[0].playerName[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-3xl font-black tracking-tight">{entries[0].playerName}</h2>
                    {Date.now() - entries[0].achievedAt < 86400000 && (
                      <span className="px-2 py-0.5 bg-status-danger/20 text-status-danger text-[10px] font-bold uppercase rounded border border-status-danger/30">🔥 On Fire</span>
                    )}
                  </div>
                  <p className="text-hrsh-accent font-medium italic">"Absolute menace. The leaderboard has a new landlord."</p>
                </div>
              </div>
              <div className="text-center md:text-right bg-surface-overlay/80 backdrop-blur-sm p-4 rounded-xl border border-border-default/50 min-w-[120px]">
                <div className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">High Score</div>
                <div className="text-3xl font-black text-hrsh-accent font-mono">{entries[0].score.toLocaleString()}</div>
                <div className="text-[10px] text-text-muted mt-1">{new Date(entries[0].achievedAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Remaining Players */}
          {entries.length > 1 && (
            <div className="bg-surface-raised border border-border-default rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-overlay border-b border-border-default text-xs uppercase tracking-wider text-text-muted">
                      <th className="px-6 py-4 font-semibold">Rank</th>
                      <th className="px-6 py-4 font-semibold">Player</th>
                      <th className="px-6 py-4 font-semibold text-right">Score</th>
                      <th className="px-6 py-4 font-semibold text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default text-sm">
                    {entries.slice(1).map((entry) => (
                      <tr 
                        key={entry.playerId} 
                        className={`hover:bg-surface-hover transition-colors ${entry.playerId === player?.id ? 'bg-hrsh-accent/5' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 font-bold text-text-muted">
                            {medalEmoji(entry.rank)}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">
                          <div className="flex items-center gap-2">
                            {entry.playerName}
                            {entry.playerId === player?.id && <span className="text-xs text-text-muted font-normal">(You)</span>}
                            {entry.rank === 2 && <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded border border-blue-500/20 uppercase font-bold">🥶 Struggling</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-right font-mono text-hrsh-accent">
                          {entry.score.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-text-muted text-right">
                          {new Date(entry.achievedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon="🏆"
          title="No scores yet"
          description={`Play ${selectedGame?.title || 'a game'} to set a high score!`}
          action={
            selectedGame && (
              <Link
                to={`/games/${selectedGame.slug}`}
                className="px-4 py-2 bg-hrsh-accent hover:bg-hrsh-accent-hover text-white rounded-xl text-sm font-medium transition-colors"
              >
                Play Now
              </Link>
            )
          }
        />
      )}
    </div>
  );
}
