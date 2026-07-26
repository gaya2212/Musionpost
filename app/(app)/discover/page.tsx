import Link from 'next/link';
import { requireOnboarded } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { proTypeValues, proTypeLabels, rateRangeValues, rateRangeLabels } from '@/lib/validation/pro';
import type { ProType } from '@/lib/workflow/stages';
import { Avatar } from '@/components/ui/Avatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { buttonClasses } from '@/components/ui/Button';

const PAGE_SIZE = 20;

const availabilityTone: Record<string, 'green' | 'yellow' | 'gray'> = {
  open: 'green',
  limited: 'yellow',
  closed: 'gray',
};

const availabilityLabels: Record<string, string> = {
  open: 'Open',
  limited: 'Limited',
  closed: 'Closed',
};

const verifiedStatusValues = ['unverified', 'witnessed', 'documented'] as const;
const verifiedStatusLabels: Record<(typeof verifiedStatusValues)[number], string> = {
  unverified: 'Unverified',
  witnessed: 'Witnessed',
  documented: 'Documented',
};

type SearchParams = {
  type?: string;
  location?: string;
  genre?: string;
  rate?: string;
  verified?: string;
  page?: string;
};

function toggledList(current: string[], value: string): string[] {
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
}

function buildHref(params: SearchParams, overrides: Partial<SearchParams>) {
  const next = { ...params, ...overrides };
  const usp = new URLSearchParams();
  if (next.type) usp.set('type', next.type);
  if (next.location) usp.set('location', next.location);
  if (next.genre) usp.set('genre', next.genre);
  if (next.rate) usp.set('rate', next.rate);
  if (next.verified) usp.set('verified', next.verified);
  if (next.page && next.page !== '1') usp.set('page', next.page);
  const qs = usp.toString();
  return qs ? `/discover?${qs}` : '/discover';
}

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireOnboarded();
  const supabase = await createServerSupabaseClient();
  const params = await searchParams;

  const selectedTypes = params.type ? params.type.split(',').filter(Boolean) : [];
  const selectedGenres = params.genre ? params.genre.split(',').filter(Boolean) : [];
  const selectedLocation = params.location ?? '';
  const selectedRate = params.rate ?? '';
  const selectedVerified = params.verified ?? '';
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);

  // Filter facets (available pro types / locations / genres) are computed
  // from a broad, unfiltered sample of public pros so the option lists
  // don't shrink to match whatever's currently selected.
  const { data: facetRows } = await supabase
    .from('pro_profiles')
    .select('genres, profiles:profile_id(location, visibility)')
    .limit(300);

  type FacetRow = { genres: string[]; profiles: { location: string | null; visibility: string } | null };
  const publicFacetRows = ((facetRows ?? []) as FacetRow[]).filter((row) => row.profiles?.visibility === 'public');
  const availableLocations = Array.from(
    new Set(publicFacetRows.map((row) => row.profiles?.location).filter((v): v is string => Boolean(v))),
  ).sort();
  const availableGenres = Array.from(new Set(publicFacetRows.flatMap((row) => row.genres))).sort();

  let query = supabase
    .from('pro_profiles')
    .select('*', { count: 'exact' })
    .neq('availability_status', 'closed');

  if (selectedTypes.length) query = query.in('pro_type', selectedTypes);
  if (selectedGenres.length) query = query.overlaps('genres', selectedGenres);
  if (selectedRate) query = query.eq('rate_range', selectedRate);
  if (selectedVerified) query = query.eq('verified_status', selectedVerified);

  const from = (page - 1) * PAGE_SIZE;
  const { data: proProfiles, count } = await query.order('updated_at', { ascending: false }).range(from, from + PAGE_SIZE - 1);

  const profileIds = (proProfiles ?? []).map((p) => p.profile_id);

  const { data: profilesData } = profileIds.length
    ? await supabase.from('profiles').select('id, slug, display_name, avatar_url, location, bio, visibility').in('id', profileIds)
    : {
        data: [] as {
          id: string;
          slug: string | null;
          display_name: string;
          avatar_url: string | null;
          location: string | null;
          bio: string | null;
          visibility: string;
        }[],
      };

  const profileById = new Map((profilesData ?? []).map((p) => [p.id, p]));

  const pros = (proProfiles ?? [])
    .map((pro) => ({ pro, profile: profileById.get(pro.profile_id) }))
    .filter((entry) => entry.profile && entry.profile.visibility === 'public' && (!selectedLocation || entry.profile.location === selectedLocation));

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const chipClass = (active: boolean) =>
    `inline-flex items-center rounded-app-pill border px-3 py-1.5 text-[12px] font-medium transition ${
      active
        ? 'border-app-primary bg-app-primary-light text-app-primary'
        : 'border-app-border bg-app-surface text-app-fg-2 hover:bg-app-surface-2'
    }`;

  return (
    <main className="mx-auto max-w-6xl px-8 py-7">
      <div className="mb-6">
        <div className="text-xl font-bold text-app-fg-1">Discover</div>
        <div className="mt-0.5 text-[13px] text-app-fg-2">Browse verified producers, engineers, and studios.</div>
      </div>

      <div className="mb-6 flex flex-col gap-4 rounded-app-xl border border-app-border bg-app-surface p-5">
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-app-fg-3">Pro type</div>
          <div className="flex flex-wrap gap-2">
            {proTypeValues.map((type) => (
              <Link
                key={type}
                href={buildHref(params, { type: toggledList(selectedTypes, type).join(',') || undefined, page: undefined })}
                className={chipClass(selectedTypes.includes(type))}
              >
                {proTypeLabels[type]}
              </Link>
            ))}
          </div>
        </div>

        {availableGenres.length ? (
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-app-fg-3">Genres</div>
            <div className="flex flex-wrap gap-2">
              {availableGenres.map((genre) => (
                <Link
                  key={genre}
                  href={buildHref(params, { genre: toggledList(selectedGenres, genre).join(',') || undefined, page: undefined })}
                  className={chipClass(selectedGenres.includes(genre))}
                >
                  {genre}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-4">
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-app-fg-3">Location</div>
            <div className="flex flex-wrap gap-2">
              <Link href={buildHref(params, { location: undefined, page: undefined })} className={chipClass(!selectedLocation)}>
                Any
              </Link>
              {availableLocations.map((location) => (
                <Link
                  key={location}
                  href={buildHref(params, { location: selectedLocation === location ? undefined : location, page: undefined })}
                  className={chipClass(selectedLocation === location)}
                >
                  {location}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-app-fg-3">Rate range</div>
            <div className="flex flex-wrap gap-2">
              <Link href={buildHref(params, { rate: undefined, page: undefined })} className={chipClass(!selectedRate)}>
                Any
              </Link>
              {rateRangeValues.map((rate) => (
                <Link
                  key={rate}
                  href={buildHref(params, { rate: selectedRate === rate ? undefined : rate, page: undefined })}
                  className={chipClass(selectedRate === rate)}
                >
                  {rateRangeLabels[rate]}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-app-fg-3">Verified status</div>
            <div className="flex flex-wrap gap-2">
              <Link href={buildHref(params, { verified: undefined, page: undefined })} className={chipClass(!selectedVerified)}>
                Any
              </Link>
              {verifiedStatusValues.map((status) => (
                <Link
                  key={status}
                  href={buildHref(params, { verified: selectedVerified === status ? undefined : status, page: undefined })}
                  className={chipClass(selectedVerified === status)}
                >
                  {verifiedStatusLabels[status]}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {pros.length === 0 ? (
        <div className="rounded-app-xl border border-app-border bg-app-surface p-8 text-center">
          <p className="text-sm font-medium text-app-fg-1">No public professionals match these filters.</p>
          <p className="mt-1 text-[13px] text-app-fg-2">Try widening your filters or check back once more pros have joined.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {pros.map(({ pro, profile }) => (
              <Link
                href={`/discover/${profile!.slug ?? profile!.id}`}
                key={pro.profile_id}
                className="flex flex-col gap-3.5 rounded-app-xl border border-app-border bg-app-surface p-5 shadow-app-sm transition hover:border-app-primary hover:shadow-app-md"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={profile!.display_name} src={profile!.avatar_url} size="md" />
                  <div className="flex-1">
                    <div className="flex items-center gap-1 text-sm font-semibold text-app-fg-1">
                      {profile!.display_name}
                      {pro.verified_status !== 'unverified' ? <VerifiedBadge /> : null}
                    </div>
                    <div className="mt-0.5 text-xs text-app-fg-2">
                      {proTypeLabels[pro.pro_type as ProType]}
                      {pro.specialties.length ? ` · ${pro.specialties.slice(0, 2).join(', ')}` : ''}
                    </div>
                    {profile!.location ? <div className="mt-0.5 text-[11px] text-app-fg-3">{profile!.location}</div> : null}
                  </div>
                  <Badge tone={availabilityTone[pro.availability_status] ?? 'gray'}>
                    {availabilityLabels[pro.availability_status] ?? pro.availability_status}
                  </Badge>
                </div>

                {pro.genres.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {pro.genres.slice(0, 4).map((genre) => (
                      <Tag key={genre}>{genre}</Tag>
                    ))}
                  </div>
                ) : null}

                {pro.rate_range ? (
                  <div className="text-[12px] text-app-fg-2">Rate: {rateRangeLabels[pro.rate_range as keyof typeof rateRangeLabels]}</div>
                ) : null}

                <span className={`${buttonClasses('secondary', 'md')} mt-auto pointer-events-none`}>View profile</span>
              </Link>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildHref(params, { page: String(p) })}
                  className={`flex h-8 w-8 items-center justify-center rounded-app-md text-[13px] font-medium transition ${
                    p === page ? 'bg-app-primary text-white' : 'border border-app-border text-app-fg-2 hover:bg-app-surface-2'
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}
