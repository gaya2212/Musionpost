import type { ReactNode } from 'react';

type TagProps = {
  children: ReactNode;
  className?: string;
};

export function Tag({ children, className = '' }: TagProps) {
  return (
    <span
      className={`inline-flex items-center rounded-app-pill border border-app-border bg-app-surface-2 px-2.5 py-1 text-[11px] text-app-fg-2 ${className}`}
    >
      {children}
    </span>
  );
}
