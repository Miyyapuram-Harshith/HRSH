import { NavLink } from 'react-router-dom';
import { usePlayerStore } from '../../stores/playerStore';

export function Header() {
  const { streak } = usePlayerStore();

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-surface-raised/95 backdrop-blur-lg border-b border-border-default safe-area-top animate-[slide-down_0.2s_ease-out]">
      <div className="flex items-center justify-between px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tighter gradient-text">HRSH</span>
        </NavLink>
        <div className="flex items-center gap-2">
          {/* Streak badge */}
          {streak && streak.currentStreak > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-surface-overlay rounded-full text-xs">
              <span className="text-sm">🔥</span>
              <span className="text-status-warning font-bold">{streak.currentStreak}</span>
            </div>
          )}
          <NavLink
            to="/profile"
            className="w-8 h-8 rounded-full bg-surface-overlay flex items-center justify-center text-sm hover:bg-surface-hover transition-colors"
            aria-label="Profile"
          >
            👤
          </NavLink>
        </div>
      </div>
    </header>
  );
}
