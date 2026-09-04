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
      className="group block bg-surface-raised border border-border-default rounded-xl overflow-hidden transition-all duration-200 hover-lift"
      style={{
        ['--card-accent' as string]: game.color,
      }}
    >
      <div className={sizeClasses[size]}>
        {/* Icon + Color accent */}
        <div
          className="w-full aspect-[4/3] rounded-lg flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-[1.03] relative overflow-hidden"
          style={{ backgroundColor: `${game.color}12` }}
        >
          {/* Hover glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at center, ${game.color}20 0%, transparent 70%)`,
            }}
          />
          <span className={`${iconSizes[size]} drop-shadow-sm relative z-10 transition-transform duration-300 group-hover:scale-110`}>
            {game.icon}
          </span>
        </div>

        {/* Info */}
        <h3 className="font-semibold text-sm text-text-primary group-hover:text-white truncate transition-colors">
          {game.title}
        </h3>
        <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{game.shortDescription}</p>

        {/* Tags */}
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md uppercase tracking-wider transition-colors"
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

      {/* Bottom accent line on hover */}
      <div
        className="h-0.5 w-0 group-hover:w-full transition-all duration-300 ease-out"
        style={{ backgroundColor: game.color }}
      />
    </Link>
  );
}
