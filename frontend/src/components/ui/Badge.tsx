import type { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'tertiary' | 'neutral' | 'muted';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-primary/15 text-primary border-primary/30',
  secondary: 'bg-secondary/15 text-secondary border-secondary/30',
  tertiary: 'bg-tertiary/15 text-tertiary border-tertiary/30',
  neutral: 'bg-container text-gray-200 border-border',
  muted: 'bg-transparent text-muted border-border/60',
};

/** Small status/label chip following the design system's mono-label style. */
export default function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
