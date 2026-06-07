import { Card } from '../../../components/ui';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <h2 className="text-sm font-medium text-gray-400">XP</h2>
          <p className="mt-1 text-2xl font-bold text-gray-100">0</p>
        </Card>
        <Card>
          <h2 className="text-sm font-medium text-gray-400">Level</h2>
          <p className="mt-1 text-2xl font-bold text-gray-100">1</p>
        </Card>
        <Card>
          <h2 className="text-sm font-medium text-gray-400">Habits</h2>
          <p className="mt-1 text-2xl font-bold text-gray-100">0</p>
        </Card>
        <Card>
          <h2 className="text-sm font-medium text-gray-400">Tasks</h2>
          <p className="mt-1 text-2xl font-bold text-gray-100">0</p>
        </Card>
        <Card>
          <h2 className="text-sm font-medium text-gray-400">Sessions</h2>
          <p className="mt-1 text-2xl font-bold text-gray-100">0</p>
        </Card>
        <Card>
          <h2 className="text-sm font-medium text-gray-400">Resources</h2>
          <p className="mt-1 text-2xl font-bold text-gray-100">0</p>
        </Card>
      </div>
    </div>
  );
}
