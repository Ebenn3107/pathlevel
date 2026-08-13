import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, Spinner, Button, Modal, ConfirmDialog, Badge } from '../../../components/ui';
import { useGoal } from '../hooks/useLearningGoals';
import {
  useArchiveGoal,
  useRestoreGoal,
  useDeleteGoal,
  useCreateUnit,
  useUpdateUnit,
  useUnlinkResourceFromGoal,
} from '../hooks/useLearningMutations';
import UnitForm from '../components/UnitForm';
import AddResourceModal from '../components/AddResourceModal';
import { UNIT_STATUS_LABELS, type CreateUnitInput, type LearningUnit, type LearningUnitStatus } from '../types';

const STATUS_VARIANT: Record<LearningUnitStatus, 'primary' | 'secondary' | 'tertiary' | 'neutral' | 'muted'> = {
  NOT_STARTED: 'muted',
  IN_PROGRESS: 'tertiary',
  COMPLETED: 'secondary',
  REOPENED: 'primary',
};

export default function GoalDetailPage() {
  const { goalId = '' } = useParams();
  const navigate = useNavigate();
  const { data: goal, isLoading, isError, error } = useGoal(goalId);

  const archiveMutation = useArchiveGoal();
  const restoreMutation = useRestoreGoal();
  const deleteMutation = useDeleteGoal();
  const createUnitMutation = useCreateUnit();
  const updateUnitMutation = useUpdateUnit();
  const unlinkResource = useUnlinkResourceFromGoal();

  const [isCreateUnitOpen, setIsCreateUnitOpen] = useState(false);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [deletingGoal, setDeletingGoal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !goal) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
        <p className="text-sm text-red-400">
          {error instanceof Error ? error.message : 'Failed to load this goal.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link to="/learning" className="hover:text-white">
          Learning
        </Link>
        <span>/</span>
        <span className="text-gray-200">{goal.title}</span>
      </div>

      {/* Goal header */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-100">{goal.title}</h1>
              {goal.archivedAt && <Badge variant="muted">Archived</Badge>}
              <Badge variant="neutral">
                {goal.completedUnits} / {goal.totalUnits} units
              </Badge>
            </div>
            {goal.description && <p className="mt-2 text-sm text-muted">{goal.description}</p>}
            <div className="mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${goal.progressPercentage}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted">{goal.progressPercentage}% complete</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {goal.archivedAt ? (
              <Button variant="secondary" size="sm" onClick={() => restoreMutation.mutate(goal.id)}>
                Restore
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => archiveMutation.mutate(goal.id)}>
                Archive
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setDeletingGoal(true)}>
              Delete
            </Button>
          </div>
        </div>
      </Card>

      {/* Units */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Units</h2>
          <Button size="sm" onClick={() => setIsCreateUnitOpen(true)}>
            Add Unit
          </Button>
        </div>

        {goal.units.length === 0 ? (
          <Card>
            <div className="py-6 text-center">
              <p className="text-sm text-gray-300">No units yet</p>
              <p className="mt-1 text-xs text-muted">
                Break this goal into units — you can add them gradually.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {goal.units.map((unit) => (
              <UnitRow
                key={unit.id}
                unit={unit}
                onOpen={() => navigate(`/learning/units/${unit.id}`)}
                onToggleComplete={() =>
                  updateUnitMutation.mutate({
                    id: unit.id,
                    input: { status: unit.status === 'COMPLETED' ? 'REOPENED' : 'COMPLETED' },
                  })
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Unassigned Resources */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Unassigned Resources
          </h2>
          <Button size="sm" onClick={() => setIsAddResourceOpen(true)}>
            Add Resource
          </Button>
        </div>

        {goal.resources.length === 0 ? (
          <Card>
            <div className="py-6 text-center">
              <p className="text-sm text-gray-300">No unassigned resources</p>
              <p className="mt-1 text-xs text-muted">
                Link resources to this goal before organizing them into units.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {goal.resources.map((resource) => (
              <Card key={resource.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-100">{resource.title}</p>
                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-xs text-tertiary hover:underline"
                      >
                        {resource.url}
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => unlinkResource.mutate({ goalId: goal.id, resourceId: resource.id })}
                    className="rounded p-1.5 text-muted transition-colors hover:bg-container hover:text-red-400"
                    title="Remove from goal (Resource stays in Library)"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Create unit modal */}
      <Modal isOpen={isCreateUnitOpen} onClose={() => setIsCreateUnitOpen(false)} title="New Unit">
        <UnitForm
          submitLabel="Create"
          isLoading={createUnitMutation.isPending}
          onSubmit={(input: CreateUnitInput) => {
            createUnitMutation.mutate(
              { goalId: goal.id, input },
              { onSuccess: () => setIsCreateUnitOpen(false) },
            );
          }}
          onCancel={() => setIsCreateUnitOpen(false)}
        />
      </Modal>

      {/* Add resource modal */}
      <AddResourceModal
        isOpen={isAddResourceOpen}
        goalId={goal.id}
        onClose={() => setIsAddResourceOpen(false)}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deletingGoal}
        title="Delete Goal"
        message={`Delete "${goal.title}"? Its units and resource links will be removed, but your Resources stay in the Library.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate(goal.id, {
            onSuccess: () => navigate('/learning'),
          });
        }}
        onCancel={() => setDeletingGoal(false)}
      />
    </div>
  );
}

function UnitRow({
  unit,
  onOpen,
  onToggleComplete,
}: {
  unit: LearningUnit;
  onOpen: () => void;
  onToggleComplete: () => void;
}) {
  const isComplete = unit.status === 'COMPLETED';
  return (
    <Card className="group p-4 hover:border-primary/40">
      <div className="flex items-center justify-between gap-3">
        {/* Clickable → navigates to Unit Detail (obvious affordance) */}
        <button
          onClick={onOpen}
          aria-label={`Open unit: ${unit.title}`}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-gray-100">{unit.title}</span>
              <Badge variant={STATUS_VARIANT[unit.status] ?? 'neutral'}>
                {UNIT_STATUS_LABELS[unit.status]}
              </Badge>
            </div>
            {unit.description && <p className="mt-0.5 truncate text-xs text-muted">{unit.description}</p>}
          </div>
          <svg className="h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {/* Completion/reopen is a separate action, not navigation */}
        <Button
          variant={isComplete ? 'ghost' : 'primary'}
          size="sm"
          onClick={onToggleComplete}
          aria-label={isComplete ? 'Reopen unit' : 'Mark unit complete'}
        >
          {isComplete ? 'Reopen' : 'Mark Complete'}
        </Button>
      </div>
    </Card>
  );
}
