import type { Metadata } from 'next';
import { requireOnboarded } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AppHeader } from '@/components/app-shell/AppHeader';
import { AppSidebar } from '@/components/app-shell/AppSidebar';
import { MobileNavProvider } from '@/components/app-shell/MobileNavContext';

export const metadata: Metadata = {
  title: 'Musion',
  description: 'Structured workflow, real people.',
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireOnboarded();
  const supabase = await createServerSupabaseClient();

  const { data: projects } = await supabase.from('projects').select('id').eq('artist_profile_id', profile.id);
  const projectIds = (projects ?? []).map((p) => p.id);

  const { count: matchesCount } = projectIds.length
    ? await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .eq('decision', 'pending')
    : { count: 0 };

  const { data: threads } = await supabase.from('thread_participants').select('thread_id').eq('profile_id', profile.id);
  const threadIds = (threads ?? []).map((t) => t.thread_id);

  const { count: unreadCount } = threadIds.length
    ? await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('thread_id', threadIds)
        .is('read_at', null)
        .neq('sender_profile_id', profile.id)
    : { count: 0 };

  return (
    <MobileNavProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-app-bg text-app-fg-1">
        <AppHeader role={profile.role} displayName={profile.display_name} />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar matchesCount={matchesCount ?? 0} messagesCount={unreadCount ?? 0} />
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </MobileNavProvider>
  );
}
