export interface Habit {
  id: string;
  name: string;
  description?: string | null;
  frequency: HabitFrequency;
  createdAt: string;
  updatedAt: string;
  progress: HabitProgress[];
}

export interface HabitProgress {
  id: string;
  habitId: string;
  completedAt: string;
  date: string;
}

export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

export interface HabitStats {
  totalCompletions: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
}

export interface CreateHabitInput {
  name: string;
  description?: string;
  frequency: HabitFrequency;
}

export interface UpdateHabitInput {
  name?: string;
  description?: string;
  frequency?: HabitFrequency;
}
