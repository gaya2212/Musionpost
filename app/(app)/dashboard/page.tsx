import { requireOnboarded } from '@/lib/auth/guards';
import { ArtistDashboard } from '@/components/dashboard/ArtistDashboard';
import { ProDashboard } from '@/components/dashboard/ProDashboard';

export default async function DashboardPage() {
  const profile = await requireOnboarded();

  if (profile.role === 'pro') {
    return <ProDashboard profile={profile} />;
  }

  return <ArtistDashboard profile={profile} />;
}
