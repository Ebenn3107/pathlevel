import type { Resource } from '../../resources/types';

export type LearningUnitStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REOPENED';

export interface LearningGoal {
  id: string;
  title: string;
  description: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Derived from Units (never stored). */
  completedUnits: number;
  totalUnits: number;
  progressPercentage: number;
}

export interface LearningUnit {
  id: string;
  goalId: string;
  title: string;
  description: string | null;
  status: LearningUnitStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearningGoalDetail extends LearningGoal {
  units: LearningUnit[];
  /** Goal-level / unassigned Resources. */
  resources: Resource[];
}

export interface LearningUnitDetail extends LearningUnit {
  resources: Resource[];
}

export interface CreateGoalInput {
  title: string;
  description?: string;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string | null;
}

export interface CreateUnitInput {
  title: string;
  description?: string;
}

export interface UpdateUnitInput {
  title?: string;
  description?: string | null;
  status?: LearningUnitStatus;
}

export const LEARNING_UNIT_STATUSES: LearningUnitStatus[] = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'REOPENED',
];

export const UNIT_STATUS_LABELS: Record<LearningUnitStatus, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  REOPENED: 'Reopened',
};

/* ── Legacy Learning Session types (Slice 4 extends them) ── */
export interface LearningSession {
  id: string;
  title: string;
  notes: string | null;
  duration: number;
  startedAt: string;
  endedAt: string | null;
  learningUnitId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearningSummary {
  id: string;
  sessionId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionWithSummary extends LearningSession {
  summary: LearningSummary | null;
}

export interface CreateLearningInput {
  title: string;
  notes?: string;
  duration: number;
  startedAt?: string;
  learningUnitId?: string;
}

export interface UpdateLearningInput {
  title?: string;
  notes?: string;
  duration?: number;
  endedAt?: string | null;
  learningUnitId?: string | null;
}
