'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type MessageRealtimeListenerProps = {
  /** Thread IDs to watch for new messages. Refreshes the page whenever one arrives. */
  threadIds: string[];
};

/**
 * Subscribes to real-time INSERTs on `messages` for the given threads and
 * refreshes the (server-rendered) page when one arrives, so a message from
 * another participant shows up without a manual reload. Requires
 * `messages` to be in the supabase_realtime publication — see
 * supabase/migrations/20260726_messages_realtime_publication.sql.
 */
export function MessageRealtimeListener({ threadIds }: MessageRealtimeListenerProps) {
  const router = useRouter();
  const filterKey = threadIds.slice().sort().join(',');

  useEffect(() => {
    if (!threadIds.length) return;

    const client = createClient();
    if (!client) return;

    const channel = client
      .channel(`messages-${filterKey}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=in.(${threadIds.join(',')})`,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  return null;
}
