import { useState, type FormEvent } from 'react';
import { Button, Input } from '../../../components/ui';
import type { CreateGoalInput } from '../types';

interface GoalFormProps {
  initialValues?: CreateGoalInput;
  submitLabel: string;
  isLoading?: boolean;
  onSubmit: (input: CreateGoalInput) => void;
  onCancel: () => void;
}

export default function GoalForm({
  initialValues,
  submitLabel,
  isLoading,
  onSubmit,
  onCancel,
}: GoalFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        placeholder="Backend Development"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        autoFocus
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-white">Description</label>
        <textarea
          placeholder="What do you want to learn?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="rounded-lg border border-border bg-container px-3 py-2 text-sm text-white placeholder-muted transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
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
