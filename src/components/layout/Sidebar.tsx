import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/games', label: 'Games', icon: '🎮' },
  { to: '/multiplayer', label: 'Play Online', icon: '🌐' },
  { to: '/challenges', label: 'Challenges', icon: '🎯' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-56 bg-surface-raised border-r border-border-default shrink-0 sticky top-0 h-screen safe-area-top">
      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-2 px-5 py-5 border-b border-border-default">
        <span className="text-xl font-bold tracking-tight text-text-primary">HRSH</span>
        <span className="text-xs text-text-muted font-medium mt-0.5">by Articlarity</span>
      </NavLink>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.to === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(item.to);
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${isActive
                  ? 'bg-hrsh-accent/10 text-hrsh-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay/50'
                }
              `}
            >
              <span className="text-base">{item.icon}</span>
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
