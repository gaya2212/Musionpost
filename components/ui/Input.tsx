import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

type InputSize = 'lg' | 'md';

const sizeClasses: Record<InputSize, string> = {
  lg: 'h-12 rounded-app-lg px-4 text-sm',
  md: 'h-10 rounded-app-md px-3.5 text-[13px]',
};

const baseClasses =
  'w-full border bg-app-surface text-app-fg-1 outline-none transition placeholder:text-app-fg-3 disabled:cursor-not-allowed disabled:bg-app-surface-2 disabled:text-app-fg-3';

function stateClasses(hasError?: boolean) {
  return hasError
    ? 'border-app-border-error focus:border-app-border-error'
    : 'border-app-border focus:border-app-border-focus';
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  inputSize?: InputSize;
  error?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { inputSize = 'md', error, className = '', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`${baseClasses} ${sizeClasses[inputSize]} ${stateClasses(error)} ${className}`}
      {...props}
    />
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error, className = '', ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={`${baseClasses} min-h-24 rounded-app-md px-3.5 py-2.5 text-[13px] ${stateClasses(error)} ${className}`}
      {...props}
    />
  );
});
