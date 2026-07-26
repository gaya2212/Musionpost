import Link from 'next/link';
import { RiCompass3Line } from '@remixicon/react';
import { buttonClasses } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-app-bg px-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-primary-light text-app-primary">
        <RiCompass3Line size={22} />
      </div>
      <p className="text-lg font-bold text-app-fg-1">Page not found</p>
      <p className="max-w-sm text-[13px] text-app-fg-2">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
      <Link href="/dashboard" className={`${buttonClasses('primary', 'md')} mt-2`}>
        Go to dashboard
      </Link>
    </main>
  );
}
