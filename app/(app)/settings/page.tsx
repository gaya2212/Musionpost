import Link from 'next/link';
import { RiArrowRightLine, RiShieldCheckLine } from '@remixicon/react';
import { requireOnboarded } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SettingsForm } from '@/components/app-shell/SettingsForm';

export default async function SettingsPage() {
  const profile = await requireOnboarded();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-2xl px-8 py-7">
      <div className="mb-6">
        <div className="text-xl font-bold text-app-fg-1">Settings</div>
        <div className="mt-0.5 text-[13px] text-app-fg-2">Manage your account and profile.</div>
      </div>

      {user?.email ? (
        <div className="mb-4 rounded-app-xl border border-app-border bg-app-surface p-6 shadow-app-sm">
          <div className="mb-1 text-sm font-semibold text-app-fg-1">Account</div>
          <p className="text-[13px] text-app-fg-2">{user.email}</p>
        </div>
      ) : null}

      <SettingsForm
        profileId={profile.id}
        initialDisplayName={profile.display_name}
        initialLocation={profile.location ?? ''}
        initialBio={profile.bio ?? ''}
        initialVisibility={profile.visibility}
      />

      <Link
        href="/settings/verification"
        className="mt-4 flex items-center gap-3 rounded-app-xl border border-app-border bg-app-surface p-6 shadow-app-sm transition hover:border-app-primary"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-app-md bg-app-primary-light text-app-primary">
          <RiShieldCheckLine size={18} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-app-fg-1">Musion Verified</div>
          <div className="text-[13px] text-app-fg-2">Manage your verification status and preferences.</div>
        </div>
        <RiArrowRightLine size={18} className="text-app-fg-3" />
      </Link>
    </main>
  );
}
