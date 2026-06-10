export interface Achievement {
  code: string;
  title: string;
  description: string;
  icon: string;
}

export interface UserAchievement extends Achievement {
  id: string;
  unlocked: boolean;
  unlockedAt: string | null;
}
