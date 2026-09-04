import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/games', label: 'Games', icon: '🎮' },
  { to: '/multiplayer', label: 'Play Online', icon: '🌐' },
  { to: '/challenges', label: 'Challenges', icon: '🎯' },
  { to: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-56 bg-surface-raised border-r border-border-default shrink-0 sticky top-0 h-screen safe-area-top">
      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-2 px-5 py-5 border-b border-border-default group">
        <span className="text-xl font-black tracking-tighter gradient-text">HRSH</span>
        <span className="text-xs text-text-muted font-medium mt-0.5 group-hover:text-text-secondary transition-colors">by Articlarity</span>
      </NavLink>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = item.to === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(item.to);
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 relative
                ${isActive
                  ? 'bg-hrsh-accent/10 text-hrsh-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay/50'
                }
              `}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-hrsh-accent rounded-r-full animate-[scale-in_0.15s_ease-out]" />
              )}
              <span className="text-base transition-transform duration-150 group-hover:scale-110">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-border-default">
        <div className="text-xs text-text-muted">
          Play. Challenge. Repeat.
        </div>
      </div>
    </aside>
  );
}
