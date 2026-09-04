// ============================================================
// HRSH — Game Registry
// ============================================================
// Central registry of all games. Games self-register their
// metadata here. The platform derives UI, routing, room
// configuration, and discovery from this data.
// ============================================================

import type { GameCategory, GameMetadata } from '../types/game';

class GameRegistryImpl {
  private games: Map<string, GameMetadata> = new Map();

  register(metadata: GameMetadata): void {
    if (this.games.has(metadata.id)) {
      console.warn(`[GameRegistry] Game "${metadata.id}" is already registered.`);
      return;
    }
    this.games.set(metadata.id, metadata);
  }

  get(id: string): GameMetadata | undefined {
    return this.games.get(id);
  }

  getBySlug(slug: string): GameMetadata | undefined {
    for (const game of this.games.values()) {
      if (game.slug === slug) return game;
    }
    return undefined;
  }

  getAll(): GameMetadata[] {
    return Array.from(this.games.values());
  }

  getByCategory(category: GameCategory): GameMetadata[] {
    return this.getAll().filter((g) => g.category === category);
  }

  getMultiplayer(): GameMetadata[] {
    return this.getAll().filter((g) => g.multiplayer);
  }

  getSolo(): GameMetadata[] {
    return this.getAll().filter((g) => !g.multiplayer || g.category === 'solo');
  }

  getFeatured(): GameMetadata[] {
    // Return first 6 games as "featured" — can be more sophisticated later
    return this.getAll().slice(0, 6);
  }

  search(query: string): GameMetadata[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getAll();
    return this.getAll().filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.tags.some((t) => t.toLowerCase().includes(q)) ||
        g.category.toLowerCase().includes(q)
    );
  }

  get count(): number {
    return this.games.size;
  }
}

export const GameRegistry = new GameRegistryImpl();
