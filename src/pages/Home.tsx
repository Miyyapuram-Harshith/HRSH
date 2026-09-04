import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GameRegistry } from '../engine/GameRegistry';
import { LiveActivityService } from '../engine/LiveActivityService';
import { QuickPlayEngine } from '../engine/QuickPlayEngine';
import { AnalyticsEngine } from '../engine/AnalyticsEngine';
import { ScoreEngine } from '../engine/ScoreEngine';
import { usePlayerStore } from '../stores/playerStore';
import { GameCard } from '../components/shared/GameCard';
import { EmptyState } from '../components/shared/LoadingStates';
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
  const partyGames = GameRegistry.getByCategory('party');
  const showpieceGames = GameRegistry.getByCategory('showpiece');

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* ──── Hero Section ──── */}
      <section className="relative text-center py-8 sm:py-14 overflow-hidden">
        {/* Floating background particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-hrsh-accent/5 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite_1s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/3 rounded-full blur-3xl animate-[float_10s_ease-in-out_infinite_2s]" />
        </div>

        <div className="relative z-10">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-3 gradient-text">
            HRSH
          </h1>
          <p className="text-text-secondary text-sm sm:text-base mb-8 animate-[fade-in_0.5s_ease-out_0.2s_both]">
            Play. Challenge. Repeat.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-[slide-up_0.5s_ease-out_0.3s_both]">
            <button
              onClick={handleQuickPlay}
              className="group w-full sm:w-auto px-8 py-3.5 bg-hrsh-accent hover:bg-hrsh-accent-hover text-white font-semibold rounded-xl text-sm transition-all active:scale-[0.97] shadow-lg shadow-hrsh-accent/20 hover:shadow-hrsh-accent/40 hover:shadow-xl"
            >
              <span className="inline-block group-hover:animate-[bounce-in_0.3s] mr-1">⚡</span>
              Quick Play
            </button>
            <Link
              to="/multiplayer"
              className="w-full sm:w-auto px-8 py-3.5 bg-surface-raised hover:bg-surface-overlay border border-border-default hover:border-border-accent text-text-primary font-semibold rounded-xl text-sm transition-all active:scale-[0.97] text-center"
            >
              🎮 Play Online
            </Link>
          </div>

          {/* Streak display */}
          {streak && streak.currentStreak > 0 && (
            <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full text-sm animate-[pop_0.5s_ease-out_0.5s_both]">
              <span className="text-lg animate-[float_2s_ease-in-out_infinite]">🔥</span>
              <span className="text-status-warning font-bold">{streak.currentStreak} day streak</span>
              {streak.longestStreak > streak.currentStreak && (
                <span className="text-text-muted text-xs">· Best: {streak.longestStreak}</span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ──── Live Now ──── */}
      {liveRooms.length > 0 && (
        <section className="animate-[fade-in_0.3s_ease-out]">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-status-live" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-status-live animate-[ripple_1.5s_ease-out_infinite]" />
            </div>
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Live Now</h2>
            {LiveActivityService.isMock && (
              <span className="text-[10px] text-text-muted bg-surface-overlay px-1.5 py-0.5 rounded">(Preview)</span>
            )}
          </div>

          <div className="space-y-2">
            {liveRooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between bg-surface-raised border border-border-default rounded-xl px-4 py-3 hover:border-border-accent transition-all hover-lift"
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
                    <button className="px-3 py-1.5 bg-status-success/10 text-status-success rounded-lg text-xs font-semibold hover:bg-status-success/20 transition-colors active-press">
                      JOIN
                    </button>
                  ) : room.watchable ? (
                    <button className="px-3 py-1.5 bg-surface-overlay text-text-secondary rounded-lg text-xs font-semibold hover:bg-surface-hover transition-colors active-press">
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

      {/* ──── Continue Playing ──── */}
      {recentGames.length > 0 && (
        <section className="animate-[fade-in_0.3s_ease-out]">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Continue Playing</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none snap-x snap-mandatory">
            {recentGames.map((recent) => {
              const game = GameRegistry.get(recent.gameId);
              if (!game) return null;
              return (
                <Link
                  key={recent.gameId}
                  to={`/games/${game.slug}`}
                  className="flex-shrink-0 snap-start flex items-center gap-3 bg-surface-raised border border-border-default rounded-xl px-4 py-3 hover:border-border-accent transition-all hover-lift min-w-[180px]"
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

      {/* ──── Game Rails ──── */}
      <GameRail title="Solo Games" games={soloGames} />
      <GameRail title="Duels" games={duelGames} />
      <GameRail title="Party" games={partyGames} />
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
        {games.map((game, i) => (
          <div key={game.id} style={{ animationDelay: `${i * 0.05}s` }} className="animate-[stagger-fade_0.3s_ease-out_both]">
            <GameCard game={game} />
          </div>
        ))}
      </div>
    </section>
  );
}
