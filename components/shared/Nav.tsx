import Link from 'next/link';

const links = [
  { href: '#workflow', label: 'Workflow' },
  { href: '#why-musion', label: 'Why Musion' },
  { href: '#waitlist', label: 'Waitlist' },
];

export function Nav() {
  return (
    <div className="sticky top-4 z-30 px-4 sm:px-6">
      <header className="mx-auto flex max-w-3xl items-center justify-between rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 text-text-body shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-6">
        <Link href="/" className="font-display text-sm font-semibold tracking-[0.2em] text-text-body">
          MUSION
        </Link>
        <nav className="hidden items-center gap-6 font-display text-sm font-medium sm:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-text-muted transition hover:text-text-body">
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="#waitlist"
          className="rounded-full bg-grad-cyan px-4 py-1.5 font-display text-sm font-semibold text-bg transition hover:brightness-110 sm:hidden"
        >
          Join
        </Link>
      </header>
    </div>
  );
}
