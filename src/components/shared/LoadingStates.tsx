import type { ReactNode } from 'react';

// ============================================================
// Skeleton Components
// ============================================================

export function GameCardSkeleton() {
  return (
    <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="skeleton w-full aspect-[4/3] rounded-lg mb-3" />
        <div className="skeleton h-4 w-3/4 mb-2" />
        <div className="skeleton h-3 w-1/2 mb-3" />
        <div className="flex gap-1.5">
          <div className="skeleton h-5 w-12 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function GameCardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-[fade-in_0.2s_ease-out]">
      <div className="bg-surface-raised border border-border-default rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="skeleton w-16 h-16 rounded-full" />
          <div className="flex-1">
            <div className="skeleton h-6 w-32 mb-2" />
            <div className="skeleton h-3 w-48" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface-raised border border-border-default rounded-xl p-4">
            <div className="skeleton h-7 w-12 mx-auto mb-2" />
            <div className="skeleton h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Error State
// ============================================================

interface PageErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  icon?: string;
}

export function PageError({ 
  title = 'Something went wrong', 
  message = 'An unexpected error occurred. Please try again.', 
  onRetry,
  icon = '⚠️'
}: PageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-[fade-in_0.2s_ease-out]">
      <div className="text-4xl mb-4">{icon}</div>
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-text-muted text-sm mb-6 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-hrsh-accent hover:bg-hrsh-accent-hover text-white rounded-xl font-medium text-sm transition-colors active-press"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// ============================================================
// Empty State
// ============================================================

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-[fade-in_0.2s_ease-out]">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      {description && <p className="text-text-muted text-sm mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

// ============================================================
// Confetti
// ============================================================

const CONFETTI_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#f97316'];

export function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  
  return (
    <div className="confetti-container" aria-hidden="true">
      {Array.from({ length: 40 }).map((_, i) => {
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const left = Math.random() * 100;
        const delay = Math.random() * 1.5;
        const size = 4 + Math.random() * 8;
        return (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${left}%`,
              backgroundColor: color,
              width: `${size}px`,
              height: `${size}px`,
              animationDelay: `${delay}s`,
              animationDuration: `${2 + Math.random() * 1.5}s`,
            }}
          />
        );
      })}
    </div>
  );
}
