import { Link } from 'react-router-dom';
import type { GameMetadata } from '../../types/game';

interface GameCardProps {
  game: GameMetadata;
  size?: 'sm' | 'md' | 'lg';
}

export function GameCard({ game, size = 'md' }: GameCardProps) {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  };

  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  return (
    <Link
      to={`/games/${game.slug}`}
      className="group block bg-surface-raised border border-border-default rounded-xl hover:border-border-accent hover:bg-surface-overlay/50 transition-all duration-200 overflow-hidden"
    >
      <div className={sizeClasses[size]}>
        {/* Icon + Color accent */}
        <div
          className="w-full aspect-[4/3] rounded-lg flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-[1.02]"
          style={{ backgroundColor: `${game.color}15` }}
        >
          <span className={`${iconSizes[size]} drop-shadow-sm`}>{game.icon}</span>
        </div>

        {/* Info */}
        <h3 className="font-semibold text-sm text-text-primary group-hover:text-white truncate">
          {game.title}
        </h3>
        <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{game.shortDescription}</p>

        {/* Tags */}
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md uppercase tracking-wider"
            style={{ backgroundColor: `${game.color}20`, color: game.color }}
          >
            {game.category}
          </span>
          {game.multiplayer && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-surface-overlay text-text-muted">
              {game.maxPlayers}P
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
