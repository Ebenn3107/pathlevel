import { useState, type FormEvent } from 'react';
import { Button, Input } from '../../../components/ui';
import type { TaskPriority, CreateTaskInput } from '../types';

interface TaskFormProps {
  initialValues?: CreateTaskInput;
  submitLabel: string;
  isLoading?: boolean;
  onSubmit: (input: CreateTaskInput) => void;
  onCancel: () => void;
}

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function TaskForm({
  initialValues,
  submitLabel,
  isLoading,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(initialValues?.priority ?? 'medium');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), description: description.trim() || undefined, priority });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        placeholder="Finish project report"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        autoFocus
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-white">Description</label>
        <textarea
          placeholder="Optional description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="rounded-lg border border-border bg-container px-3 py-2 text-sm text-white placeholder-muted transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-white">Priority</label>
        <div className="flex gap-2">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                priority === p.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-container text-muted hover:border-muted/40 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" type="button" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={isLoading || !title.trim()}>
          {isLoading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
