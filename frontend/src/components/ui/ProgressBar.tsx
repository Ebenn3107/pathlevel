interface ProgressBarProps {
  value: number;
  maxValue: number;
  label?: string;
}

export default function ProgressBar({ value, maxValue, label }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(value, maxValue));
  const pct = maxValue > 0 ? Math.round((clampedValue / maxValue) * 100) : 0;

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">{label}</span>
          <span className="text-sm font-medium text-white">{pct}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-secondary transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
