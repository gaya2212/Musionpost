import Link from 'next/link';
import { RiEditLine } from '@remixicon/react';
import { requireOnboarded } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { budgetRangeLabels } from '@/lib/validation/artist';
import { proTypeLabels, rateRangeLabels } from '@/lib/validation/pro';
import { Avatar } from '@/components/ui/Avatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';

const availabilityTone: Record<string, 'green' | 'yellow' | 'gray'> = {
  open: 'green',
  limited: 'yellow',
  closed: 'gray',
};

const availabilityLabels: Record<string, string> = {
  open: 'Open for Hire',
  limited: 'Limited Availability',
  closed: 'Not Available',
};

export default async function ProfilePage() {
  const profile = await requireOnboarded();
  const supabase = await createServerSupabaseClient();

  const [{ data: artistProfile }, { data: proProfile }] = await Promise.all([
    supabase.from('artist_profiles').select('*').eq('profile_id', profile.id).maybeSingle(),
    supabase.from('pro_profiles').select('*').eq('profile_id', profile.id).maybeSingle(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-8 py-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-bold text-app-fg-1">Profile</div>
          <div className="mt-0.5 text-[13px] text-app-fg-2">How collaborators see you on Musion.</div>
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-1.5 rounded-app-md border border-app-border bg-app-surface px-3.5 py-2 text-[13px] font-medium text-app-fg-1 transition hover:bg-app-surface-2"
        >
          <RiEditLine size={15} /> Edit
        </Link>
      </div>

      <div className="overflow-hidden rounded-app-xl border border-app-border bg-app-surface shadow-app-sm">
        <div className="h-28 bg-app-logo" />

        <div className="px-6 pb-6">
          <div className="-mt-8 flex items-end gap-4">
            <div className="rounded-full border-4 border-app-surface">
              <Avatar name={profile.display_name} src={profile.avatar_url} size="lg" />
            </div>
            {proProfile ? (
              <div className="mb-1">
                <Badge tone={availabilityTone[proProfile.availability_status] ?? 'gray'}>
                  {availabilityLabels[proProfile.availability_status] ?? proProfile.availability_status}
                </Badge>
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-lg font-bold text-app-fg-1">{profile.display_name}</span>
            {proProfile && proProfile.verified_status !== 'unverified' ? <VerifiedBadge size={16} /> : null}
          </div>
          <div className="mt-0.5 text-[13px] capitalize text-app-fg-2">
            {proProfile ? proTypeLabels[proProfile.pro_type as keyof typeof proTypeLabels] : profile.role}
          </div>
          {profile.location ? <div className="mt-0.5 text-[12px] text-app-fg-3">{profile.location}</div> : null}

          {proProfile && proProfile.genres.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {proProfile.genres.slice(0, 6).map((genre) => (
                <Tag key={genre}>{genre}</Tag>
              ))}
            </div>
          ) : null}

          {profile.bio ? <p className="mt-5 text-[13px] leading-relaxed text-app-fg-2">{profile.bio}</p> : null}

          {artistProfile ? (
            <div className="mt-6 border-t border-app-border pt-5">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-app-fg-3">Artist details</div>
              <dl className="grid grid-cols-2 gap-4 text-[13px]">
                <div>
                  <dt className="text-app-fg-3">Primary genres</dt>
                  <dd className="mt-0.5 text-app-fg-1">{artistProfile.primary_genres.join(', ') || '—'}</dd>
                </div>
                <div>
                  <dt className="text-app-fg-3">Budget range</dt>
                  <dd className="mt-0.5 text-app-fg-1">
                    {artistProfile.budget_range
                      ? budgetRangeLabels[artistProfile.budget_range as keyof typeof budgetRangeLabels]
                      : '—'}
                  </dd>
                </div>
                {artistProfile.project_goals ? (
                  <div className="col-span-2">
                    <dt className="text-app-fg-3">Project goals</dt>
                    <dd className="mt-0.5 text-app-fg-1">{artistProfile.project_goals}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}

          {proProfile ? (
            <div className="mt-6 border-t border-app-border pt-5">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-app-fg-3">Professional details</div>
              <dl className="grid grid-cols-2 gap-4 text-[13px]">
                <div>
                  <dt className="text-app-fg-3">Type</dt>
                  <dd className="mt-0.5 text-app-fg-1">
                    {proTypeLabels[proProfile.pro_type as keyof typeof proTypeLabels]}
                  </dd>
                </div>
                <div>
                  <dt className="text-app-fg-3">Rate range</dt>
                  <dd className="mt-0.5 text-app-fg-1">
                    {proProfile.rate_range ? rateRangeLabels[proProfile.rate_range as keyof typeof rateRangeLabels] : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-app-fg-3">Specialties</dt>
                  <dd className="mt-0.5 text-app-fg-1">{proProfile.specialties.join(', ') || '—'}</dd>
                </div>
                <div>
                  <dt className="text-app-fg-3">Genres</dt>
                  <dd className="mt-0.5 text-app-fg-1">{proProfile.genres.join(', ') || '—'}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
