import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { RiCheckLine } from '@remixicon/react';

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className = '', ...props },
  ref,
) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 has-[:disabled]:cursor-not-allowed">
      <span className="relative inline-flex h-[19px] w-[19px] shrink-0">
        <input
          ref={ref}
          type="checkbox"
          className={`peer h-full w-full appearance-none rounded-[4.4px] border border-app-border bg-app-surface transition checked:border-app-primary checked:bg-app-primary disabled:border-app-border disabled:bg-app-surface-2 ${className}`}
          {...props}
        />
        <RiCheckLine
          size={13}
          className="pointer-events-none absolute inset-0 m-auto hidden text-white peer-checked:block"
        />
      </span>
      {label ? <span className="text-[13px] text-app-fg-1">{label}</span> : null}
    </label>
  );
});
