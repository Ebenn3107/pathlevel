import { useState } from 'react';
import { Card, Spinner, Button, Modal, ConfirmDialog } from '../../../components/ui';
import { useResources } from '../hooks/useResources';
import { useCreateResource, useUpdateResource, useDeleteResource } from '../hooks/useResourceMutations';
import CaptureForm from '../components/CaptureForm';
import ResourceForm from '../components/ResourceForm';
import AddToLearningModal from '../../learning/components/AddToLearningModal';
import ResourceCard from '../components/ResourceCard';
import type { Resource, CreateResourceInput, ResourceListParams, ResourceLibraryStatus } from '../types';

/* ── Library view tabs (mirror the Stitch filter tabs) ───────── */
type LibraryFilter = 'ALL' | ResourceLibraryStatus;
const FILTERS: { key: LibraryFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'INBOX', label: 'Inbox' },
  { key: 'SAVED', label: 'Saved' },
  { key: 'ARCHIVED', label: 'Archived' },
];

/* ── Library page ────────────────────────────────────────────── */
export default function LibraryPage() {
  const [filter, setFilter] = useState<LibraryFilter>('ALL');

  // Build the list params from the active filter tab.
  const listParams: ResourceListParams | undefined =
    filter === 'ALL' ? undefined : { libraryStatus: filter };

  const { data: resources, isLoading, isError, error } = useResources(listParams);

  const createMutation = useCreateResource();
  const deleteMutation = useDeleteResource();
  const updateMutation = useUpdateResource();

  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null);
  const [linkingResource, setLinkingResource] = useState<Resource | null>(null);

  const openCapture = () => {
    setCaptureError(null);
    setIsCaptureOpen(true);
  };

  /* ── Header ────────────────────────────────────── */
  const header = (
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-2xl font-bold text-gray-100">Library</h1>
      <Button onClick={openCapture}>
        <span className="mr-1.5">+</span> Capture
      </Button>
    </div>
  );

  /* ── Filter tabs (mirror Stitch) ───────────────── */
  const tabs = (
    <div className="flex items-center gap-1 border-b border-border">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => setFilter(f.key)}
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            filter === f.key
              ? 'border-primary text-white'
              : 'border-transparent text-muted hover:text-white'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );

  /* ── Body states ───────────────────────────────── */
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
          {error instanceof Error ? error.message : 'Failed to load your Library.'}
        </p>
      </div>
    );
  } else if (!resources || resources.length === 0) {
    const isInbox = filter === 'INBOX';
    body = (
      <Card>
        <div className="py-8 text-center">
          <p className="text-sm text-gray-300">
            {isInbox ? 'Your Inbox is empty' : 'Your Library is empty'}
          </p>
          <p className="mt-1 text-xs text-muted">
            {isInbox
              ? 'Captured items land here until you organize them.'
              : 'Capture articles, videos, and links to build your knowledge base.'}
          </p>
          <Button className="mt-4" onClick={openCapture}>
            {isInbox ? 'Capture something' : 'Add your first resource'}
          </Button>
        </div>
      </Card>
    );
  } else {
    body = (
      <div className="space-y-3">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onEdit={setEditingResource}
            onDelete={setDeletingResource}
            onAddToLearning={setLinkingResource}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}
      {tabs}
      {body}

      {/* Capture modal — creates with INBOX + NOT_STARTED default,
          then shows the new item in the Inbox */}
      <Modal isOpen={isCaptureOpen} onClose={() => setIsCaptureOpen(false)} title="Capture">
        <CaptureForm
          isLoading={createMutation.isPending}
          error={captureError}
          onSubmit={(input: CreateResourceInput) => {
            createMutation.mutate(input, {
              onSuccess: () => {
                setIsCaptureOpen(false);
                setFilter('INBOX');
              },
              onError: (err: unknown) => {
                setCaptureError(err instanceof Error ? err.message : 'Capture failed.');
              },
            });
          }}
          onCancel={() => setIsCaptureOpen(false)}
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
            tags: editingResource?.tags,
          }}
          submitLabel="Save"
          isLoading={updateMutation.isPending}
          onSubmit={(input: CreateResourceInput) => {
            updateMutation.mutate(
              { id: editingResource?.id ?? '', input },
              { onSuccess: () => setEditingResource(null) },
            );
          }}
          onCancel={() => setEditingResource(null)}
        />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deletingResource}
        title="Delete Resource"
        message={`Are you sure you want to delete "${deletingResource?.title}"? This cannot be undone.`}
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

      {/* Add to Learning */}
      <AddToLearningModal
        isOpen={!!linkingResource}
        resource={linkingResource}
        onClose={() => setLinkingResource(null)}
      />
    </div>
  );
}
