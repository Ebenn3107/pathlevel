import { Card } from '../../../components/ui';

export default function LearningPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Learning</h1>
      <Card>
        <p className="text-gray-400">No sessions yet. Start a learning session to track your progress.</p>
      </Card>
    </div>
  );
}
