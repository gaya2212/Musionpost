'use client';

import { useEffect } from 'react';
import { RiErrorWarningLine } from '@remixicon/react';
import { Button } from '@/components/ui/Button';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-red/10 text-app-red">
        <RiErrorWarningLine size={24} />
      </div>
      <p className="text-sm font-semibold text-app-fg-1">Something went wrong.</p>
      <p className="max-w-sm text-[13px] text-app-fg-2">
        {error.message || 'An unexpected error occurred loading this page.'}
      </p>
      <Button type="button" onClick={reset} className="mt-2">
        Try again
      </Button>
    </main>
  );
}
