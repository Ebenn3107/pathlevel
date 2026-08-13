import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Spinner, Button, Modal, ConfirmDialog, Badge } from '../../../components/ui';
import { useGoals } from '../hooks/useLearningGoals';
import { useCreateGoal, useArchiveGoal, useRestoreGoal, useDeleteGoal } from '../hooks/useLearningMutations';
import GoalForm from '../components/GoalForm';
import type { CreateGoalInput, LearningGoal } from '../types';

export default function LearningPage() {
  const navigate = useNavigate();
  const { data: goals, isLoading, isError, error } = useGoals();

  const createMutation = useCreateGoal();
  const archiveMutation = useArchiveGoal();
  const restoreMutation = useRestoreGoal();
  const deleteMutation = useDeleteGoal();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingGoal, setDeletingGoal] = useState<LearningGoal | null>(null);

  const header = (
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-2xl font-bold text-gray-100">Learning</h1>
      <Button onClick={() => setIsCreateOpen(true)}>New Goal</Button>
    </div>
  );

  let body: React.ReactNode;

  if (isLoading) {
    body = (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  } else if (isError) {
    body = (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
        <p className="text-sm text-red-400">
          {error instanceof Error ? error.message : 'Failed to load your Learning goals.'}
        </p>
      </div>
    );
  } else if (!goals || goals.length === 0) {
    body = (
      <Card>
        <div className="py-8 text-center">
          <p className="text-sm text-gray-300">No learning goals yet</p>
          <p className="mt-1 text-xs text-muted">
            Create a goal for something you want to learn — you can structure it with Units later.
          </p>
          <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
            Create your first goal
          </Button>
        </div>
      </Card>
    );
  } else {
    body = (
      <div className="space-y-3">
        {goals.map((goal) => (
          <Card key={goal.id} className="group hover:border-primary/40">
            <div className="flex items-start justify-between gap-4">
              {/* Clickable → navigates to Goal Detail (obvious affordance) */}
              <button
                onClick={() => navigate(`/learning/goals/${goal.id}`)}
                aria-label={`Open goal: ${goal.title}`}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-gray-100">{goal.title}</span>
                  {goal.archivedAt && <Badge variant="muted">Archived</Badge>}
                  <Badge variant="neutral">
                    {goal.completedUnits} / {goal.totalUnits} units
                  </Badge>
                </div>
                {goal.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{goal.description}</p>
                )}
                {/* Derived progress bar */}
                <div className="mt-3 h-2 w-full max-w-md overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${goal.progressPercentage}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted">{goal.progressPercentage}% complete</p>
                {/* Explicit navigation affordance on the clickable region */}
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.08em] text-primary transition-colors group-hover:text-primary/80">
                  Open goal
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>

              <div className="flex shrink-0 items-center gap-1.5">
                {goal.archivedAt ? (
                  <button
                    onClick={() => restoreMutation.mutate(goal.id)}
                    aria-label="Restore goal"
                    title="Restore goal"
                    className="rounded p-1.5 text-muted transition-colors hover:bg-container hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h13a5 5 0 010 10H9M3 10l4-4m-4 4l4 4" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => archiveMutation.mutate(goal.id)}
                    aria-label="Archive goal"
                    title="Archive goal"
                    className="rounded p-1.5 text-muted transition-colors hover:bg-container hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => setDeletingGoal(goal)}
                  aria-label="Delete goal"
                  title="Delete goal"
                  className="rounded p-1.5 text-muted transition-colors hover:bg-container hover:text-red-400"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link to="/learning" className="hover:text-white">
          Learning
        </Link>
      </div>
      {header}
      {body}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Goal">
        <GoalForm
          submitLabel="Create"
          isLoading={createMutation.isPending}
          onSubmit={(input: CreateGoalInput) => {
            createMutation.mutate(input, {
              onSuccess: () => setIsCreateOpen(false),
            });
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingGoal}
        title="Delete Goal"
        message={`Delete "${deletingGoal?.title}"? Its units and resource links will be removed, but your Resources stay in the Library.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deletingGoal) return;
          deleteMutation.mutate(deletingGoal.id, {
            onSuccess: () => setDeletingGoal(null),
          });
        }}
        onCancel={() => setDeletingGoal(null)}
      />
    </div>
  );
}
