interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: 'green' | 'purple' | 'blue';
}

const accentClasses: Record<string, string> = {
  green: 'border-l-secondary',
  purple: 'border-l-primary',
  blue: 'border-l-tertiary',
};

export default function StatCard({ title, value, subtitle, accent }: StatCardProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-container p-6 ${
        accent ? `border-l-4 ${accentClasses[accent]}` : ''
      }`}
    >
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-1 text-3xl font-bold text-white">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
    </div>
  );
}
