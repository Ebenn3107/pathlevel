import { Card } from '../../../components/ui';

export default function HabitsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Habits</h1>
      <Card>
        <p className="text-gray-400">No habits yet. Start tracking your daily routines.</p>
      </Card>
    </div>
  );
}
