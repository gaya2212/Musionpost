import type { Metadata } from 'next';
import { Nav } from '@/components/shared/Nav';
import { Footer } from '@/components/shared/Footer';

export const metadata: Metadata = {
  title: 'Musion',
  description: 'Structured workflow, real people.',
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-white">
      <Nav />
      {children}
      <Footer />
    </div>
  );
}
