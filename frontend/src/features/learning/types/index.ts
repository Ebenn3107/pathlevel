export interface LearningSession {
  id: string;
  title: string;
  notes: string | null;
  duration: number;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLearningInput {
  title: string;
  notes?: string;
  duration: number;
}

export interface UpdateLearningInput {
  title?: string;
  notes?: string;
  duration?: number;
  endedAt?: string | null;
}
