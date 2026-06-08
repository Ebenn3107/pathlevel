import { useState, type FormEvent } from 'react';
import { Button, Input } from '../../../components/ui';
import type { CreateLearningInput } from '../types';

interface LearningFormProps {
  initialValues?: CreateLearningInput;
  submitLabel: string;
  isLoading?: boolean;
  onSubmit: (input: CreateLearningInput) => void;
  onCancel: () => void;
}

export default function LearningForm({
  initialValues,
  submitLabel,
  isLoading,
  onSubmit,
  onCancel,
}: LearningFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [notes, setNotes] = useState(initialValues?.notes ?? '');
  const [duration, setDuration] = useState(initialValues?.duration ?? 30);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      notes: notes.trim() || undefined,
      duration,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        placeholder="React Fundamentals"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        autoFocus
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-white">Notes</label>
        <textarea
          placeholder="What did you learn?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="rounded-lg border border-border bg-container px-3 py-2 text-sm text-white placeholder-muted transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      <Input
        label="Duration (minutes)"
        type="number"
        min={1}
        max={1440}
        value={duration}
        onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
      />

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
