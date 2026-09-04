import { NavLink } from 'react-router-dom';

export function Header() {
  return (
    <header className="lg:hidden sticky top-0 z-40 bg-surface-raised/95 backdrop-blur-lg border-b border-border-default safe-area-top">
      <div className="flex items-center justify-between px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-text-primary">HRSH</span>
        </NavLink>
        <div className="flex items-center gap-2">
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
