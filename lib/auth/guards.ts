import 'server-only';
import { redirect } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export async function requireAuth(): Promise<Session> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}

async function getOwnProfile(userId: string): Promise<Profile> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

  if (error || !data) {
    redirect('/login');
  }

  return data;
}

export async function requireRole(role: 'artist' | 'pro'): Promise<Profile> {
  const session = await requireAuth();
  const profile = await getOwnProfile(session.user.id);

  if (profile.role !== role && profile.role !== 'both') {
    redirect('/dashboard');
  }

  return profile;
}

export async function requireOnboarded(): Promise<Profile> {
  const session = await requireAuth();
  const profile = await getOwnProfile(session.user.id);

  if (!profile.onboarding_complete) {
    redirect('/signup');
  }

  return profile;
}
