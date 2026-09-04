import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GameRegistry } from '../engine/GameRegistry';
import { LiveActivityService } from '../engine/LiveActivityService';
import { QuickPlayEngine } from '../engine/QuickPlayEngine';
import { AnalyticsEngine } from '../engine/AnalyticsEngine';
import { ScoreEngine } from '../engine/ScoreEngine';
import { usePlayerStore } from '../stores/playerStore';
import { GameCard } from '../components/shared/GameCard';
import type { LiveRoom } from '../types/engine';
import type { GameMetadata } from '../types/game';
import type { RecentGame } from '../types/player';

export default function Home() {
  const navigate = useNavigate();
  const { player, streak } = usePlayerStore();
  const [liveRooms, setLiveRooms] = useState<LiveRoom[]>([]);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);

  useEffect(() => {
    AnalyticsEngine.track('HOME_VIEW');

    // Live activity polling
    const unsub = LiveActivityService.subscribe(setLiveRooms);
    LiveActivityService.startPolling(4000);

    return () => {
      unsub();
      LiveActivityService.stopPolling();
    };
  }, []);

  useEffect(() => {
    if (player) {
      ScoreEngine.getRecentGames(player.id, 5).then(setRecentGames);
    }
  }, [player]);

  const handleQuickPlay = useCallback(async () => {
    if (!player) return;
    AnalyticsEngine.track('QUICK_PLAY');
    const slug = await QuickPlayEngine.chooseGame(player.id);
    navigate(`/games/${slug}`);
  }, [player, navigate]);

  const soloGames = GameRegistry.getByCategory('solo');
  const duelGames = GameRegistry.getByCategory('duels');
  const chaosGames = GameRegistry.getByCategory('chaos');
  const showpieceGames = GameRegistry.getByCategory('showpiece');

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Hero */}
      <section className="text-center py-6 sm:py-10">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2">HRSH</h1>
        <p className="text-text-secondary text-sm sm:text-base mb-6">Play. Challenge. Repeat.</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleQuickPlay}
            className="w-full sm:w-auto px-8 py-3.5 bg-hrsh-accent hover:bg-hrsh-accent-hover text-white font-semibold rounded-xl text-sm transition-all active:scale-[0.98] shadow-lg shadow-hrsh-accent/20"
          >
            ⚡ Quick Play
          </button>
          <Link
            to="/multiplayer"
            className="w-full sm:w-auto px-8 py-3.5 bg-surface-raised hover:bg-surface-overlay border border-border-default text-text-primary font-semibold rounded-xl text-sm transition-all active:scale-[0.98] text-center"
          >
            🎮 Play Online
          </Link>
        </div>

        {/* Streak display */}
        {streak && streak.currentStreak > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-surface-raised border border-border-default rounded-full text-sm">
            <span>🔥</span>
            <span className="text-status-warning font-semibold">{streak.currentStreak} day streak</span>
          </div>
        )}
      </section>

      {/* Live Now */}
      {liveRooms.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-status-live animate-[pulse-soft_2s_ease-in-out_infinite]" />
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Live Now</h2>
            {LiveActivityService.isMock && (
              <span className="text-[10px] text-text-muted bg-surface-overlay px-1.5 py-0.5 rounded">(Preview)</span>
            )}
          </div>

          <div className="space-y-2">
            {liveRooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between bg-surface-raised border border-border-default rounded-xl px-4 py-3 hover:border-border-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{room.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{room.gameTitle}</div>
                    <div className="text-xs text-text-muted">{room.mode}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-muted font-mono tabular-nums">
                    {room.currentPlayers}/{room.maxPlayers}
                  </span>
                  {room.joinable ? (
                    <button className="px-3 py-1.5 bg-status-success/10 text-status-success rounded-lg text-xs font-semibold hover:bg-status-success/20 transition-colors">
                      JOIN
                    </button>
                  ) : room.watchable ? (
                    <button className="px-3 py-1.5 bg-surface-overlay text-text-secondary rounded-lg text-xs font-semibold hover:bg-surface-hover transition-colors">
                      WATCH
                    </button>
                  ) : (
                    <span className="text-xs text-text-muted">FULL</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Continue Playing */}
      {recentGames.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Continue Playing</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
            {recentGames.map((recent) => {
              const game = GameRegistry.get(recent.gameId);
              if (!game) return null;
              return (
                <Link
                  key={recent.gameId}
                  to={`/games/${game.slug}`}
                  className="flex-shrink-0 flex items-center gap-3 bg-surface-raised border border-border-default rounded-xl px-4 py-3 hover:border-border-accent transition-colors"
                >
                  <span className="text-2xl">{game.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{game.title}</div>
                    <div className="text-xs text-text-muted">{recent.playCount} plays</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Game Rails */}
      <GameRail title="Solo Games" games={soloGames} />
      <GameRail title="Duels" games={duelGames} />
      <GameRail title="Chaos" games={chaosGames} />
      <GameRail title="Showpiece" games={showpieceGames} />
    </div>
  );
}

function GameRail({ title, games }: { title: string; games: GameMetadata[] }) {
  if (games.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">{title}</h2>
        <Link to="/games" className="text-xs text-text-muted hover:text-text-accent transition-colors">
          View All →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  );
}
