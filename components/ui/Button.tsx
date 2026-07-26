import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'gradient';
type ButtonSize = 'lg' | 'md';

const sizeClasses: Record<ButtonSize, string> = {
  lg: 'h-12 rounded-app-lg px-5 text-sm gap-2',
  md: 'h-10 rounded-app-md px-4 text-[13px] gap-1.5',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-app-primary text-white border border-transparent hover:bg-app-primary-hover disabled:bg-app-surface-2 disabled:text-app-fg-3 disabled:border-app-border',
  secondary:
    'bg-app-surface text-app-fg-1 border border-app-border hover:border-app-primary-light hover:bg-app-surface-2 disabled:bg-app-surface-2 disabled:text-app-fg-3 disabled:border-app-border',
  // Auth screens only (Create Account / Continue) — the rest of the app
  // platform uses the flat `primary` variant.
  gradient:
    'bg-app-btn-gradient text-white border border-transparent shadow-app-sm hover:brightness-105 disabled:bg-app-surface-2 disabled:bg-none disabled:text-app-fg-3 disabled:border-app-border',
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className = ''): string {
  return `inline-flex items-center justify-center font-semibold transition disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}
