import Link from 'next/link';

const links = [
  { href: '#workflow', label: 'Workflow' },
  { href: '#why-musion', label: 'Why Musion' },
  { href: '#waitlist', label: 'Waitlist' },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-canvas/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
        <Link href="/" className="text-lg font-semibold tracking-[0.2em] text-white">
          MUSION
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-300">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
