import Link from 'next/link';
import { RiMessage3Line } from '@remixicon/react';
import { requireOnboarded } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Avatar } from '@/components/ui/Avatar';
import { MarkThreadRead } from '@/components/messages/MarkThreadRead';
import { MessageComposer } from '@/components/messages/MessageComposer';
import { StartThreadRedirect } from '@/components/messages/StartThreadRedirect';
import { MessageRealtimeListener } from '@/components/messages/MessageRealtimeListener';

function formatTimestamp(value: string) {
  const date = new Date(value);
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string; with?: string }>;
}) {
  const { thread: selectedThreadId, with: startWithProfileId } = await searchParams;
  const profile = await requireOnboarded();
  const supabase = await createServerSupabaseClient();

  const { data: participantRows } = await supabase
    .from('thread_participants')
    .select('thread_id')
    .eq('profile_id', profile.id);

  const threadIds = (participantRows ?? []).map((row) => row.thread_id);

  const { data: threads } = threadIds.length
    ? await supabase.from('message_threads').select('*').in('id', threadIds).order('last_message_at', { ascending: false })
    : { data: [] as { id: string; last_message_at: string }[] };

  const { data: otherParticipantRows } = threadIds.length
    ? await supabase.from('thread_participants').select('thread_id, profile_id').in('thread_id', threadIds).neq('profile_id', profile.id)
    : { data: [] as { thread_id: string; profile_id: string }[] };

  const otherProfileIdByThread = new Map((otherParticipantRows ?? []).map((row) => [row.thread_id, row.profile_id]));
  const otherProfileIds = Array.from(new Set((otherParticipantRows ?? []).map((row) => row.profile_id)));

  const { data: otherProfilesData } = otherProfileIds.length
    ? await supabase.from('profiles').select('id, display_name, avatar_url').in('id', otherProfileIds)
    : { data: [] as { id: string; display_name: string; avatar_url: string | null }[] };

  const otherProfileById = new Map((otherProfilesData ?? []).map((p) => [p.id, p]));

  const { data: allMessages } = threadIds.length
    ? await supabase
        .from('messages')
        .select('id, thread_id, sender_profile_id, body, created_at, read_at')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: true })
    : {
        data: [] as {
          id: string;
          thread_id: string;
          sender_profile_id: string;
          body: string;
          created_at: string;
          read_at: string | null;
        }[],
      };

  type MessageRow = NonNullable<typeof allMessages>[number];
  const messagesByThread = new Map<string, MessageRow[]>();
  (allMessages ?? []).forEach((m) => {
    const list = messagesByThread.get(m.thread_id) ?? [];
    list.push(m);
    messagesByThread.set(m.thread_id, list);
  });

  const activeThreadId = threadIds.includes(selectedThreadId ?? '') ? selectedThreadId : undefined;
  const activeMessages = activeThreadId ? messagesByThread.get(activeThreadId) ?? [] : [];
  const activeOtherProfile = activeThreadId
    ? otherProfileById.get(otherProfileIdByThread.get(activeThreadId) ?? '')
    : undefined;
  const activeHasUnread = activeMessages.some((m) => m.sender_profile_id !== profile.id && !m.read_at);

  return (
    <main className="flex h-full">
      <MessageRealtimeListener threadIds={threadIds} />
      <div className="w-[320px] shrink-0 overflow-y-auto border-r border-app-border bg-app-surface">
        <div className="border-b border-app-border px-5 py-4">
          <div className="text-lg font-bold text-app-fg-1">Messages</div>
        </div>
        {(threads ?? []).length === 0 ? (
          <div className="p-5 text-[13px] text-app-fg-2">No conversations yet.</div>
        ) : (
          <ul>
            {(threads ?? []).map((thread) => {
              const otherProfile = otherProfileById.get(otherProfileIdByThread.get(thread.id) ?? '');
              const threadMessages = messagesByThread.get(thread.id) ?? [];
              const lastMessage = threadMessages[threadMessages.length - 1];
              const unread = threadMessages.some((m) => m.sender_profile_id !== profile.id && !m.read_at);

              if (!otherProfile) return null;

              return (
                <li key={thread.id}>
                  <Link
                    href={`/messages?thread=${thread.id}`}
                    className={`flex items-center gap-3 border-b border-app-border px-5 py-3.5 transition hover:bg-app-surface-2 ${
                      activeThreadId === thread.id ? 'bg-app-primary-light' : ''
                    }`}
                  >
                    <Avatar name={otherProfile.display_name} src={otherProfile.avatar_url} size="sm" status={unread ? 'online' : undefined} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`truncate text-[13px] ${unread ? 'font-bold text-app-fg-1' : 'font-medium text-app-fg-1'}`}>
                          {otherProfile.display_name}
                        </span>
                        <span className="shrink-0 text-[11px] text-app-fg-3">{formatTimestamp(thread.last_message_at)}</span>
                      </div>
                      <p className={`truncate text-[12px] ${unread ? 'font-semibold text-app-fg-1' : 'text-app-fg-2'}`}>
                        {lastMessage ? lastMessage.body : 'No messages yet'}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {startWithProfileId && !activeThreadId ? (
        <StartThreadRedirect otherProfileId={startWithProfileId} />
      ) : activeThreadId && activeOtherProfile ? (
        <div className="flex flex-1 flex-col bg-app-bg">
          <MarkThreadRead threadId={activeThreadId} hasUnread={activeHasUnread} />
          <div className="flex items-center gap-2.5 border-b border-app-border bg-app-surface px-5 py-3.5">
            <Avatar name={activeOtherProfile.display_name} src={activeOtherProfile.avatar_url} size="sm" />
            <span className="text-[13px] font-semibold text-app-fg-1">{activeOtherProfile.display_name}</span>
          </div>

          <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-5">
            {activeMessages.length === 0 ? (
              <p className="text-[13px] text-app-fg-2">No messages yet. Say hello.</p>
            ) : (
              activeMessages.map((message) => {
                const isMine = message.sender_profile_id === profile.id;
                return (
                  <div
                    key={message.id}
                    className={`max-w-[70%] rounded-app-lg px-3.5 py-2.5 text-[13px] ${
                      isMine ? 'self-end bg-app-primary text-white' : 'self-start bg-app-surface text-app-fg-1'
                    }`}
                  >
                    {message.body}
                  </div>
                );
              })
            )}
          </div>

          <MessageComposer threadId={activeThreadId} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-app-bg text-center">
          <RiMessage3Line size={32} className="text-app-fg-3" />
          <p className="text-sm font-medium text-app-fg-1">Select a conversation</p>
          <p className="max-w-xs text-[13px] text-app-fg-2">
            Conversations with collaborators on your projects will appear here.
          </p>
        </div>
      )}
    </main>
  );
}
