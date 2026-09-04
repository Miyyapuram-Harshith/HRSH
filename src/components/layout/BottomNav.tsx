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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-raised/95 backdrop-blur-lg border-t border-border-default safe-area-bottom">
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
                transition-colors duration-150
                ${isActive
                  ? 'text-hrsh-accent'
                  : 'text-text-muted'
                }
              `}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
