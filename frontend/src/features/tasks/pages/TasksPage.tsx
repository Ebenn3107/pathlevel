import { Card } from '../../../components/ui';

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Tasks</h1>
      <Card>
        <p className="text-gray-400">No tasks yet. Create your first task to get started.</p>
      </Card>
    </div>
  );
}
