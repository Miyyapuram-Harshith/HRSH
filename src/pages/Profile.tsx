import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlayerStore } from '../stores/playerStore';
import { ScoreEngine } from '../engine/ScoreEngine';
import { AchievementEngine } from '../engine/AchievementEngine';
import { XPEngine, type LevelProgress } from '../engine/XPEngine';
import { GameRegistry } from '../engine/GameRegistry';
import { ACHIEVEMENTS } from '../data/achievements';
import type { PersonalBest, GameHistoryEntry } from '../types/player';
import type { UnlockedAchievement } from '../types/engine';

export default function Profile() {
  const { player, streak, setName } = usePlayerStore();
  const [stats, setStats] = useState<{ gamesPlayed: number; wins: number; winRate: number; totalPlayTime: number; favoriteGameId: string | null } | null>(null);
  const [personalBests, setPersonalBests] = useState<PersonalBest[]>([]);
  const [recentHistory, setRecentHistory] = useState<GameHistoryEntry[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [xpProgress, setXpProgress] = useState<LevelProgress | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    if (!player) return;
    document.title = 'Profile — HRSH';

    ScoreEngine.getStats(player.id).then(setStats);
    ScoreEngine.getAllPersonalBests(player.id).then(setPersonalBests);
    ScoreEngine.getGameHistory(player.id, undefined, 10).then(setRecentHistory);
    AchievementEngine.getUnlockedAchievements(player.id).then(setUnlockedAchievements);
    XPEngine.getXPStats(player.id).then(setXpProgress);
  }, [player]);

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (trimmed.length >= 2) {
      await setName(trimmed);
      setEditingName(false);
    }
  };

  if (!player) return null;

  const favoriteGame = stats?.favoriteGameId ? GameRegistry.get(stats.favoriteGameId) : null;
  const formatTime = (ms: number) => {
    const m = Math.floor(ms / 60000);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  };

  const levelColor = xpProgress ? XPEngine.getLevelColor(xpProgress.level) : '#a1a1aa';
  const levelTitle = xpProgress ? XPEngine.getLevelTitle(xpProgress.level) : 'Newcomer';

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-[fade-in_0.2s_ease-out]">
      {/* Player card */}
      <div className="bg-surface-raised border border-border-default rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-surface-overlay flex items-center justify-center text-2xl border-2" style={{ borderColor: levelColor }}>
            {player.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            {editingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-surface-base border border-border-default rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-hrsh-accent"
                  autoFocus
                  maxLength={20}
                />
                <button onClick={handleSaveName} className="px-3 py-1.5 bg-hrsh-accent text-white rounded-lg text-xs font-medium active-press">Save</button>
                <button onClick={() => setEditingName(false)} className="px-3 py-1.5 text-text-muted text-xs">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{player.name || 'Anonymous'}</h1>
                <button
                  onClick={() => { setNameInput(player.name); setEditingName(true); }}
                  className="text-text-muted hover:text-text-secondary text-xs"
                  aria-label="Edit name"
                >
                  ✏️
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${levelColor}20`, color: levelColor }}>
                Lv.{xpProgress?.level || 1} · {levelTitle}
              </span>
              <p className="text-text-muted text-xs">
                Playing since {new Date(player.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        {xpProgress && (
          <div className="mt-4 pt-4 border-t border-border-default">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-text-muted">Level {xpProgress.level}</span>
              <span className="text-xs text-text-muted font-mono">{xpProgress.xpIntoLevel}/{100} XP</span>
            </div>
            <div className="xp-bar">
              <div className="xp-bar-fill" style={{ width: `${xpProgress.percentage}%` }} />
            </div>
          </div>
        )}

        {/* Streak */}
        {streak && streak.currentStreak > 0 && (
          <div className="mt-4 pt-4 border-t border-border-default flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>🔥</span>
              <span className="text-status-warning font-bold">{streak.currentStreak}</span>
              <span className="text-text-muted text-sm">day streak</span>
            </div>
            <div className="text-text-muted text-xs">Best: {streak.longestStreak}</div>
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Games Played', value: stats.gamesPlayed },
            { label: 'Wins', value: stats.wins },
            { label: 'Win Rate', value: `${stats.winRate}%` },
            { label: 'Play Time', value: formatTime(stats.totalPlayTime) },
          ].map((stat, i) => (
            <div key={stat.label} className="bg-surface-raised border border-border-default rounded-xl p-4 text-center animate-[stagger-fade_0.3s_ease-out_both]" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="text-xl font-bold font-mono tabular-nums">{stat.value}</div>
              <div className="text-text-muted text-xs mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Favorite game */}
      {favoriteGame && (
        <Link to={`/games/${favoriteGame.slug}`} className="flex items-center gap-3 bg-surface-raised border border-border-default rounded-xl px-4 py-3 hover:border-border-accent transition-all hover-lift">
          <span className="text-2xl">{favoriteGame.icon}</span>
          <div>
            <div className="text-xs text-text-muted">Favorite Game</div>
            <div className="text-sm font-medium">{favoriteGame.title}</div>
          </div>
        </Link>
      )}

      {/* Personal Bests */}
      {personalBests.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Personal Bests</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {personalBests.map((pb) => {
              const game = GameRegistry.get(pb.gameId);
              if (!game) return null;
              return (
                <div key={`${pb.gameId}-${pb.mode}`} className="bg-surface-raised border border-border-default rounded-xl p-3 hover-lift transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{game.icon}</span>
                    <span className="text-xs font-medium">{game.title}</span>
                  </div>
                  <div className="font-mono text-lg font-bold" style={{ color: game.color }}>
                    {pb.score.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HRSH Premium */}
      <div className="bg-gradient-to-r from-hrsh-accent/10 to-transparent border border-hrsh-accent/30 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-hrsh-accent flex items-center gap-2">
              HRSH Premium <span>✨</span>
            </h2>
            <p className="text-xs text-text-muted mt-1">
              {player.isPremium ? 'You are a Premium member.' : 'Upgrade to remove ads.'}
            </p>
          </div>
          <button
            onClick={() => usePlayerStore.getState().setPremium(!player.isPremium)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors active-press ${
              player.isPremium
                ? 'bg-surface-base border border-border-default text-text-muted'
                : 'bg-hrsh-accent text-white hover:bg-hrsh-accent-hover'
            }`}
          >
            {player.isPremium ? 'Cancel Premium' : 'Buy for $2.99'}
          </button>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = unlockedAchievements.some((u) => u.achievementId === ach.id);
            const rarityColor = {
              common: '#a1a1aa',
              uncommon: '#22c55e',
              rare: '#3b82f6',
              epic: '#a855f7',
              legendary: '#f59e0b',
            }[ach.rarity] || '#a1a1aa';

            return (
              <div
                key={ach.id}
                className={`bg-surface-raised border rounded-xl p-3 transition-all ${
                  unlocked ? 'hover-lift' : 'opacity-40'
                }`}
                style={{ borderColor: unlocked ? `${rarityColor}40` : undefined }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{ach.icon}</span>
                  <div>
                    <div className="text-xs font-medium">{ach.title}</div>
                    <div className="text-[10px] text-text-muted">{ach.description}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent History */}
      {recentHistory.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Recent Games</h2>
          <div className="space-y-2">
            {recentHistory.map((entry) => {
              const game = GameRegistry.get(entry.gameId);
              if (!game) return null;
              return (
                <div key={entry.id} className="flex items-center justify-between bg-surface-raised border border-border-default rounded-xl px-4 py-2.5 hover:bg-surface-overlay transition-colors">
                  <div className="flex items-center gap-3">
                    <span>{game.icon}</span>
                    <div>
                      <div className="text-xs font-medium">{game.title}</div>
                      <div className="text-[10px] text-text-muted">
                        {new Date(entry.playedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold" style={{ color: game.color }}>
                      {entry.score.toLocaleString()}
                    </span>
                    {entry.personalBest && <span className="text-xs">⭐</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
