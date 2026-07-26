'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type MessageComposerProps = {
  threadId: string;
};

export function MessageComposer({ threadId }: MessageComposerProps) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;

    setError(null);
    setIsSending(true);

    const client = createClient();
    if (!client) {
      setError('Supabase is not configured for this environment.');
      setIsSending(false);
      return;
    }

    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      setError('Your session has expired. Please sign in again.');
      setIsSending(false);
      return;
    }

    const { error: insertError } = await client
      .from('messages')
      .insert({ thread_id: threadId, sender_profile_id: user.id, body: trimmed });

    if (insertError) {
      setError(insertError.message || 'Unable to send that message.');
      setIsSending(false);
      return;
    }

    await client.from('message_threads').update({ last_message_at: new Date().toISOString() }).eq('id', threadId);

    // Best-effort — a failed notification shouldn't block the message
    // from sending, it's already persisted at this point.
    fetch('/api/messages/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId }),
    }).catch(() => {});

    setBody('');
    setIsSending(false);
    router.refresh();
  };

  return (
    <div className="border-t border-app-border bg-app-surface p-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <Input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write a message…"
          className="flex-1"
        />
        <Button type="submit" disabled={isSending || !body.trim()}>
          {isSending ? 'Sending…' : 'Send'}
        </Button>
      </form>
      {error ? <p className="mt-2 text-[12px] text-app-red" role="alert">{error}</p> : null}
    </div>
  );
}
