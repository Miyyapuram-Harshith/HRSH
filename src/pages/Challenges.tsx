import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChallengeEngine } from '../engine/ChallengeEngine';
import { GameRegistry } from '../engine/GameRegistry';
import { usePlayerStore } from '../stores/playerStore';

export default function Challenges() {
  const { streak } = usePlayerStore();
  const today = ChallengeEngine.getTodayDateString();
  
  const dailyChallenge = useMemo(() => {
    return ChallengeEngine.getDailyChallenge(today);
  }, [today]);

  const game = GameRegistry.get(dailyChallenge.gameId);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold tracking-tight">Challenges</h1>
        <p className="text-text-muted text-sm mt-1">New challenges every day</p>
      </div>

      {/* Daily Challenge Card */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Daily Challenge</h2>
        <div className="bg-surface-raised border border-hrsh-accent/50 rounded-2xl p-6 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-hrsh-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl bg-surface-overlay border border-border-default">
                {game?.icon || '🎮'}
              </div>
              <div>
                <div className="text-hrsh-accent font-semibold text-sm mb-1">{today}</div>
                <h3 className="text-xl font-bold">{game?.title || 'Unknown Game'}</h3>
                <p className="text-text-secondary text-sm mt-1">{dailyChallenge.description}</p>
              </div>
            </div>
            
            <Link
              to={`/games/${game?.slug || ''}`}
              className="w-full md:w-auto px-8 py-3.5 bg-hrsh-accent hover:bg-hrsh-accent-hover text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-hrsh-accent/20 text-center whitespace-nowrap"
            >
              Play Challenge
            </Link>
          </div>
        </div>
      </div>

      {/* Streaks & Rewards */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Your Streak</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-surface-raised border border-border-default rounded-2xl p-6 flex items-center justify-between">
            <div>
              <div className="text-text-muted text-sm mb-1">Current Streak</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <span className="text-3xl font-bold text-status-warning">{streak?.currentStreak || 0}</span>
                <span className="text-text-secondary font-medium mt-2">days</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-text-muted text-sm mb-1">Longest</div>
              <div className="text-xl font-bold">{streak?.longestStreak || 0}</div>
            </div>
          </div>

          <div className="bg-surface-raised border border-border-default rounded-2xl p-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-text-muted text-sm mb-1">Streak Freezes</div>
                <div className="flex gap-1">
                  {Array.from({ length: Math.max(3, streak?.streakFreezes || 0) }).map((_, i) => (
                    <span key={i} className={`text-xl ${i < (streak?.streakFreezes || 0) ? 'opacity-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'opacity-20'}`}>❄️</span>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => usePlayerStore.getState().addStreakFreeze()}
                className="px-3 py-1.5 bg-surface-overlay hover:bg-surface-hover border border-border-default rounded-lg text-xs font-medium transition-colors"
              >
                Get Freeze
              </button>
            </div>
            <p className="text-xs text-text-muted mt-3">
              Streak freezes protect your streak if you miss a day. Earn them by completing challenges.
            </p>
          </div>
        </div>
      </div>
      
      {/* Friend Challenges */}
      <div className="bg-surface-raised border border-border-default rounded-2xl p-6 text-center">
        <div className="text-3xl mb-3">🤝</div>
        <h2 className="text-base font-semibold mb-1">Friend Challenges</h2>
        <p className="text-text-muted text-xs mb-4">Share your personal bests to challenge your friends directly.</p>
        <div className="inline-block px-4 py-2 bg-surface-base border border-border-default rounded-lg text-xs text-text-secondary">
          Play any game and click "Challenge Friend" on the result screen.
        </div>
      </div>
    </div>
  );
}
