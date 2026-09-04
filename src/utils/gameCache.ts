import { lazy } from 'react';
import type { GameMetadata } from '../types/game';

const componentCache = new Map<string, any>();

export function getGameComponent(game: GameMetadata) {
  if (!componentCache.has(game.id)) {
    componentCache.set(game.id, lazy(game.component));
  }
  return componentCache.get(game.id);
}
