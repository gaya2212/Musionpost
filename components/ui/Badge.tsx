import type { ReactNode } from 'react';

type BadgeTone = 'green' | 'yellow' | 'blue' | 'gray' | 'red';

const toneClasses: Record<BadgeTone, string> = {
  green: 'bg-app-green/15 text-app-green',
  yellow: 'bg-app-yellow/15 text-app-yellow',
  blue: 'bg-app-primary-light text-app-primary',
  gray: 'bg-app-surface-2 text-app-fg-2',
  red: 'bg-app-red/15 text-app-red',
};

type BadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
};

export function Badge({ tone = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-app-pill px-2.5 py-1 text-[11px] font-semibold ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
