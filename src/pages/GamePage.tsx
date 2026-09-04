import { Suspense, useState, useEffect, lazy, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GameRegistry } from '../engine/GameRegistry';
import { ScoreEngine } from '../engine/ScoreEngine';
import { AnalyticsEngine } from '../engine/AnalyticsEngine';
import { usePlayerStore } from '../stores/playerStore';
import { GameShell } from '../components/game/GameShell';
import type { PersonalBest } from '../types/player';

export default function GamePage() {
  const { slug } = useParams<{ slug: string }>();
  const { player, favorites, toggleFavorite } = usePlayerStore();
  const [playing, setPlaying] = useState(false);
  const [personalBest, setPersonalBest] = useState<PersonalBest | null>(null);
  const [isFav, setIsFav] = useState(false);

  const game = useMemo(() => slug ? GameRegistry.getBySlug(slug) : undefined, [slug]);

  useEffect(() => {
    if (game) {
      AnalyticsEngine.track('GAME_OPEN', { gameId: game.id });
      document.title = `${game.title} — HRSH`;
    }
  }, [game]);

  useEffect(() => {
    if (player && game) {
      ScoreEngine.getPersonalBest(player.id, game.id, game.modes[0]?.id || 'classic').then((pb) => {
        setPersonalBest(pb || null);
      });
      setIsFav(favorites.includes(game.id));
    }
  }, [player, game, favorites]);

  if (!game) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">🎮</div>
        <h1 className="text-xl font-bold mb-2">Game not found</h1>
        <Link to="/games" className="text-hrsh-accent hover:underline text-sm">Browse games →</Link>
      </div>
    );
  }

  const handleToggleFavorite = async () => {
    if (!player) return;
    const result = await toggleFavorite(game.id);
    setIsFav(result);
  };

  // Lazy-load game component
  const GameComponent = useMemo(() => {
    return lazy(game.component);
  }, [game]);

  if (playing) {
    return (
      <GameShell game={game} onQuit={() => setPlaying(false)}>
        {(props) => (
          <Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-hrsh-accent border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <GameComponent {...props} />
          </Suspense>
        )}
      </GameShell>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/games" className="hover:text-text-secondary transition-colors">Games</Link>
        <span>/</span>
        <span className="text-text-primary">{game.title}</span>
      </nav>

      {/* Game header */}
      <div className="bg-surface-raised border border-border-default rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${game.color}15` }}
            >
              {game.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{game.title}</h1>
              <p className="text-text-muted text-sm mt-0.5">{game.shortDescription}</p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-md uppercase tracking-wider"
                  style={{ backgroundColor: `${game.color}20`, color: game.color }}
                >
                  {game.category}
                </span>
                {game.multiplayer && (
                  <span className="text-xs text-text-muted">{game.minPlayers}–{game.maxPlayers} players</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleToggleFavorite}
            className="text-xl hover:scale-110 transition-transform"
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFav ? '❤️' : '🤍'}
          </button>
        </div>

        {/* Personal Best */}
        {personalBest && (
          <div className="mt-4 pt-4 border-t border-border-default flex items-center gap-3">
            <span className="text-sm text-text-muted">Personal Best:</span>
            <span className="font-mono font-bold" style={{ color: game.color }}>
              {personalBest.score.toLocaleString()}
            </span>
          </div>
        )}

        {/* Play button */}
        <div className="mt-6">
          <button
            onClick={() => setPlaying(true)}
            className="w-full sm:w-auto px-10 py-3.5 btn-3d btn-3d-primary text-sm"
          >
            ▶ Play Now
          </button>
        </div>
      </div>

      {/* How to Play */}
      <div className="bg-surface-raised border border-border-default rounded-2xl p-6">
        <h2 className="text-base font-semibold mb-3">How to Play</h2>
        <p className="text-text-secondary text-sm leading-relaxed">{game.description}</p>

        {/* Controls */}
        <div className="mt-4 pt-4 border-t border-border-default">
          <h3 className="text-sm font-semibold mb-2">Controls</h3>
          <div className="flex flex-wrap gap-2">
            {game.controls.keyboard?.map((key) => (
              <span key={key} className="px-2.5 py-1 bg-surface-base border border-border-default rounded-lg text-xs text-text-secondary font-mono">
                {key}
              </span>
            ))}
            {game.controls.touch && (
              <span className="px-2.5 py-1 bg-surface-base border border-border-default rounded-lg text-xs text-text-secondary">
                Touch
              </span>
            )}
            {game.controls.gamepad && (
              <span className="px-2.5 py-1 bg-surface-base border border-border-default rounded-lg text-xs text-text-secondary">
                Gamepad
              </span>
            )}
          </div>
        </div>

        {/* Modes */}
        {game.modes.length > 1 && (
          <div className="mt-4 pt-4 border-t border-border-default">
            <h3 className="text-sm font-semibold mb-2">Modes</h3>
            <div className="flex flex-wrap gap-2">
              {game.modes.map((mode) => (
                <div key={mode.id} className="px-3 py-1.5 bg-surface-base border border-border-default rounded-lg">
                  <div className="text-xs font-medium">{mode.label}</div>
                  {mode.description && <div className="text-[10px] text-text-muted">{mode.description}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Related games */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">More {game.category} games</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {GameRegistry.getByCategory(game.category)
            .filter((g) => g.id !== game.id)
            .slice(0, 3)
            .map((g) => (
              <Link
                key={g.id}
                to={`/games/${g.slug}`}
                onClick={() => setPlaying(false)}
                className="flex items-center gap-3 bg-surface-raised border border-border-default rounded-xl px-3 py-2.5 hover:border-border-accent transition-colors"
              >
                <span className="text-xl">{g.icon}</span>
                <div>
                  <div className="text-xs font-medium">{g.title}</div>
                  <div className="text-[10px] text-text-muted">{g.shortDescription}</div>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
