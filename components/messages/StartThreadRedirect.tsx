'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type StartThreadRedirectProps = {
  otherProfileId: string;
};

export function StartThreadRedirect({ otherProfileId }: StartThreadRedirectProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const client = createClient();
      if (!client) {
        setError('Supabase is not configured for this environment.');
        return;
      }

      const { data: threadId, error: rpcError } = await client.rpc('start_thread', {
        other_profile_id: otherProfileId,
      });

      if (cancelled) return;

      if (rpcError || !threadId) {
        setError(rpcError?.message || 'Unable to start this conversation.');
        return;
      }

      router.replace(`/messages?thread=${threadId}`);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [otherProfileId, router]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-app-bg text-center">
        <p className="text-sm font-medium text-app-fg-1">Couldn&apos;t start this conversation</p>
        <p className="max-w-xs text-[13px] text-app-fg-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-app-bg text-center">
      <p className="text-[13px] text-app-fg-2">Starting conversation…</p>
    </div>
  );
}
