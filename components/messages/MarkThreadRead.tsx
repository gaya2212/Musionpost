'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type MarkThreadReadProps = {
  threadId: string;
  hasUnread: boolean;
};

export function MarkThreadRead({ threadId, hasUnread }: MarkThreadReadProps) {
  const router = useRouter();

  useEffect(() => {
    if (!hasUnread) return;

    const client = createClient();
    if (!client) return;

    client.rpc('mark_thread_read', { target_thread_id: threadId }).then(({ error }) => {
      if (!error) router.refresh();
    });
    // Only re-run when the thread changes — not on every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  return null;
}
