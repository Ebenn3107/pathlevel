import { useState } from 'react';
import { Card, Spinner, Button, Modal, ConfirmDialog } from '../../../components/ui';
import { useTasks } from '../hooks/useTasks';
import { useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTaskMutations';
import { updateTask } from '../api/tasks';
import { useQueryClient } from '@tanstack/react-query';
import { taskKeys } from '../query-keys';
import TaskForm from '../components/TaskForm';
import type { Task, CreateTaskInput } from '../types';

const priorityStyles: Record<string, string> = {
  low: 'border-secondary/30 text-secondary',
  medium: 'border-yellow-500/30 text-yellow-400',
  high: 'border-red-500/30 text-red-400',
};

function TaskCard({
  task,
  onEdit,
  onDelete,
}: {
  task: Task;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
}) {
  const queryClient = useQueryClient();

  const handleToggle = async () => {
    await updateTask(task.id, { completed: !task.completed });
    queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
  };

  const isCompleted = task.completed;

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        {/* Left: checkbox + content */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={handleToggle}
            className={`shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
              isCompleted
                ? 'bg-secondary border-secondary'
                : 'border-muted/40 hover:border-primary'
            }`}
          >
            {isCompleted && (
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="min-w-0 flex-1">
            <p
              className={`font-medium truncate ${
                isCompleted ? 'line-through text-muted' : 'text-gray-100'
              }`}
            >
              {task.title}
            </p>
            {task.description && (
              <p
                className={`mt-0.5 text-sm truncate ${
                  isCompleted ? 'text-muted/60' : 'text-muted'
                }`}
              >
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Right: priority + actions */}
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wider ${
              priorityStyles[task.priority] || 'border-border text-muted'
            }`}
          >
            {task.priority}
          </span>

          <button
            onClick={() => onEdit(task)}
            className="rounded p-1.5 text-muted transition-colors hover:bg-container hover:text-white"
            title="Edit"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          <button
            onClick={() => onDelete(task)}
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

export default function TasksPage() {
  const { data: tasks, isLoading, isError, error } = useTasks();

  const createMutation = useCreateTask();
  const deleteMutation = useDeleteTask();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const updateMutation = useUpdateTask(editingTask?.id ?? '');

  /* ── Loading ────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-100">Tasks</h1>
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
        <h1 className="text-2xl font-bold text-gray-100">Tasks</h1>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">
            {error instanceof Error ? error.message : 'Failed to load tasks.'}
          </p>
        </div>
      </div>
    );
  }

  /* ── Empty ──────────────────────────────────────── */
  if (!tasks || tasks.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-100">Tasks</h1>
          <Button onClick={() => setIsCreateOpen(true)}>New Task</Button>
        </div>
        <Card>
          <p className="text-gray-400">No tasks yet. Create your first task to get started.</p>
        </Card>

        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Task">
          <TaskForm
            submitLabel="Create"
            isLoading={createMutation.isPending}
            onSubmit={(input: CreateTaskInput) => {
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
        <h1 className="text-2xl font-bold text-gray-100">Tasks</h1>
        <Button onClick={() => setIsCreateOpen(true)}>New Task</Button>
      </div>

      {/* Task cards */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={setEditingTask}
            onDelete={setDeletingTask}
          />
        ))}
      </div>

      {/* Create modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Task">
        <TaskForm
          submitLabel="Create"
          isLoading={createMutation.isPending}
          onSubmit={(input: CreateTaskInput) => {
            createMutation.mutate(input, {
              onSuccess: () => setIsCreateOpen(false),
            });
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Edit Task"
      >
        <TaskForm
          key={editingTask?.id}
          initialValues={{
            title: editingTask?.title ?? '',
            description: editingTask?.description ?? undefined,
            priority: editingTask?.priority,
          }}
          submitLabel="Save"
          isLoading={updateMutation.isPending}
          onSubmit={(input: CreateTaskInput) => {
            updateMutation.mutate(input, {
              onSuccess: () => setEditingTask(null),
            });
          }}
          onCancel={() => setEditingTask(null)}
        />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deletingTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${deletingTask?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deletingTask) return;
          deleteMutation.mutate(deletingTask.id, {
            onSuccess: () => setDeletingTask(null),
          });
        }}
        onCancel={() => setDeletingTask(null)}
      />
    </div>
  );
}
