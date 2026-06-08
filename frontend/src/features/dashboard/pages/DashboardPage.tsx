import { StatCard, ProgressBar, Card, Spinner } from '../../../components/ui';
import { useDashboard } from '../hooks/useDashboard';

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
      {/* Hero */}
      <div className="rounded-lg border border-border bg-container p-6">
        <p className="text-xs font-medium tracking-[0.2em] text-muted uppercase">
          Level {data?.level ?? 1}
        </p>
        <p className="mt-2 text-6xl font-bold text-white tracking-tight">
          {data ? `${data.xp.toLocaleString()} XP` : '0 XP'}
        </p>
        <p className="mt-2 text-sm text-muted">Complete habits and tasks to earn XP and level up.</p>
        <div className="mt-6 max-w-md">
          <ProgressBar value={data?.xp ?? 0} maxValue={100} label="Level Progress" />
        </div>
      </div>

      {/* Vital Signs */}
      <Card>
        <h2 className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">
          Vital Signs
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <StatCard title="Focus Time" value="142H" accent="purple" />
          <StatCard title="Consistency" value="94%" accent="green" />
          <StatCard title="Tasks Done" value={128} accent="blue" />
        </div>
      </Card>

      {/* Current Learning / Priority Tasks */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">
            Current Learning
          </h2>
          <div className="mt-5 space-y-5">
            <ProgressBar value={72} maxValue={100} label="Frontend Engineering" />
            <ProgressBar value={40} maxValue={100} label="Backend Engineering" />
            <ProgressBar value={25} maxValue={100} label="System Design" />
          </div>
        </Card>

        <Card>
          <h2 className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">
            Priority Tasks
          </h2>
          <ul className="mt-5 space-y-3">
            {['Build Auth API', 'Setup Prisma', 'Create Habit CRUD', 'Design XP System'].map((task) => (
              <li key={task} className="flex items-center gap-3">
                <div className="h-4 w-4 rounded border border-muted/40" />
                <span className="text-sm text-muted">{task}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* XP Growth */}
      <Card>
        <h2 className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">
          XP Growth
        </h2>
        <div className="mt-5 flex items-center justify-center rounded-lg border border-dashed border-muted/30 py-16">
          <p className="text-sm text-muted">Analytics chart coming soon</p>
        </div>
      </Card>

      {/* Statistics */}
      <div>
        <h2 className="mb-4 text-xs font-semibold tracking-[0.2em] text-muted uppercase">
          Statistics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="XP" value={data?.xp ?? 0} accent="green" />
          <StatCard title="Level" value={data?.level ?? 1} accent="purple" />
          <StatCard title="Habits" value={data?.activeHabits ?? 0} accent="blue" />
          <StatCard title="Tasks" value={data?.pendingTasks ?? 0} accent="green" />
          <StatCard title="Sessions" value={data?.todayLearningMinutes ?? 0} accent="purple" />
          <StatCard title="Resources" value={0} accent="blue" />
        </div>
      </div>
    </div>
  );
}
