export interface Habit {
  id: string;
  title: string;
  description: string | null;
  frequency: HabitFrequency;
  streak: number;
  bestStreak: number;
  createdAt: string;
  updatedAt: string;
}

export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

export interface CreateHabitInput {
  title: string;
  description?: string;
  frequency?: HabitFrequency;
}

export interface UpdateHabitInput {
  title?: string;
  description?: string;
  frequency?: HabitFrequency;
}
