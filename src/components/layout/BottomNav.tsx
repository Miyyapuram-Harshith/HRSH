import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/games', label: 'Games', icon: '🎮' },
  { to: '/multiplayer', label: 'Play', icon: '⚡' },
  { to: '/challenges', label: 'Daily', icon: '🎯' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-raised/95 backdrop-blur-lg border-t border-border-default safe-area-bottom" aria-label="Bottom navigation">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`
                flex flex-col items-center gap-0.5 px-3 py-2 min-w-[64px] rounded-lg
                transition-all duration-150 relative
                ${isActive
                  ? 'text-hrsh-accent'
                  : 'text-text-muted active:text-text-secondary'
                }
              `}
            >
              <span className={`text-lg transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}>{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
              {/* Active dot indicator */}
              {isActive && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-hrsh-accent rounded-full animate-[scale-in_0.15s_ease-out]" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
