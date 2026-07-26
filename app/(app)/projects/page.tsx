import { requireOnboarded } from '@/lib/auth/guards';
import { ArtistProjectsList } from '@/components/project/ArtistProjectsList';
import { ProProjectsList } from '@/components/project/ProProjectsList';

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const profile = await requireOnboarded();

  if (profile.role === 'pro') {
    return <ProProjectsList profile={profile} />;
  }

  return <ArtistProjectsList profile={profile} tab={tab} />;
}
