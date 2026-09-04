import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GameRegistry } from '../engine/GameRegistry';
import { LiveActivityService } from '../engine/LiveActivityService';
import { QuickPlayEngine } from '../engine/QuickPlayEngine';
import { AnalyticsEngine } from '../engine/AnalyticsEngine';
import { ScoreEngine } from '../engine/ScoreEngine';
import { QuestEngine } from '../engine/QuestEngine';
import { usePlayerStore } from '../stores/playerStore';
import { GameCard } from '../components/shared/GameCard';
import { Blip } from '../components/ui/Blip';
import type { LiveRoom } from '../types/engine';
import type { GameMetadata } from '../types/game';
import type { RecentGame, QuestProgress } from '../types/player';

export default function Home() {
  const navigate = useNavigate();
  const { player, streak } = usePlayerStore();
  const [liveRooms, setLiveRooms] = useState<LiveRoom[]>([]);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [quests, setQuests] = useState<QuestProgress[]>([]);

  // Mock global pulse data
  const [globalPulse] = useState({ gamesPlayed: 1204, playersOnline: 87 });

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
      QuestEngine.getActiveQuests(player.id).then(setQuests);
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

  const pendingQuests = quests.filter(q => !q.completed).length;
  const blipState = pendingQuests === 0 ? 'celebrating' : (streak && streak.currentStreak > 0 && streak.currentStreak < 2 ? 'alert' : 'idle');

  return (
    <div className="space-y-8 sm:space-y-12 pb-20">
      
      {/* ──── Live Global Pulse ──── */}
      <div className="text-center mt-2 animate-[fade-in_0.5s_ease-out]">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-text-muted bg-surface-raised px-4 py-1.5 rounded-full shadow-base border border-border-default">
          <span className="w-1.5 h-1.5 bg-hrsh-accent rounded-full animate-pulse" />
          {globalPulse.gamesPlayed.toLocaleString()} games played today · {globalPulse.playersOnline} players online now
        </div>
      </div>

      {/* ──── Hero Section & Personas ──── */}
      <section className="relative text-center py-6 sm:py-10 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-hrsh-accent/5 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite_1s]" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          
          <div className="mb-6">
            <Blip state={blipState} size={64} onClick={() => navigate('/profile')} />
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-3 gradient-text">
            HRSH
          </h1>
          <p className="text-text-secondary text-sm sm:text-base mb-8 animate-[fade-in_0.5s_ease-out_0.2s_both]">
            Play. Challenge. Repeat.
          </p>

          {/* Streak display */}
          {streak && streak.currentStreak > 0 && (
            <div className="mb-8 inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full text-sm animate-[pop_0.5s_ease-out_0.5s_both]">
              <span className="text-lg animate-[float_2s_ease-in-out_infinite]">🔥</span>
              <span className="text-status-warning font-bold">{streak.currentStreak} day streak</span>
            </div>
          )}

          {/* 5 Personas Entry Points */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mx-auto px-4 animate-[slide-up_0.5s_ease-out_0.3s_both]">
            <button
              onClick={handleQuickPlay}
              className="col-span-2 md:col-span-1 flex flex-col items-center justify-center gap-2 p-4 bg-hrsh-accent hover:bg-hrsh-accent-hover text-white rounded-2xl transition-hrsh hover-lift shadow-raised active-press"
            >
              <span className="text-2xl">⚡</span>
              <span className="font-bold text-sm">Quick Play</span>
            </button>
            <Link
              to="/room/create"
              className="flex flex-col items-center justify-center gap-2 p-4 bg-surface-raised border border-border-default hover:border-hrsh-accent/50 rounded-2xl transition-hrsh hover-lift shadow-base active-press"
            >
              <span className="text-2xl">👥</span>
              <span className="font-bold text-sm">Play Online</span>
            </Link>
            <Link
              to="/profile"
              className="flex flex-col items-center justify-center gap-2 p-4 bg-surface-raised border border-border-default hover:border-purple-500/50 rounded-2xl transition-hrsh hover-lift shadow-base active-press"
            >
              <span className="text-2xl">🏆</span>
              <span className="font-bold text-sm">Leagues</span>
            </Link>
            <Link
              to="/profile?tab=achievements"
              className="col-span-2 md:col-span-1 flex flex-col items-center justify-center gap-2 p-4 bg-surface-raised border border-border-default hover:border-yellow-500/50 rounded-2xl transition-hrsh hover-lift shadow-base active-press"
            >
              <span className="text-2xl">⭐</span>
              <span className="font-bold text-sm">Quests & Unlocks</span>
            </Link>
          </div>

        </div>
      </section>

      {/* ──── Daily Quests ──── */}
      {quests.length > 0 && (
        <section className="animate-[fade-in_0.4s_ease-out] max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
              <span>🎯</span> Daily Quests
            </h2>
            <span className="text-xs text-text-muted">{pendingQuests} remaining</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {quests.map(q => {
              const def = [{ id: 'q_daily_play_3', title: 'Active Gamer', target: 3 }, { id: 'q_daily_win_1', title: 'Taste of Victory', target: 1 }, { id: 'q_daily_snake_2', title: 'Snake Charmer', target: 2 }].find(x => x.id === q.questId);
              if (!def) return null;
              const pct = Math.min(100, Math.round((q.progress / def.target) * 100));
              return (
                <div key={q.questId} className={`p-3 rounded-xl border ${q.completed ? 'bg-status-success/10 border-status-success/30' : 'bg-surface-raised border-border-default'} transition-colors`}>
                  <div className="text-sm font-bold mb-1">{def.title}</div>
                  <div className="flex justify-between items-center text-xs text-text-muted mb-2">
                    <span>{q.progress} / {def.target}</span>
                    {q.completed && <span className="text-status-success font-bold">Done!</span>}
                  </div>
                  <div className="w-full bg-surface-overlay h-1.5 rounded-full overflow-hidden">
                    <div className="bg-hrsh-accent h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ──── Live Now ──── */}
      {liveRooms.length > 0 && (
        <section className="animate-[fade-in_0.3s_ease-out] max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-status-live" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-status-live animate-[ripple_1.5s_ease-out_infinite]" />
            </div>
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Live Now</h2>
          </div>

          <div className="space-y-2">
            {liveRooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between bg-surface-raised border border-border-default rounded-xl px-4 py-3 hover:border-border-accent transition-all hover-lift shadow-base"
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
        <section className="animate-[fade-in_0.3s_ease-out] max-w-4xl mx-auto px-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Continue Playing</h2>
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-none snap-x snap-mandatory">
            {recentGames.map((recent) => {
              const game = GameRegistry.get(recent.gameId);
              if (!game) return null;
              return (
                <Link
                  key={recent.gameId}
                  to={`/games/${game.slug}`}
                  className="flex-shrink-0 snap-start flex items-center gap-3 bg-surface-raised border border-border-default rounded-xl px-4 py-3 hover:border-border-accent transition-all hover-lift min-w-[180px] shadow-base"
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
      <div className="max-w-6xl mx-auto px-4 space-y-12">
        <GameRail title="Solo Games" games={soloGames} />
        <GameRail title="Duels" games={duelGames} />
        <GameRail title="Party" games={partyGames} />
        <GameRail title="Chaos" games={chaosGames} />
        <GameRail title="Showpiece" games={showpieceGames} />
      </div>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {games.map((game, i) => (
          <div key={game.id} style={{ animationDelay: `${i * 0.05}s` }} className="animate-[stagger-fade_0.3s_ease-out_both] h-full">
            <GameCard game={game} />
          </div>
        ))}
      </div>
    </section>
  );
}
