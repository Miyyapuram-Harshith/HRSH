import { useEffect, useState, useRef, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import type { Achievement } from '../../types/engine';

const RARITY_COLORS: Record<string, string> = {
  common: '#a1a1aa',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export function AchievementToast() {
  const { recentAchievements, clearAchievements } = useGameStore();
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [current, setCurrent] = useState<Achievement | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add new achievements to queue
  useEffect(() => {
    if (recentAchievements.length > 0) {
      setQueue((q) => [...q, ...recentAchievements]);
      clearAchievements();
    }
  }, [recentAchievements, clearAchievements]);

  // Process queue
  const showNext = useCallback(() => {
    setQueue((q) => {
      if (q.length === 0) {
        setCurrent(null);
        return q;
      }
      const [next, ...rest] = q;
      setCurrent(next);
      setIsExiting(false);
      return rest;
    });
  }, []);

  useEffect(() => {
    if (!current && queue.length > 0) {
      showNext();
    }
  }, [current, queue.length, showNext]);

  // Auto-dismiss after 4s
  useEffect(() => {
    if (!current) return;
    timerRef.current = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setCurrent(null);
      }, 300);
    }, 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current]);

  if (!current) return null;

  const rarityColor = RARITY_COLORS[current.rarity] || RARITY_COLORS.common;

  return (
    <div
      className={`fixed top-4 right-4 z-[100] ${
        isExiting ? 'animate-[slide-out-right_0.3s_ease-in_forwards]' : 'animate-[slide-in-right_0.3s_ease-out]'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div
        className="bg-surface-raised border rounded-xl px-4 py-3 shadow-elevated min-w-[260px] max-w-[320px] overflow-hidden"
        style={{ borderColor: `${rarityColor}50` }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl animate-[bounce-in_0.5s_ease-out]">{current.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: rarityColor }}>
              Achievement Unlocked
            </div>
            <div className="text-sm font-medium text-text-primary truncate">{current.title}</div>
            <div className="text-xs text-text-muted truncate">{current.description}</div>
          </div>
        </div>
        {/* Auto-dismiss progress bar */}
        <div className="mt-2 -mx-4 -mb-3">
          <div className="h-0.5 rounded-b-xl" style={{ backgroundColor: rarityColor, animation: 'toast-progress 4s linear forwards' }} />
        </div>
      </div>
    </div>
  );
}
