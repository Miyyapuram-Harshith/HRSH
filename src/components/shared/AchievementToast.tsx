import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import type { Achievement } from '../../types/engine';

export function AchievementToast() {
  const { recentAchievements, clearAchievements } = useGameStore();
  const [visible, setVisible] = useState<Achievement | null>(null);

  useEffect(() => {
    if (recentAchievements.length > 0 && !visible) {
      setVisible(recentAchievements[0]);
      const timer = setTimeout(() => {
        setVisible(null);
        clearAchievements();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [recentAchievements, visible, clearAchievements]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] animate-[slide-up_0.3s_ease-out]">
      <div className="bg-surface-raised border border-border-accent rounded-xl px-4 py-3 shadow-elevated flex items-center gap-3 min-w-[240px]">
        <span className="text-2xl">{visible.icon}</span>
        <div>
          <div className="text-xs text-hrsh-accent font-semibold uppercase tracking-wide">Achievement Unlocked</div>
          <div className="text-sm font-medium text-text-primary">{visible.title}</div>
          <div className="text-xs text-text-muted">{visible.description}</div>
        </div>
      </div>
    </div>
  );
}
