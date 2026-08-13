import { useState, type FormEvent } from 'react';
import { Button, Input } from '../../../components/ui';
import type { CreateResourceInput } from '../types';

interface CaptureFormProps {
  isLoading?: boolean;
  error?: string | null;
  onSubmit: (input: CreateResourceInput) => void;
  onCancel: () => void;
}

/**
 * URL-first capture form (mirrors the Stitch Capture screen).
 *
 * A capture is valid with either a URL or a title — the product's "capture
 * first, organize later" rule. New captures are created with INBOX +
 * NOT_STARTED by the backend default; this form does not expose status or
 * progress controls during capture.
 */
export default function CaptureForm({
  isLoading,
  error,
  onSubmit,
  onCancel,
}: CaptureFormProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    const trimmedTitle = title.trim();

    if (!trimmedUrl && !trimmedTitle) {
      setLocalError('Enter a URL or a title to capture.');
      return;
    }
    setLocalError(null);

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onSubmit({
      title: trimmedTitle || 'Untitled',
      url: trimmedUrl || undefined,
      description: description.trim() || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
    });
  };

  const shownError = error ?? localError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* URL is the primary capture field (Stitch: "link") */}
      <Input
        label="Link"
        type="url"
        placeholder="https://example.com/article"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        autoFocus
      />

      <Input
        label="Title (optional if you have a link)"
        placeholder="How Docker Actually Works"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-white">Notes</label>
        <textarea
          placeholder="Why is this useful?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="rounded-lg border border-border bg-container px-3 py-2 text-sm text-white placeholder-muted transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      <Input
        label="Tags (comma-separated)"
        placeholder="Docker, Linux, Containers"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      {shownError && (
        <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {shownError}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" type="button" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={isLoading}>
          {isLoading ? 'Capturing...' : 'Save to Library'}
        </Button>
      </div>

      <p className="text-center text-xs text-muted">
        Saved items go to your Inbox.
      </p>
    </form>
  );
}
