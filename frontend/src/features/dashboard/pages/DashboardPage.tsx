import { StatCard, Card, Spinner } from '../../../components/ui';
import { useDashboard } from '../hooks/useDashboard';

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
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
        <p className="text-red-400 text-sm">
          {error instanceof Error ? error.message : 'Failed to load dashboard data.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Hero ────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-container p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-muted uppercase">
              Level {data?.level ?? 1}
            </p>
            <p className="mt-2 text-6xl font-bold text-white tracking-tight">
              {data ? `${data.xp.toLocaleString()} XP` : '0 XP'}
            </p>
            <p className="mt-1 text-sm text-muted">
              {data && data.xpRemaining > 0
                ? `${data.xpRemaining} XP to reach Level ${data.level + 1}`
                : data && data.level >= 1
                  ? 'Maximum level reached!'
                  : 'Complete habits and tasks to earn XP and level up.'}
            </p>
          </div>
          {data && (
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{data.level}</p>
              <p className="text-xs text-muted">Current Level</p>
            </div>
          )}
        </div>
        <div className="mt-6 max-w-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted">Level Progress</span>
            <span className="text-xs text-muted">
              {data?.levelProgress ?? 0} / 100 XP
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(100, ((data?.levelProgress ?? 0) / 100) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Vital Signs ────────────────────────────── */}
      <Card>
        <h2 className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">
          Vital Signs
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Focus Time"
            value={data ? formatMinutes(data.todayLearningMinutes) : '0m'}
            accent="purple"
          />
          <StatCard title="Consistency" value="94%" accent="green" />
          <StatCard
            title="Tasks Done"
            value={data?.completedTasks ?? 0}
            accent="blue"
          />
        </div>
      </Card>

      {/* ── Quick Stats / Learning Activity ────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">
            Today's Learning
          </h2>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Time spent</span>
              <span className="text-lg font-semibold text-white">
                {data ? formatMinutes(data.todayLearningMinutes) : '0m'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Active habits</span>
              <span className="text-lg font-semibold text-white">{data?.activeHabits ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Pending tasks</span>
              <span className="text-lg font-semibold text-white">{data?.pendingTasks ?? 0}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">
            Quick Actions
          </h2>
          <div className="mt-5 space-y-4">
            <a
              href="/habits"
              className="flex items-center gap-3 rounded-lg border border-border bg-container/50 px-4 py-3 text-sm text-muted transition-colors hover:border-primary/40 hover:text-white"
            >
              <div className="h-2 w-2 rounded-full bg-secondary" />
              Track a new habit
            </a>
            <a
              href="/tasks"
              className="flex items-center gap-3 rounded-lg border border-border bg-container/50 px-4 py-3 text-sm text-muted transition-colors hover:border-primary/40 hover:text-white"
            >
              <div className="h-2 w-2 rounded-full bg-tertiary" />
              {data?.pendingTasks && data.pendingTasks > 0
                ? `${data.pendingTasks} pending task${data.pendingTasks !== 1 ? 's' : ''}`
                : 'Create a new task'}
            </a>
            <a
              href="/learning"
              className="flex items-center gap-3 rounded-lg border border-border bg-container/50 px-4 py-3 text-sm text-muted transition-colors hover:border-primary/40 hover:text-white"
            >
              <div className="h-2 w-2 rounded-full bg-primary" />
              Start a learning session
            </a>
          </div>
        </Card>
      </div>

      {/* ── XP Growth ──────────────────────────────── */}
      <Card>
        <h2 className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">
          Recent XP Activity
        </h2>
        {data?.recentActivity && data.recentActivity.length > 0 ? (
          <div className="mt-5 space-y-1">
            {data.recentActivity.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-container/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      entry.amount > 0 ? 'bg-secondary' : 'bg-red-400'
                    }`}
                  />
                  <span className="text-sm text-muted">{entry.reason}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${entry.amount > 0 ? 'text-secondary' : 'text-red-400'}`}>
                    {entry.amount > 0 ? '+' : ''}{entry.amount} XP
                  </span>
                  <span className="text-xs text-muted">{timeAgo(entry.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 flex items-center justify-center rounded-lg border border-dashed border-muted/30 py-10">
            <div className="text-center">
              <p className="text-sm text-muted">No activity yet</p>
              <p className="mt-1 text-xs text-muted/60">
                Complete habits, tasks, and learning sessions to earn XP.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* ── Statistics ─────────────────────────────── */}
      <div>
        <h2 className="mb-4 text-xs font-semibold tracking-[0.2em] text-muted uppercase">
          Statistics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="XP" value={data?.xp ?? 0} accent="green" />
          <StatCard title="Level" value={data?.level ?? 1} accent="purple" />
          <StatCard title="Habits" value={data?.activeHabits ?? 0} accent="blue" />
          <StatCard title="Tasks Pending" value={data?.pendingTasks ?? 0} accent="green" />
          <StatCard title="Tasks Done" value={data?.completedTasks ?? 0} accent="purple" />
          <StatCard title="Focus Today" value={data ? formatMinutes(data.todayLearningMinutes) : '0m'} accent="blue" />
        </div>
      </div>
    </div>
  );
}
