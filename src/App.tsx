import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { usePlayerStore } from './stores/playerStore';
import { AppShell } from './components/layout/AppShell';
import { Onboarding } from './components/shared/Onboarding';
import { AchievementToast } from './components/shared/AchievementToast';

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home'));
const Games = lazy(() => import('./pages/Games'));
const GamePage = lazy(() => import('./pages/GamePage'));
const Multiplayer = lazy(() => import('./pages/Multiplayer'));
const CreateRoom = lazy(() => import('./pages/multiplayer/CreateRoom'));
const RoomLobby = lazy(() => import('./pages/multiplayer/RoomLobby'));
const Challenges = lazy(() => import('./pages/Challenges'));
const Profile = lazy(() => import('./pages/Profile'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Accessibility = lazy(() => import('./pages/Accessibility'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-hrsh-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-text-muted text-sm">Loading...</span>
      </div>
    </div>
  );
}

export default function App() {
  const { initialize, showOnboarding, isLoading } = usePlayerStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-base">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">HRSH</h1>
          <div className="w-8 h-8 border-2 border-hrsh-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <Onboarding />;
  }

  return (
    <>
      <AppShell>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/:slug" element={<GamePage />} />
            <Route path="/multiplayer" element={<Multiplayer />} />
            <Route path="/room/create" element={<CreateRoom />} />
            <Route path="/room/:roomId" element={<RoomLobby />} />
            <Route path="/challenges" element={
              <Suspense fallback={<div className="p-8 text-text-muted">Loading...</div>}>
                <Challenges />
              </Suspense>
            } />
            <Route path="/profile" element={<Profile />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/accessibility" element={<Accessibility />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AppShell>
      <AchievementToast />
    </>
  );
}
