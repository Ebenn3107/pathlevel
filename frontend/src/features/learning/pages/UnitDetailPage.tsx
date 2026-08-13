import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, Spinner, Button, ConfirmDialog, Badge } from '../../../components/ui';
import { useUnit } from '../hooks/useLearningUnits';
import { useUpdateUnit, useDeleteUnit, useUnlinkResourceFromUnit } from '../hooks/useLearningMutations';
import AddResourceModal from '../components/AddResourceModal';
import SessionsSection from '../components/SessionsSection';
import { UNIT_STATUS_LABELS } from '../types';

export default function UnitDetailPage() {
  const { unitId = '' } = useParams();
  const navigate = useNavigate();
  const { data: unit, isLoading, isError, error } = useUnit(unitId);

  const updateMutation = useUpdateUnit();
  const deleteMutation = useDeleteUnit();
  const unlinkResource = useUnlinkResourceFromUnit();

  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !unit) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
        <p className="text-sm text-red-400">
          {error instanceof Error ? error.message : 'Failed to load this unit.'}
        </p>
      </div>
    );
  }

  const setStatus = (status: 'IN_PROGRESS' | 'COMPLETED' | 'REOPENED') => {
    updateMutation.mutate({ id: unit.id, input: { status } });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link to="/learning" className="hover:text-white">
          Learning
        </Link>
        <span>/</span>
        <Link to={`/learning/goals/${unit.goalId}`} className="hover:text-white">
          Goal
        </Link>
        <span>/</span>
        <span className="text-gray-200">{unit.title}</span>
      </div>

      {/* Unit header */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-100">{unit.title}</h1>
              <Badge
                variant={
                  unit.status === 'COMPLETED'
                    ? 'secondary'
                    : unit.status === 'IN_PROGRESS'
                      ? 'tertiary'
                      : unit.status === 'REOPENED'
                        ? 'primary'
                        : 'muted'
                }
              >
                {UNIT_STATUS_LABELS[unit.status]}
              </Badge>
            </div>
            {unit.description && <p className="mt-2 text-sm text-muted">{unit.description}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setDeleting(true)}>
            Delete
          </Button>
        </div>

        {/* User-driven status controls */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {unit.status === 'NOT_STARTED' && (
            <Button size="sm" onClick={() => setStatus('IN_PROGRESS')}>
              Start Learning
            </Button>
          )}
          {(unit.status === 'NOT_STARTED' || unit.status === 'IN_PROGRESS' || unit.status === 'REOPENED') && (
            <Button size="sm" onClick={() => setStatus('COMPLETED')}>
              Mark Complete
            </Button>
          )}
          {unit.status === 'IN_PROGRESS' && (
            <Button variant="ghost" size="sm" onClick={() => setStatus('COMPLETED')}>
              Mark Complete
            </Button>
          )}
          {unit.status === 'COMPLETED' && (
            <Button variant="ghost" size="sm" onClick={() => setStatus('REOPENED')}>
              Reopen Unit
            </Button>
          )}
          {unit.status === 'REOPENED' && (
            <Button size="sm" onClick={() => setStatus('IN_PROGRESS')}>
              Resume Learning
            </Button>
          )}
        </div>
      </Card>

      {/* Resources */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Resources</h2>
          <Button size="sm" onClick={() => setIsAddResourceOpen(true)}>
            Add Resource
          </Button>
        </div>

        {unit.resources.length === 0 ? (
          <Card>
            <div className="py-6 text-center">
              <p className="text-sm text-gray-300">No resources yet</p>
              <p className="mt-1 text-xs text-muted">
                Add resources you want to use to study this unit.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {unit.resources.map((resource) => (
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
                    onClick={() => unlinkResource.mutate({ unitId: unit.id, resourceId: resource.id })}
                    className="rounded p-1.5 text-muted transition-colors hover:bg-container hover:text-red-400"
                    title="Remove from unit (Resource stays in Library)"
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

      {/* Sessions (Slice 4) */}
      <SessionsSection unitId={unit.id} />

      {/* Add resource modal */}
      <AddResourceModal
        isOpen={isAddResourceOpen}
        unitId={unit.id}
        onClose={() => setIsAddResourceOpen(false)}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deleting}
        title="Delete Unit"
        message={`Delete "${unit.title}"? Its resource links will be removed, but your Resources stay in the Library.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate(unit.id, {
            onSuccess: () => navigate(`/learning/goals/${unit.goalId}`),
          });
        }}
        onCancel={() => setDeleting(false)}
      />
    </div>
  );
}
