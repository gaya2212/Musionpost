import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

type SwitchProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  description?: ReactNode;
};

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, description, className = '', ...props },
  ref,
) {
  return (
    <label className="inline-flex cursor-pointer items-start justify-between gap-3 has-[:disabled]:cursor-not-allowed">
      {label ? (
        <span className="flex flex-col">
          <span className="text-[13px] font-medium text-app-fg-1">{label}</span>
          {description ? <span className="text-xs text-app-fg-2">{description}</span> : null}
        </span>
      ) : null}
      <span className="relative inline-flex h-6 w-10 shrink-0 items-center">
        <input
          ref={ref}
          type="checkbox"
          className={`peer h-full w-full appearance-none rounded-app-pill bg-app-border transition checked:bg-app-primary disabled:opacity-50 ${className}`}
          {...props}
        />
        <span className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-app-surface shadow-app-sm transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
});
