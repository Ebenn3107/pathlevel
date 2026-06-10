import { Card, Spinner } from '../../../components/ui';
import { useMyAchievements } from '../hooks/useAchievements';

export default function AchievementsPage() {
  const { data: achievements, isLoading, isError, error } = useMyAchievements();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-100">Achievements</h1>
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-100">Achievements</h1>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">
            {error instanceof Error ? error.message : 'Failed to load achievements.'}
          </p>
        </div>
      </div>
    );
  }

  const unlocked = achievements?.filter((a) => a.unlocked) ?? [];
  const locked = achievements?.filter((a) => !a.unlocked) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Achievements</h1>
        <span className="text-sm text-muted">
          {unlocked.length} / {achievements?.length ?? 0} unlocked
        </span>
      </div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <section>
          <h2 className="mb-4 text-xs font-semibold tracking-[0.2em] text-secondary uppercase">
            Unlocked
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unlocked.map((achievement) => (
              <Card key={achievement.code}>
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{achievement.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-100">{achievement.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{achievement.description}</p>
                    {achievement.unlockedAt && (
                      <p className="mt-1 text-xs text-secondary">
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <section>
          <h2 className="mb-4 text-xs font-semibold tracking-[0.2em] text-muted uppercase">
            Locked
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locked.map((achievement) => (
              <Card key={achievement.code}>
                <div className="flex items-start gap-4 opacity-50">
                  <span className="text-3xl grayscale">{achievement.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-100">{achievement.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{achievement.description}</p>
                    <p className="mt-1 text-xs text-muted/60">
                      {getHint(achievement.code)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {(!achievements || achievements.length === 0) && (
        <Card>
          <p className="text-gray-400">No achievements available.</p>
        </Card>
      )}
    </div>
  );
}

function getHint(code: string): string {
  const hints: Record<string, string> = {
    XP_100: 'Earn 100 total XP',
    XP_500: 'Earn 500 total XP',
    XP_1000: 'Earn 1,000 total XP',
    FIRST_HABIT: 'Complete your first habit',
    HABIT_10: 'Complete 10 habits',
    HABIT_50: 'Complete 50 habits',
    STREAK_7: 'Reach a 7-day streak',
    STREAK_30: 'Reach a 30-day streak',
    FIRST_TASK: 'Complete your first task',
    TASK_25: 'Complete 25 tasks',
    FIRST_SESSION: 'Complete your first learning session',
    SESSION_10: 'Complete 10 learning sessions',
  };
  return hints[code] ?? 'Keep going to unlock this achievement';
}
