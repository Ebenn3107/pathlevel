import { useState } from 'react';
import { Card, Button, Modal, Spinner, Badge } from '../../../components/ui';
import { useUnitSessions } from '../hooks/useUnitSessions';
import { useSessionResources } from '../hooks/useSessionResources';
import { useSessionSummary } from '../hooks/useSessionSummary';
import {
  useCreateSession,
  useUpdateSession,
  useDeleteSession,
  useUnlinkResourceFromSession,
  useSaveSessionSummary,
  useDeleteSessionSummary,
} from '../hooks/useSessionMutations';
import SessionResourcePicker from './SessionResourcePicker';
import LearningForm from './LearningForm';
import type { CreateLearningInput, SessionWithSummary } from '../types';

function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** A single session card with finish, resources, and summary controls. */
function SessionCard({ session }: { session: SessionWithSummary }) {
  const updateMutation = useUpdateSession();
  const deleteMutation = useDeleteSession();
  const saveSummary = useSaveSessionSummary();
  const deleteSummary = useDeleteSessionSummary();
  const unlinkResource = useUnlinkResourceFromSession();
  const { data: linkedResources } = useSessionResources(session.id);
  const { data: summary } = useSessionSummary(session.id);

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState('');
  const [isWriting, setIsWriting] = useState(false);

  const isFinished = !!session.endedAt;
  const linkedIds = new Set((linkedResources ?? []).map((r) => r.id));

  const handleFinish = () => {
    updateMutation.mutate({ id: session.id, input: { endedAt: new Date().toISOString() } });
  };

  const handleSaveSummary = () => {
    if (!summaryDraft.trim()) return;
    saveSummary.mutate(
      { sessionId: session.id, content: summaryDraft.trim() },
      {
        // Close the write prompt on success; the saved Summary then appears via
        // the refetched useSessionSummary query.
        onSuccess: () => setIsWriting(false),
      },
    );
  };

  const handleSkipSummary = () => {
    deleteSummary.mutate(session.id, {
      onSuccess: () => setIsWriting(false),
    });
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-100">{session.title}</span>
            {isFinished ? (
              <Badge variant="secondary">Finished</Badge>
            ) : (
              <Badge variant="tertiary">In progress</Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">
            {formatDate(session.startedAt)} · {formatMinutes(session.duration)}
          </p>

          {/* Summary display */}
          {summary && (
            <p className="mt-2 rounded border border-border/60 bg-container/40 px-3 py-2 text-xs text-gray-300">
              {summary.content}
            </p>
          )}

          {/* Linked Resources */}
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
                Resources
              </span>
              <button
                onClick={() => setIsPickerOpen(true)}
                className="text-[10px] font-medium uppercase tracking-[0.08em] text-primary transition-colors hover:text-primary/80"
              >
                + Add Resource
              </button>
            </div>
            {!linkedResources || linkedResources.length === 0 ? (
              <p className="text-xs text-muted/70">No resources attached.</p>
            ) : (
              <div className="space-y-1.5">
                {linkedResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between gap-2 rounded border border-border/60 bg-container/40 px-2.5 py-1.5"
                  >
                    <span className="min-w-0 flex-1 truncate text-xs text-gray-300">
                      {resource.title}
                    </span>
                    <button
                      onClick={() => unlinkResource.mutate({ sessionId: session.id, resourceId: resource.id })}
                      aria-label={`Remove resource from session: ${resource.title}`}
                      title="Remove from session (Resource stays in Library)"
                      className="rounded p-0.5 text-muted transition-colors hover:text-red-400"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resource picker modal */}
          <SessionResourcePicker
            isOpen={isPickerOpen}
            sessionId={session.id}
            linkedResourceIds={linkedIds}
            onClose={() => setIsPickerOpen(false)}
          />

          {/* Post-finish summary prompt */}
          {isFinished && (
            <div className="mt-3 space-y-2">
              {isWriting ? (
                <>
                  <textarea
                    value={summaryDraft}
                    onChange={(e) => setSummaryDraft(e.target.value)}
                    rows={3}
                    placeholder="What did you learn?"
                    className="w-full rounded-lg border border-border bg-container px-3 py-2 text-sm text-white placeholder-muted transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveSummary} disabled={saveSummary.isPending || !summaryDraft.trim()}>
                      Save Summary
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsWriting(false);
                        setSummaryDraft(summary?.content ?? '');
                      }}
                    >
                      Cancel
                    </Button>
                    {!summary && (
                      <Button size="sm" variant="ghost" onClick={handleSkipSummary}>
                        Skip
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  {!summary && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSummaryDraft('');
                        setIsWriting(true);
                      }}
                    >
                      Write Summary
                    </Button>
                  )}
                  {summary && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSummaryDraft(summary.content);
                        setIsWriting(true);
                      }}
                    >
                      Edit Summary
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Finish / delete */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          {!isFinished && (
            <Button size="sm" onClick={handleFinish} disabled={updateMutation.isPending}>
              Finish
            </Button>
          )}
          <button
            onClick={() => deleteMutation.mutate(session.id)}
            aria-label="Delete session"
            title="Delete session"
            className="rounded p-1.5 text-muted transition-colors hover:bg-container hover:text-red-400"
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

/** Sessions section for a Unit (list, log, finish, summary). */
export default function SessionsSection({ unitId }: { unitId: string }) {
  const { data: sessions, isLoading, isError, error } = useUnitSessions(unitId);
  const createMutation = useCreateSession();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const header = (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Sessions</h2>
      <Button size="sm" onClick={() => setIsCreateOpen(true)}>
        Log Session
      </Button>
    </div>
  );

  let body: React.ReactNode;

  if (isLoading) {
    body = (
      <div className="flex items-center justify-center py-10">
        <Spinner size="lg" />
      </div>
    );
  } else if (isError) {
    body = (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center">
        <p className="text-sm text-red-400">{error instanceof Error ? error.message : 'Failed to load sessions.'}</p>
      </div>
    );
  } else if (!sessions || sessions.length === 0) {
    body = (
      <Card>
        <div className="py-6 text-center">
          <p className="text-sm text-gray-300">No sessions yet</p>
          <p className="mt-1 text-xs text-muted">Log a learning session to track your activity.</p>
        </div>
      </Card>
    );
  } else {
    body = (
      <div className="space-y-2">
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    );
  }

  return (
    <section>
      {header}
      {body}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Log Session">
        <LearningForm
          submitLabel="Log"
          isLoading={createMutation.isPending}
          onSubmit={(input: CreateLearningInput) => {
            createMutation.mutate(
              { ...input, learningUnitId: unitId },
              { onSuccess: () => setIsCreateOpen(false) },
            );
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>
    </section>
  );
}
