import { requireOnboarded } from '@/lib/auth/guards';
import { ArtistMatchesFeed } from '@/components/match/ArtistMatchesFeed';
import { ProMatchesFeed } from '@/components/match/ProMatchesFeed';

export default async function MatchesPage() {
  const profile = await requireOnboarded();

  if (profile.role === 'pro') {
    return <ProMatchesFeed profile={profile} />;
  }

  return <ArtistMatchesFeed profile={profile} />;
}
