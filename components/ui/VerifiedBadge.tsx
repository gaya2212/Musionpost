import { RiCheckboxCircleFill } from '@remixicon/react';

type VerifiedBadgeProps = {
  size?: number;
  className?: string;
};

export function VerifiedBadge({ size = 14, className = '' }: VerifiedBadgeProps) {
  return <RiCheckboxCircleFill size={size} className={`shrink-0 text-app-green ${className}`} />;
}
