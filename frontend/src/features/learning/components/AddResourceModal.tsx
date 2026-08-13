import { Modal, Spinner } from '../../../components/ui';
import { useResources } from '../../resources/hooks/useResources';
import { useLinkResourceToGoal, useLinkResourceToUnit } from '../hooks/useLearningMutations';

interface AddResourceModalProps {
  isOpen: boolean;
  /** When provided, links resources to this goal (unassigned). */
  goalId?: string;
  /** When provided, links resources to this unit. */
  unitId?: string;
  onClose: () => void;
}

/**
 * Pick an existing Library resource to link to a Goal (unassigned) or a Unit.
 * Resources are never duplicated or moved — only a junction row is created.
 */
export default function AddResourceModal({ isOpen, goalId, unitId, onClose }: AddResourceModalProps) {
  const { data: resources, isLoading } = useResources({ libraryStatus: 'SAVED' });
  const linkToGoal = useLinkResourceToGoal();
  const linkToUnit = useLinkResourceToUnit();

  const isPending = linkToGoal.isPending || linkToUnit.isPending;

  const handleLink = (resourceId: string) => {
    const onSuccess = () => onClose();
    if (unitId) {
      linkToUnit.mutate({ unitId, resourceId }, { onSuccess });
    } else if (goalId) {
      linkToGoal.mutate({ goalId, resourceId }, { onSuccess });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Resource">
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Spinner size="lg" />
        </div>
      ) : !resources || resources.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-300">No saved resources yet</p>
          <p className="mt-1 text-xs text-muted">
            Save resources to your Library first, then link them here.
          </p>
        </div>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {resources.map((resource) => (
            <button
              key={resource.id}
              onClick={() => handleLink(resource.id)}
              disabled={isPending}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-container px-3 py-2 text-left transition-colors hover:border-primary/40 disabled:opacity-50"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-gray-100">{resource.title}</span>
                {resource.url && (
                  <span className="block truncate text-xs text-muted">{resource.url}</span>
                )}
              </span>
              <span className="text-xs font-medium text-primary">Link</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
