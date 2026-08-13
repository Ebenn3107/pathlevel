import { useState } from 'react';
import { Modal, Button, Spinner } from '../../../components/ui';
import type { Resource } from '../../resources/types';
import { useGoals, useGoal } from '../hooks/useLearningGoals';
import { useLinkResourceToGoal, useLinkResourceToUnit } from '../hooks/useLearningMutations';
import { learningKeys } from '../query-keys';
import { useQueryClient } from '@tanstack/react-query';

interface AddToLearningModalProps {
  isOpen: boolean;
  resource: Resource | null;
  onClose: () => void;
}

/**
 * Knowledge-first "Add to Learning" quick path. The user picks a Goal and
 * optionally a Unit; the Resource is linked (never duplicated or moved).
 */
export default function AddToLearningModal({ isOpen, resource, onClose }: AddToLearningModalProps) {
  const queryClient = useQueryClient();
  const { data: goals, isLoading } = useGoals();

  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');

  const { data: goalDetail } = useGoal(selectedGoalId);
  const linkToGoal = useLinkResourceToGoal();
  const linkToUnit = useLinkResourceToUnit();

  const isPending = linkToGoal.isPending || linkToUnit.isPending;

  // Reset the picker when the modal opens for a new resource.
  const handleClose = () => {
    setSelectedGoalId('');
    setSelectedUnitId('');
    onClose();
  };

  const handleSubmit = () => {
    if (!resource) return;
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: learningKeys.all });
      handleClose();
    };
    if (selectedUnitId) {
      linkToUnit.mutate({ unitId: selectedUnitId, resourceId: resource.id }, { onSuccess });
    } else if (selectedGoalId) {
      linkToGoal.mutate({ goalId: selectedGoalId, resourceId: resource.id }, { onSuccess });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add to Learning">
      {resource && (
        <p className="mb-4 truncate text-sm text-muted">{resource.title}</p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : !goals || goals.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-300">No learning goals yet</p>
          <p className="mt-1 text-xs text-muted">Create a Learning Goal first, then add resources to it.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white">Goal</label>
            <select
              value={selectedGoalId}
              onChange={(e) => {
                setSelectedGoalId(e.target.value);
                setSelectedUnitId('');
              }}
              className="rounded-lg border border-border bg-container px-3 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select a goal...</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          {selectedGoalId && goalDetail && goalDetail.units.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white">Unit (optional — leave empty to add as an unassigned resource)</label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="rounded-lg border border-border bg-container px-3 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Goal-level / unassigned</option>
                {goalDetail.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="primary" type="button" onClick={handleSubmit} disabled={isPending || !selectedGoalId}>
              {isPending ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
