type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
};

const dotSizeClasses: Record<AvatarSize, string> = {
  xs: 'h-1.5 w-1.5 border',
  sm: 'h-2 w-2 border-2',
  md: 'h-2.5 w-2.5 border-2',
  lg: 'h-4 w-4 border-2',
};

type AvatarProps = {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  status?: 'online' | 'offline';
  className?: string;
};

export function Avatar({ src, name, size = 'md', status, className = '' }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <span className={`relative inline-flex shrink-0 ${sizeClasses[size]} ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-app-primary-light font-bold text-app-primary">
          {initial}
        </span>
      )}
      {status ? (
        <span
          className={`absolute right-0 bottom-0 rounded-full border-app-surface ${dotSizeClasses[size]} ${
            status === 'online' ? 'bg-app-green' : 'bg-app-fg-3'
          }`}
        />
      ) : null}
    </span>
  );
}
