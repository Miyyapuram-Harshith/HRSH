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
        <div className="bg-surface-raised border border-border-default rounded-2xl overflow-hidden">
          <div className="divide-y divide-border-default">
            {entries.map((entry) => {
              const isMe = entry.playerId === player?.id;
              return (
                <div
                  key={`${entry.playerId}-${entry.rank}`}
                  className={`flex items-center justify-between px-4 py-3 transition-colors ${
                    isMe ? 'bg-hrsh-accent/5' : 'hover:bg-surface-overlay'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 text-center font-bold ${entry.rank <= 3 ? 'text-lg' : 'text-sm text-text-muted'}`}>
                      {medalEmoji(entry.rank)}
                    </div>
                    <div>
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        {entry.playerName}
                        {isMe && <span className="text-[10px] text-hrsh-accent font-semibold">(YOU)</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="font-mono text-sm font-bold tabular-nums"
                      style={{ color: selectedGame?.color }}
                    >
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
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
