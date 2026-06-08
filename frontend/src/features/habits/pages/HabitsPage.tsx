import { useState } from 'react';
import { Card, Spinner, Button, Modal, ConfirmDialog } from '../../../components/ui';
import { useHabits } from '../hooks/useHabits';
import { useCreateHabit, useUpdateHabit, useDeleteHabit } from '../hooks/useHabitMutations';
import HabitForm from '../components/HabitForm';
import type { Habit, CreateHabitInput } from '../types';

export default function HabitsPage() {
  const { data: habits, isLoading, isError, error } = useHabits();

  const createMutation = useCreateHabit();
  const deleteMutation = useDeleteHabit();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);

  const updateMutation = useUpdateHabit(editingHabit?.id ?? '');

  /* ── Loading ────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-100">Habits</h1>
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
        <h1 className="text-2xl font-bold text-gray-100">Habits</h1>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">
            {error instanceof Error ? error.message : 'Failed to load habits.'}
          </p>
        </div>
      </div>
    );
  }

  /* ── Empty ──────────────────────────────────────── */
  if (!habits || habits.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-100">Habits</h1>
          <Button onClick={() => setIsCreateOpen(true)}>New Habit</Button>
        </div>
        <Card>
          <p className="text-gray-400">No habits yet. Start tracking your daily routines.</p>
        </Card>

        {/* Create modal */}
        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Habit">
          <HabitForm
            submitLabel="Create"
            isLoading={createMutation.isPending}
            onSubmit={(input: CreateHabitInput) => {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Habits</h1>
        <Button onClick={() => setIsCreateOpen(true)}>New Habit</Button>
      </div>

      {/* Habit cards */}
      <div className="space-y-3">
        {habits.map((habit) => (
          <Card key={habit.id}>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-100 truncate">{habit.title}</p>
                {habit.description && (
                  <p className="mt-0.5 text-sm text-muted truncate">{habit.description}</p>
                )}
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xs font-medium uppercase tracking-wider text-muted">
                  {habit.frequency}
                </span>
                <span className="text-xs text-muted whitespace-nowrap">
                  {habit.streak} day{habit.streak !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setEditingHabit(habit)}
                  className="rounded p-1.5 text-muted transition-colors hover:bg-container hover:text-white"
                  title="Edit"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeletingHabit(habit)}
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
        ))}
      </div>

      {/* Create modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Habit">
        <HabitForm
          submitLabel="Create"
          isLoading={createMutation.isPending}
          onSubmit={(input: CreateHabitInput) => {
            createMutation.mutate(input, {
              onSuccess: () => setIsCreateOpen(false),
            });
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        title="Edit Habit"
      >
        <HabitForm
          key={editingHabit?.id}
          initialValues={{
            title: editingHabit?.title ?? '',
            description: editingHabit?.description ?? undefined,
            frequency: editingHabit?.frequency,
          }}
          submitLabel="Save"
          isLoading={updateMutation.isPending}
          onSubmit={(input: CreateHabitInput) => {
            updateMutation.mutate(input, {
              onSuccess: () => setEditingHabit(null),
            });
          }}
          onCancel={() => setEditingHabit(null)}
        />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deletingHabit}
        title="Delete Habit"
        message={`Are you sure you want to delete "${deletingHabit?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deletingHabit) return;
          deleteMutation.mutate(deletingHabit.id, {
            onSuccess: () => setDeletingHabit(null),
          });
        }}
        onCancel={() => setDeletingHabit(null)}
      />
    </div>
  );
}
