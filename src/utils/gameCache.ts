import { lazy } from 'react';
import type { Game } from '../types/game';

const componentCache = new Map<string, any>();

export function getGameComponent(game: Game) {
  if (!componentCache.has(game.id)) {
    componentCache.set(game.id, lazy(game.component));
  }
  return componentCache.get(game.id);
}
