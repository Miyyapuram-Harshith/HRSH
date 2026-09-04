import { useState, useMemo, useEffect, useRef } from 'react';
import { GameRegistry } from '../engine/GameRegistry';
import { GameCard } from '../components/shared/GameCard';
import { EmptyState } from '../components/shared/LoadingStates';
import type { GameCategory } from '../types/game';

const CATEGORIES: { id: GameCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'solo', label: 'Solo', icon: '🎯' },
  { id: 'duels', label: 'Duels', icon: '⚔️' },
  { id: 'party', label: 'Party', icon: '🎉' },
  { id: 'chaos', label: 'Chaos', icon: '💥' },
  { id: 'showpiece', label: 'Showpiece', icon: '🏆' },
];

export default function Games() {
  const [category, setCategory] = useState<GameCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

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

  const counts = useMemo(() => {
    const all = GameRegistry.getAll();
    const map: Record<string, number> = { all: all.length };
    for (const g of all) {
      map[g.category] = (map[g.category] || 0) + 1;
    }
    return map;
  }, []);

  return (
    <div className="space-y-6 animate-[fade-in_0.2s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Games</h1>
        <p className="text-text-muted text-sm mt-1">Discover and play {GameRegistry.count} games</p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search games..."
          aria-label="Search games"
          className="w-full max-w-md bg-surface-raised border border-border-default rounded-xl px-4 py-2.5 pl-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-hrsh-accent focus:ring-1 focus:ring-hrsh-accent transition-colors"
        />
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <kbd className="hidden sm:flex absolute right-3.5 top-1/2 -translate-y-1/2 items-center px-1.5 py-0.5 bg-surface-base border border-border-default rounded text-[10px] text-text-muted font-mono">
          /
        </kbd>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 active-press ${
              category === cat.id
                ? 'bg-hrsh-accent text-white shadow-lg shadow-hrsh-accent/20'
                : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay border border-border-default hover:border-border-accent'
            }`}
          >
            <span className="text-xs">{cat.icon}</span>
            {cat.label}
            <span className={`text-[10px] ml-1 px-1.5 py-0.5 rounded-full font-mono ${
              category === cat.id ? 'bg-white/20' : 'bg-surface-base'
            }`}>
              {counts[cat.id] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Game grid */}
      {games.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {games.map((game, i) => (
            <div key={game.id} style={{ animationDelay: `${i * 0.04}s` }} className="animate-[stagger-fade_0.3s_ease-out_both]">
              <GameCard game={game} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🔍"
          title="No games found"
          description={search ? `No results for "${search}". Try a different search term.` : 'No games in this category yet.'}
          action={
            search ? (
              <button
                onClick={() => { setSearch(''); setCategory('all'); }}
                className="px-4 py-2 bg-surface-raised border border-border-default rounded-xl text-sm hover:bg-surface-overlay transition-colors"
              >
                Clear Search
              </button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
