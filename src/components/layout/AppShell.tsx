import { useState, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { Footer } from './Footer';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const location = useLocation();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip to content — Accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>

      {isOffline && (
        <div className="bg-status-warning text-status-warning-fg text-xs font-bold text-center py-1.5 px-4 shadow-sm z-50 animate-[slide-down_0.3s_ease-out]" role="alert">
          You are offline. Solo games will sync when you reconnect.
        </div>
      )}
      {/* Mobile/Tablet Header */}
      <Header />

      <div className="flex flex-1">
        {/* Desktop Sidebar — hidden on mobile */}
        <Sidebar />

        {/* Main Content */}
        <main id="main-content" className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 lg:pb-6">
            {children}
          </div>
          <Footer />
        </main>
      </div>

      {/* Mobile Bottom Nav — hidden on desktop */}
      <BottomNav />
    </div>
  );
}
