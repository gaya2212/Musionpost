import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, Poppins } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', weight: ['500', '600', '700'] });
const poppins = Poppins({ subsets: ['latin'], variable: '--font-poppins', weight: ['500'] });

export const metadata: Metadata = {
  title: 'Musion',
  description: 'Structured workflow, real people.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} ${poppins.variable}`}>
      <body>{children}</body>
    </html>
  );
}
