import type { Metadata } from 'next';
import { requireOnboarded } from '@/lib/auth/guards';

export const metadata: Metadata = {
  title: 'Musion',
  description: 'Structured workflow, real people.',
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireOnboarded();

  return <div className="min-h-screen bg-canvas text-white">{children}</div>;
}
