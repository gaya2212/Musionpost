import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { RiMapPinLine, RiExternalLinkLine } from '@remixicon/react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { proTypeLabels, rateRangeLabels } from '@/lib/validation/pro';
import type { ProType } from '@/lib/workflow/stages';
import { resolvePortfolioEmbed } from '@/lib/portfolio/embeds';
import { Avatar } from '@/components/ui/Avatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { buttonClasses } from '@/components/ui/Button';
import { InviteToProjectAction } from '@/components/project/InviteToProjectAction';

export const revalidate = 3600;

const availabilityTone: Record<string, 'green' | 'yellow' | 'gray'> = {
  open: 'green',
  limited: 'yellow',
  closed: 'gray',
};

const availabilityLabels: Record<string, string> = {
  open: 'Open for work',
  limited: 'Limited availability',
  closed: 'Not available',
};

async function getPublicPro(proSlug: string) {
  const supabase = await createServerSupabaseClient();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(proSlug);

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, slug, display_name, avatar_url, location, bio, visibility')
    .or(isUuid ? `slug.eq.${proSlug},id.eq.${proSlug}` : `slug.eq.${proSlug}`)
    .maybeSingle();

  if (!profile || profile.visibility !== 'public') {
    return null;
  }

  const { data: pro } = await supabase.from('pro_profiles').select('*').eq('profile_id', profile.id).maybeSingle();

  if (!pro) {
    return null;
  }

  return { profile, pro };
}

export async function generateMetadata({ params }: { params: Promise<{ proSlug: string }> }): Promise<Metadata> {
  const { proSlug } = await params;
  const result = await getPublicPro(proSlug);

  if (!result) {
    return { title: 'Profile not found — Musion' };
  }

  const { profile, pro } = result;
  const typeLabel = proTypeLabels[pro.pro_type as ProType];

  return {
    title: `${profile.display_name} — ${typeLabel} on Musion`,
    description: profile.bio || `${profile.display_name} is a ${typeLabel.toLowerCase()} on Musion.`,
  };
}

export default async function PublicProProfilePage({ params }: { params: Promise<{ proSlug: string }> }) {
  const { proSlug } = await params;
  const result = await getPublicPro(proSlug);

  if (!result) {
    notFound();
  }

  const { profile, pro } = result;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let viewerProjects: { id: string; title: string }[] = [];
  let isViewingOwnProfile = false;

  if (user) {
    isViewingOwnProfile = user.id === profile.id;
    const { data: projectsData } = await supabase
      .from('projects')
      .select('id, title')
      .eq('artist_profile_id', user.id)
      .in('status', ['active', 'paused']);
    viewerProjects = projectsData ?? [];
  }

  const notableCredits = Array.isArray(pro.notable_credits)
    ? (pro.notable_credits as { note?: string }[]).filter((c) => c.note)
    : [];

  return (
    <div className="min-h-screen bg-app-bg">
      <header className="border-b border-app-border bg-app-surface px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/login" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-app-logo">
              <span className="text-sm font-extrabold text-white">M</span>
            </div>
            <span className="text-[15px] font-bold text-app-fg-1">musion</span>
          </Link>
          <Link href="/login" className={buttonClasses('secondary', 'md')}>
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="overflow-hidden rounded-app-xl border border-app-border bg-app-surface shadow-app-sm">
          <div className="h-24 bg-app-logo" />
          <div className="px-6 pb-6">
            <div className="-mt-8 flex items-end gap-4">
              <div className="rounded-full border-4 border-app-surface">
                <Avatar name={profile.display_name} src={profile.avatar_url} size="lg" />
              </div>
              <div className="mb-1">
                <Badge tone={availabilityTone[pro.availability_status] ?? 'gray'}>
                  {availabilityLabels[pro.availability_status] ?? pro.availability_status}
                </Badge>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              <h1 className="text-lg font-bold text-app-fg-1">{profile.display_name}</h1>
              {pro.verified_status !== 'unverified' ? <VerifiedBadge size={16} /> : null}
            </div>
            <div className="mt-0.5 text-[13px] text-app-fg-2">{proTypeLabels[pro.pro_type as ProType]}</div>
            {profile.location ? (
              <div className="mt-1 flex items-center gap-1 text-[12px] text-app-fg-3">
                <RiMapPinLine size={13} /> {profile.location}
              </div>
            ) : null}

            {pro.genres.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {pro.genres.map((genre) => (
                  <Tag key={genre}>{genre}</Tag>
                ))}
              </div>
            ) : null}

            {profile.bio ? <p className="mt-5 text-[13px] leading-relaxed text-app-fg-2">{profile.bio}</p> : null}

            {pro.specialties.length ? (
              <div className="mt-5 border-t border-app-border pt-5">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-app-fg-3">Specialties</div>
                <p className="text-[13px] text-app-fg-1">{pro.specialties.join(', ')}</p>
              </div>
            ) : null}

            {pro.rate_range ? (
              <div className="mt-4 text-[13px] text-app-fg-2">
                Rate: <span className="font-medium text-app-fg-1">{rateRangeLabels[pro.rate_range as keyof typeof rateRangeLabels]}</span>
              </div>
            ) : null}

            {notableCredits.length ? (
              <div className="mt-5 border-t border-app-border pt-5">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-app-fg-3">Notable credits</div>
                <ul className="space-y-1.5 text-[13px] text-app-fg-2">
                  {notableCredits.map((credit, i) => (
                    <li key={i}>{credit.note}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {pro.portfolio_urls.length ? (
              <div className="mt-5 border-t border-app-border pt-5">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-app-fg-3">Portfolio</div>
                <div className="flex flex-col gap-4">
                  {pro.portfolio_urls.map((url) => {
                    const embed = resolvePortfolioEmbed(url);
                    if (embed.kind === 'link') {
                      return (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[13px] font-medium text-app-primary hover:underline"
                        >
                          {url} <RiExternalLinkLine size={14} />
                        </a>
                      );
                    }
                    return (
                      <iframe
                        key={url}
                        src={embed.src}
                        title={url}
                        className="w-full rounded-app-md border border-app-border"
                        height={embed.kind === 'spotify' ? 152 : embed.kind === 'soundcloud' ? 166 : 220}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        loading="lazy"
                      />
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          {isViewingOwnProfile ? null : !user ? (
            <div className="rounded-app-xl border border-app-border bg-app-surface p-5 text-center">
              <p className="text-[13px] text-app-fg-2">
                <Link href="/login" className="font-semibold text-app-primary hover:underline">
                  Sign in
                </Link>{' '}
                to invite {profile.display_name} to a project or send a message.
              </p>
            </div>
          ) : viewerProjects.length ? (
            <InviteToProjectAction
              proProfileId={profile.id}
              role={proTypeLabels[pro.pro_type as ProType]}
              projects={viewerProjects}
            />
          ) : (
            <div className="rounded-app-xl border border-app-border bg-app-surface p-5 text-center">
              <p className="text-[13px] text-app-fg-2">
                <Link href="/projects/new" className="font-semibold text-app-primary hover:underline">
                  Create a project
                </Link>{' '}
                to invite {profile.display_name} to collaborate.
              </p>
            </div>
          )}

          {user && !isViewingOwnProfile ? (
            <Link href={`/messages?with=${profile.id}`} className={`${buttonClasses('secondary', 'lg')} mt-3 w-full`}>
              Message {profile.display_name}
            </Link>
          ) : null}
        </div>
      </main>
    </div>
  );
}
