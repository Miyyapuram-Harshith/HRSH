import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { Footer } from './Footer';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile/Tablet Header */}
      <Header />

      <div className="flex flex-1">
        {/* Desktop Sidebar — hidden on mobile */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
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
