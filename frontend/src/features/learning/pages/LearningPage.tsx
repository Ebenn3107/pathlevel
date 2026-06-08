import { useState } from 'react';
import { Card, Spinner, Button, Modal, ConfirmDialog } from '../../../components/ui';
import { useSessions } from '../hooks/useSessions';
import { useCreateSession, useUpdateSession, useDeleteSession } from '../hooks/useSessionMutations';
import LearningForm from '../components/LearningForm';
import type { LearningSession, CreateLearningInput } from '../types';

function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

function LearningCard({
  session,
  onEdit,
  onDelete,
}: {
  session: LearningSession;
  onEdit: (s: LearningSession) => void;
  onDelete: (s: LearningSession) => void;
}) {
  const isComplete = !!session.endedAt;
  const date = new Date(session.startedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`font-medium truncate ${isComplete ? 'text-gray-100' : 'text-gray-100'}`}>
              {session.title}
            </p>
            {isComplete && (
              <span className="shrink-0 rounded bg-secondary/20 px-1.5 py-0.5 text-xs font-medium text-secondary">
                Complete
              </span>
            )}
          </div>
          {session.notes && (
            <p className="mt-0.5 text-sm text-muted truncate">{session.notes}</p>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-sm font-medium text-white">{formatMinutes(session.duration)}</p>
            <p className="text-xs text-muted">{date}</p>
          </div>

          <button
            onClick={() => onEdit(session)}
            className="rounded p-1.5 text-muted transition-colors hover:bg-container hover:text-white"
            title="Edit"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          <button
            onClick={() => onDelete(session)}
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

export default function LearningPage() {
  const { data: sessions, isLoading, isError, error } = useSessions();

  const createMutation = useCreateSession();
  const deleteMutation = useDeleteSession();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<LearningSession | null>(null);
  const [deletingSession, setDeletingSession] = useState<LearningSession | null>(null);

  const updateMutation = useUpdateSession(editingSession?.id ?? '');

  /* ── Loading ────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-100">Learning</h1>
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
        <h1 className="text-2xl font-bold text-gray-100">Learning</h1>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">
            {error instanceof Error ? error.message : 'Failed to load learning sessions.'}
          </p>
        </div>
      </div>
    );
  }

  /* ── Empty ──────────────────────────────────────── */
  if (!sessions || sessions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-100">Learning</h1>
          <Button onClick={() => setIsCreateOpen(true)}>New Session</Button>
        </div>
        <Card>
          <p className="text-gray-400">No sessions yet. Start a learning session to track your progress.</p>
        </Card>

        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Session">
          <LearningForm
            submitLabel="Create"
            isLoading={createMutation.isPending}
            onSubmit={(input: CreateLearningInput) => {
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
        <h1 className="text-2xl font-bold text-gray-100">Learning</h1>
        <Button onClick={() => setIsCreateOpen(true)}>New Session</Button>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <LearningCard
            key={session.id}
            session={session}
            onEdit={setEditingSession}
            onDelete={setDeletingSession}
          />
        ))}
      </div>

      {/* Create modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Session">
        <LearningForm
          submitLabel="Create"
          isLoading={createMutation.isPending}
          onSubmit={(input: CreateLearningInput) => {
            createMutation.mutate(input, {
              onSuccess: () => setIsCreateOpen(false),
            });
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={!!editingSession}
        onClose={() => setEditingSession(null)}
        title="Edit Session"
      >
        <LearningForm
          key={editingSession?.id}
          initialValues={{
            title: editingSession?.title ?? '',
            notes: editingSession?.notes ?? undefined,
            duration: editingSession?.duration ?? 30,
          }}
          submitLabel="Save"
          isLoading={updateMutation.isPending}
          onSubmit={(input: CreateLearningInput) => {
            updateMutation.mutate(input, {
              onSuccess: () => setEditingSession(null),
            });
          }}
          onCancel={() => setEditingSession(null)}
        />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deletingSession}
        title="Delete Session"
        message={`Are you sure you want to delete "${deletingSession?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deletingSession) return;
          deleteMutation.mutate(deletingSession.id, {
            onSuccess: () => setDeletingSession(null),
          });
        }}
        onCancel={() => setDeletingSession(null)}
      />
    </div>
  );
}
