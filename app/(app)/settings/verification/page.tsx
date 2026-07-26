import Link from 'next/link';
import { RiShieldCheckLine } from '@remixicon/react';
import { requireOnboarded } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import { VerificationOptInToggle } from '@/components/settings/VerificationOptInToggle';

const verifiedStatusTone: Record<string, 'green' | 'yellow' | 'gray'> = {
  unverified: 'gray',
  witnessed: 'green',
  documented: 'yellow',
};

const verifiedStatusLabels: Record<string, string> = {
  unverified: 'Not yet verified',
  witnessed: 'Witnessed — Verified by Musion',
  documented: 'Documented — Verified by Musion',
};

export default async function VerificationSettingsPage() {
  const profile = await requireOnboarded();
  const supabase = await createServerSupabaseClient();

  const { data: proProfile } = await supabase
    .from('pro_profiles')
    .select('verified_status, verification_opt_in')
    .eq('profile_id', profile.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-2xl px-8 py-7">
      <Link href="/settings" className="text-[13px] font-medium text-app-primary transition hover:text-app-primary-hover">
        ← Back to settings
      </Link>

      <div className="mt-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-app-md bg-app-primary-light text-app-primary">
            <RiShieldCheckLine size={18} />
          </div>
          <div className="text-xl font-bold text-app-fg-1">Musion Verified</div>
        </div>
        <div className="mt-1.5 text-[13px] text-app-fg-2">Human-verified production credentials.</div>
      </div>

      {!proProfile ? (
        <div className="rounded-app-xl border border-app-border bg-app-surface p-6 text-center">
          <p className="text-[13px] text-app-fg-2">
            Musion Verified credentials are issued to professionals who complete work on the platform. This applies to pro
            accounts, not artist accounts.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-app-xl border border-app-border bg-app-surface p-6 shadow-app-sm">
            <div className="mb-1 text-sm font-semibold text-app-fg-1">Your status</div>
            <Badge tone={verifiedStatusTone[proProfile.verified_status] ?? 'gray'}>
              {verifiedStatusLabels[proProfile.verified_status] ?? proProfile.verified_status}
            </Badge>
          </div>

          <div className="rounded-app-xl border border-app-border bg-app-surface p-6 shadow-app-sm">
            <div className="mb-3 text-sm font-semibold text-app-fg-1">How it works</div>
            <ul className="space-y-2 text-[13px] text-app-fg-2">
              <li>
                <span className="font-medium text-app-fg-1">Witnessed</span> — auto-issued when a project completes
                end-to-end on Musion with 2 or more verified collaborators.
              </li>
              <li>
                <span className="font-medium text-app-fg-1">Documented</span> — issued after a review of work completed
                off-platform.
              </li>
            </ul>
          </div>

          <div className="rounded-app-xl border border-app-border bg-app-surface p-6 shadow-app-sm">
            <VerificationOptInToggle profileId={profile.id} initialOptIn={proProfile.verification_opt_in} />
          </div>
        </div>
      )}
    </main>
  );
}
