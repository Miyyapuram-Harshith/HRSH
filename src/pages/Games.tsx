import { useState, useMemo } from 'react';
import { GameRegistry } from '../engine/GameRegistry';
import { GameCard } from '../components/shared/GameCard';
import type { GameCategory } from '../types/game';

const CATEGORIES: { id: GameCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'solo', label: 'Solo' },
  { id: 'duels', label: 'Duels' },
  { id: 'party', label: 'Party' },
  { id: 'chaos', label: 'Chaos' },
  { id: 'showpiece', label: 'Showpiece' },
];

export default function Games() {
  const [category, setCategory] = useState<GameCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  const games = useMemo(() => {
    let result = category === 'all' ? GameRegistry.getAll() : GameRegistry.getByCategory(category);
    if (search.trim()) {
      result = GameRegistry.search(search);
      if (category !== 'all') {
        result = result.filter((g) => g.category === category);
      }
    }
    return result;
  }, [category, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Games</h1>
        <p className="text-text-muted text-sm mt-1">Discover and play {GameRegistry.count} games</p>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search games..."
          className="w-full max-w-md bg-surface-raised border border-border-default rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-hrsh-accent focus:ring-1 focus:ring-hrsh-accent transition-colors"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              category === cat.id
                ? 'bg-hrsh-accent text-white'
                : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay border border-border-default'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Game grid */}
      {games.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-3xl mb-3">🔍</div>
          <p className="text-text-muted text-sm">No games found</p>
        </div>
      )}
    </div>
  );
}
