import { useState } from 'react';
import { Card, Spinner, Button, Modal, ConfirmDialog } from '../../../components/ui';
import { useResources } from '../hooks/useResources';
import { useCreateResource, useUpdateResource, useDeleteResource } from '../hooks/useResourceMutations';
import { useQueryClient } from '@tanstack/react-query';
import { resourceKeys } from '../query-keys';
import { updateResource } from '../api/resources';
import ResourceForm from '../components/ResourceForm';
import type { Resource, CreateResourceInput } from '../types';

function ResourceCard({
  resource,
  onEdit,
  onDelete,
}: {
  resource: Resource;
  onEdit: (r: Resource) => void;
  onDelete: (r: Resource) => void;
}) {
  const queryClient = useQueryClient();

  const handleToggle = async () => {
    await updateResource(resource.id, { completed: !resource.completed });
    queryClient.invalidateQueries({ queryKey: resourceKeys.lists() });
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={`font-medium truncate ${
                resource.completed ? 'line-through text-muted' : 'text-gray-100'
              }`}
            >
              {resource.title}
            </p>
            {resource.completed && (
              <span className="shrink-0 rounded bg-secondary/20 px-1.5 py-0.5 text-xs font-medium text-secondary">
                Done
              </span>
            )}
          </div>
          {resource.description && (
            <p
              className={`mt-0.5 text-sm truncate ${
                resource.completed ? 'text-muted/60' : 'text-muted'
              }`}
            >
              {resource.description}
            </p>
          )}
          {resource.url && (
            <div className="mt-1 flex items-center gap-1">
              <svg className="h-3 w-3 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-tertiary hover:underline truncate"
              >
                {resource.url}
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleToggle}
            className={`shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
              resource.completed
                ? 'bg-secondary border-secondary'
                : 'border-muted/40 hover:border-primary'
            }`}
            title={resource.completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {resource.completed && (
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <button
            onClick={() => onEdit(resource)}
            className="rounded p-1.5 text-muted transition-colors hover:bg-container hover:text-white"
            title="Edit"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          <button
            onClick={() => onDelete(resource)}
            className="rounded p-1.5 text-muted transition-colors hover:bg-container hover:text-red-400"
            title="Delete"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </Card>
  );
}

export default function ResourcesPage() {
  const { data: resources, isLoading, isError, error } = useResources();

  const createMutation = useCreateResource();
  const deleteMutation = useDeleteResource();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null);

  const updateMutation = useUpdateResource(editingResource?.id ?? '');

  /* ── Loading ────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-100">Resources</h1>
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  /* ── Error ──────────────────────────────────────── */
  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-100">Resources</h1>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">
            {error instanceof Error ? error.message : 'Failed to load resources.'}
          </p>
        </div>
      </div>
    );
  }

  /* ── Empty ──────────────────────────────────────── */
  if (!resources || resources.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-100">Resources</h1>
          <Button onClick={() => setIsCreateOpen(true)}>New Resource</Button>
        </div>
        <Card>
          <p className="text-gray-400">No resources yet. Save articles, videos, and links for later.</p>
        </Card>

        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Resource">
          <ResourceForm
            submitLabel="Create"
            isLoading={createMutation.isPending}
            onSubmit={(input: CreateResourceInput) => {
              createMutation.mutate(input, {
                onSuccess: () => setIsCreateOpen(false),
              });
            }}
            onCancel={() => setIsCreateOpen(false)}
          />
        </Modal>
      </div>
    );
  }

  /* ── List ───────────────────────────────────────── */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Resources</h1>
        <Button onClick={() => setIsCreateOpen(true)}>New Resource</Button>
      </div>

      <div className="space-y-3">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onEdit={setEditingResource}
            onDelete={setDeletingResource}
          />
        ))}
      </div>

      {/* Create modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Resource">
        <ResourceForm
          submitLabel="Create"
          isLoading={createMutation.isPending}
          onSubmit={(input: CreateResourceInput) => {
            createMutation.mutate(input, {
              onSuccess: () => setIsCreateOpen(false),
            });
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={!!editingResource}
        onClose={() => setEditingResource(null)}
        title="Edit Resource"
      >
        <ResourceForm
          key={editingResource?.id}
          initialValues={{
            title: editingResource?.title ?? '',
            url: editingResource?.url ?? undefined,
            description: editingResource?.description ?? undefined,
          }}
          submitLabel="Save"
          isLoading={updateMutation.isPending}
          onSubmit={(input: CreateResourceInput) => {
            updateMutation.mutate(input, {
              onSuccess: () => setEditingResource(null),
            });
          }}
          onCancel={() => setEditingResource(null)}
        />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deletingResource}
        title="Delete Resource"
        message={`Are you sure you want to delete "${deletingResource?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deletingResource) return;
          deleteMutation.mutate(deletingResource.id, {
            onSuccess: () => setDeletingResource(null),
          });
        }}
        onCancel={() => setDeletingResource(null)}
      />
    </div>
  );
}
