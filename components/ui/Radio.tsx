import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

type RadioProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
};

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, className = '', ...props },
  ref,
) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 has-[:disabled]:cursor-not-allowed">
      <span className="relative inline-flex h-[19px] w-[19px] shrink-0">
        <input
          ref={ref}
          type="radio"
          className={`peer h-full w-full appearance-none rounded-full border border-app-border bg-app-surface transition checked:border-app-primary disabled:border-app-border disabled:bg-app-surface-2 ${className}`}
          {...props}
        />
        <span className="pointer-events-none absolute inset-0 m-auto hidden h-2.5 w-2.5 rounded-full bg-app-primary peer-checked:block" />
      </span>
      {label ? <span className="text-[13px] text-app-fg-1">{label}</span> : null}
    </label>
  );
});
