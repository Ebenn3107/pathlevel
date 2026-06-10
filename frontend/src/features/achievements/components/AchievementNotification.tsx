import { useEffect, useState } from 'react';

interface NewAchievement {
  code: string;
  title: string;
  icon: string;
}

/**
 * A notification banner for newly unlocked achievements.
 * Pages can call `showAchievementNotification` to display it.
 */
let _showFn: ((achievement: NewAchievement) => void) | null = null;

export function showAchievementNotification(achievement: NewAchievement) {
  _showFn?.(achievement);
}

export function showAchievementNotifications(achievements: NewAchievement[]) {
  achievements.forEach((a, i) => {
    setTimeout(() => _showFn?.(a), i * 3000);
  });
}

export default function AchievementNotification() {
  const [achievement, setAchievement] = useState<NewAchievement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    _showFn = (a: NewAchievement) => {
      setAchievement(a);
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    };
    return () => {
      _showFn = null;
    };
  }, []);

  if (!visible || !achievement) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="flex items-center gap-3 rounded-xl border border-secondary/30 bg-container px-5 py-4 shadow-lg shadow-secondary/10">
        <span className="text-2xl">{achievement.icon}</span>
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-secondary uppercase">
            Achievement Unlocked!
          </p>
          <p className="text-sm font-semibold text-white">{achievement.title}</p>
        </div>
      </div>
    </div>
  );
}
