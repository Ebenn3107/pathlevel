import { useState } from 'react';
import { Modal, Spinner, Button } from '../../../components/ui';
import { useResources } from '../../resources/hooks/useResources';
import { useLinkResourceToSession } from '../hooks/useSessionMutations';
import type { Resource } from '../../resources/types';

interface SessionResourcePickerProps {
  isOpen: boolean;
  sessionId: string;
  /** Currently linked resources — excluded from selection + shown as "linked". */
  linkedResourceIds: Set<string>;
  onClose: () => void;
}

/**
 * Pick existing Library Resources to attach to a Session (M:N).
 *
 * Uses the real Resource API for the authenticated user's Resources. Linking
 * creates a session_resources row only — it never duplicates or modifies the
 * Resource, and it never changes libraryStatus/progress. Already-linked
 * Resources are disabled to prevent duplicate links.
 */
export default function SessionResourcePicker({
  isOpen,
  sessionId,
  linkedResourceIds,
  onClose,
}: SessionResourcePickerProps) {
  const { data: resources, isLoading } = useResources();
  const linkMutation = useLinkResourceToSession();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isPending = linkMutation.isPending;

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleConfirm = () => {
    if (selectedIds.length === 0) return;
    // Link each selected resource (idempotent server-side); then close + reset.
    selectedIds.forEach((resourceId, i) => {
      linkMutation.mutate(
        { sessionId, resourceId },
        {
          onSuccess: i === selectedIds.length - 1 ? () => onClose() : undefined,
        },
      );
    });
    setSelectedIds([]);
  };

  const handleClose = () => {
    setSelectedIds([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Resources to Session">
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Spinner size="lg" />
        </div>
      ) : !resources || resources.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-300">No resources in your Library</p>
          <p className="mt-1 text-xs text-muted">
            Save resources to your Library first, then attach them here.
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {resources.map((resource) => {
              const alreadyLinked = linkedResourceIds.has(resource.id);
              const selected = selectedIds.includes(resource.id);
              return (
                <button
                  key={resource.id}
                  onClick={() => !alreadyLinked && handleToggle(resource.id)}
                  disabled={alreadyLinked || isPending}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors disabled:opacity-50 ${
                    selected
                      ? 'border-primary/50 bg-primary/10'
                      : alreadyLinked
                        ? 'border-border bg-container/40'
                        : 'border-border bg-container hover:border-primary/40'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-gray-100">{resource.title}</span>
                    {resource.url && (
                      <span className="block truncate text-xs text-muted">{resource.url}</span>
                    )}
                  </span>
                  <span className="text-xs font-medium">
                    {alreadyLinked ? (
                      <span className="text-muted">Linked</span>
                    ) : selected ? (
                      <span className="text-primary">Selected</span>
                    ) : (
                      <span className="text-muted">Add</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-muted">
              {selectedIds.length > 0
                ? `${selectedIds.length} selected`
                : 'Select resources to add'}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirm} disabled={isPending || selectedIds.length === 0}>
                {isPending ? 'Adding...' : 'Add Selected'}
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

export type { Resource };
