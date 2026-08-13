import { Link } from 'react-router-dom';
import { Card, Spinner, Badge } from '../../../components/ui';
import { useDashboard } from '../hooks/useDashboard';
import { useGoals } from '../../learning/hooks/useLearningGoals';
import { useSessions } from '../../learning/hooks/useSessions';
import { useResources } from '../../resources/hooks/useResources';
import { useTasks } from '../../tasks/hooks/useTasks';
import { useHabits } from '../../habits/hooks/useHabits';
import { useMyAchievements } from '../../achievements/hooks/useAchievements';
import type { ResourceProgress } from '../../resources/types';

function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const PROGRESS_BADGE: Record<ResourceProgress, 'secondary' | 'tertiary' | 'muted'> = {
  NOT_STARTED: 'muted',
  IN_PROGRESS: 'tertiary',
  COMPLETED: 'secondary',
};

/**
 * Home — knowledge-first dashboard.
 *
 * Priority (approved):
 *   1. Continue Learning / Current Focus
 *   2. Relevant Knowledge / Resurfacing (deterministic, non-AI)
 *   3. Recent Learning Activity
 *   4. Tasks / Habits
 *   5. Achievements / XP
 *
 * All sections are composed from existing real APIs via TanStack Query. Errors
 * are contained per-section so one failure never collapses the whole page.
 */
export default function DashboardPage() {
  const { data: dash } = useDashboard();
  const { data: goals } = useGoals();
  const { data: sessions } = useSessions();
  const { data: resources } = useResources();
  const { data: tasks } = useTasks();
  const { data: habits } = useHabits();
  const { data: achievements } = useMyAchievements();

  /* ── Section 1: Continue Learning / Current Focus ────────────── */
  // Most advanced goal (by derived progress) with at least one unit.
  const activeGoal = goals
    ?.filter((g) => g.totalUnits > 0)
    .sort((a, b) => b.progressPercentage - a.progressPercentage)[0];

  const continueLearning = (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        Continue Learning
      </h2>
      {!activeGoal ? (
        <Card>
          <div className="py-6 text-center">
            <p className="text-sm text-gray-300">No active learning</p>
            <p className="mt-1 text-xs text-muted">
              <Link to="/learning" className="text-primary hover:underline">
                Start a Learning Goal
              </Link>{' '}
              to track your progress.
            </p>
          </div>
        </Card>
      ) : (
        <Link to="/learning">
          <Card className="hover:border-primary/40">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-gray-100">{activeGoal.title}</span>
                  <Badge variant="primary">
                    {activeGoal.completedUnits} / {activeGoal.totalUnits} units
                  </Badge>
                </div>
                <div className="mt-3 h-2 w-full max-w-md overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${activeGoal.progressPercentage}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted">{activeGoal.progressPercentage}% complete</p>
              </div>
            </div>
          </Card>
        </Link>
      )}
    </section>
  );

  /* ── Section 2: Relevant Knowledge (deterministic) ───────────── */
  // Recently updated Resources (non-AI resurfacing baseline).
  const recentResources = resources?.slice(0, 3) ?? [];

  const relevantKnowledge = (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        Recently Saved
      </h2>
      {recentResources.length === 0 ? (
        <Card>
          <div className="py-6 text-center">
            <p className="text-sm text-gray-300">No saved knowledge yet</p>
            <p className="mt-1 text-xs text-muted">
              <Link to="/library" className="text-primary hover:underline">
                Capture
              </Link>{' '}
              articles and links to build your Library.
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {recentResources.map((resource) => (
            <Link key={resource.id} to="/library">
              <Card className="p-4 hover:border-primary/40">
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-100">
                    {resource.title}
                  </span>
                  <Badge variant={PROGRESS_BADGE[resource.progress]}>
                    {resource.progress.replace('_', ' ')}
                  </Badge>
                </div>
                {resource.url && (
                  <p className="mt-0.5 truncate text-xs text-muted">{resource.url}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );

  /* ── Section 3: Recent Learning Activity ──────────────────────── */
  const recentSessions = sessions?.slice(0, 3) ?? [];

  const recentActivity = (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        Recent Learning Activity
      </h2>
      {recentSessions.length === 0 ? (
        <Card>
          <div className="py-6 text-center">
            <p className="text-sm text-gray-300">No recent learning activity</p>
            <p className="mt-1 text-xs text-muted">
              Log a session from{' '}
              <Link to="/learning" className="text-primary hover:underline">
                Learning
              </Link>{' '}
              to see it here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {recentSessions.map((session) => (
            <Link key={session.id} to="/learning">
              <Card className="p-4 hover:border-primary/40">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-100">
                    {session.title}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {timeAgo(session.startedAt)} · {formatMinutes(session.duration)}
                  </span>
                </div>
                {session.notes && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted">{session.notes}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );

  /* ── Section 4: Tasks / Habits (supporting) ──────────────────── */
  const pendingTasks = tasks?.filter((t) => !t.completed).length ?? 0;
  const activeHabits = habits?.length ?? 0;

  const supporting = (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        Today
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/tasks">
          <Card className="hover:border-tertiary/40">
            <p className="text-sm text-muted">Pending tasks</p>
            <p className="mt-1 text-2xl font-bold text-white">{pendingTasks}</p>
          </Card>
        </Link>
        <Link to="/habits">
          <Card className="hover:border-secondary/40">
            <p className="text-sm text-muted">Active habits</p>
            <p className="mt-1 text-2xl font-bold text-white">{activeHabits}</p>
          </Card>
        </Link>
      </div>
    </section>
  );

  /* ── Section 5: Achievements / XP (supporting) ───────────────── */
  const unlockedCount = achievements?.filter((a) => a.unlocked).length ?? 0;
  const recentAchievement = achievements?.find((a) => a.unlocked);

  const gamification = (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        Achievements
      </h2>
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">
              Level {dash?.level ?? 1} · {dash?.xp.toLocaleString() ?? 0} XP
            </p>
            <p className="mt-1 text-xs text-muted">
              {unlockedCount} achievement{unlockedCount !== 1 ? 's' : ''} unlocked
            </p>
          </div>
          {recentAchievement && (
            <div className="flex items-center gap-2 text-right">
              <span className="text-2xl">{recentAchievement.icon}</span>
              <div>
                <p className="text-xs font-medium text-gray-100">{recentAchievement.title}</p>
                <p className="text-[10px] text-muted">recent</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </section>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Home</h1>
        <p className="mt-1 text-sm text-muted">Continue where you left off.</p>
      </div>

      {/* Main content (left) + secondary (right), mirroring Stitch */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {continueLearning}
          {recentActivity}
        </div>
        <div className="space-y-8">
          {relevantKnowledge}
          {supporting}
          {gamification}
        </div>
      </div>

      {!dash && !goals && !sessions && !resources && !tasks && !habits && !achievements && (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}
    </div>
  );
}
