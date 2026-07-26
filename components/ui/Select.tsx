import { forwardRef, type SelectHTMLAttributes } from 'react';
import { RiArrowDownSLine } from '@remixicon/react';

type SelectSize = 'lg' | 'md';

const sizeClasses: Record<SelectSize, string> = {
  lg: 'h-12 rounded-app-lg pl-4 pr-9 text-sm',
  md: 'h-10 rounded-app-md pl-3.5 pr-8 text-[13px]',
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  selectSize?: SelectSize;
  error?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { selectSize = 'md', error, className = '', children, ...props },
  ref,
) {
  return (
    <span className="relative inline-block w-full">
      <select
        ref={ref}
        className={`w-full appearance-none border bg-app-surface text-app-fg-1 outline-none transition disabled:cursor-not-allowed disabled:bg-app-surface-2 disabled:text-app-fg-3 ${
          sizeClasses[selectSize]
        } ${error ? 'border-app-border-error' : 'border-app-border focus:border-app-border-focus'} ${className}`}
        {...props}
      >
        {children}
      </select>
      <RiArrowDownSLine
        size={16}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-app-fg-3"
      />
    </span>
  );
});
