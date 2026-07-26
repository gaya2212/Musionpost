'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  RiDashboardLine,
  RiMusic2Line,
  RiUserStarLine,
  RiMessage3Line,
  RiCompass3Line,
  RiSettings3Line,
  RiCloseLine,
} from '@remixicon/react';
import { useMobileNav } from './MobileNavContext';

type NavItem = {
  href: string;
  icon: typeof RiDashboardLine;
  label: string;
  count?: number;
};

type AppSidebarProps = {
  matchesCount?: number;
  messagesCount?: number;
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ matchesCount = 0, messagesCount = 0 }: AppSidebarProps) {
  const pathname = usePathname();
  const { isOpen, close } = useMobileNav();

  useEffect(() => {
    close();
    // Only re-run when the route actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const primaryNav: NavItem[] = [
    { href: '/dashboard', icon: RiDashboardLine, label: 'Dashboard' },
    { href: '/projects', icon: RiMusic2Line, label: 'My Projects' },
    { href: '/matches', icon: RiUserStarLine, label: 'Matches', count: matchesCount },
    { href: '/messages', icon: RiMessage3Line, label: 'Messages', count: messagesCount },
  ];

  const secondaryNav: NavItem[] = [
    { href: '/discover', icon: RiCompass3Line, label: 'Discover' },
    { href: '/settings', icon: RiSettings3Line, label: 'Settings' },
  ];

  const renderItem = ({ href, icon: Icon, label, count }: NavItem) => {
    const active = isActive(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        className={`flex items-center gap-2.5 rounded-app-md px-3 py-2.5 text-[13px] transition ${
          active ? 'bg-app-primary-light font-semibold text-app-primary' : 'font-medium text-app-fg-2 hover:bg-app-surface-2 hover:text-app-fg-1'
        }`}
      >
        <Icon size={17} />
        <span className="flex-1">{label}</span>
        {count ? (
          <span
            className={`rounded-app-pill px-1.5 py-0.5 text-[11px] font-semibold ${
              active ? 'bg-app-primary text-white' : 'bg-app-surface-2 text-app-fg-2'
            }`}
          >
            {count}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={close}
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[260px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-app-border bg-app-surface p-3 transition-transform duration-200 lg:static lg:z-auto lg:w-[220px] lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={close}
          className="mb-1 flex h-9 w-9 items-center justify-center self-end rounded-app-md text-app-fg-2 hover:bg-app-surface-2 lg:hidden"
        >
          <RiCloseLine size={18} />
        </button>
        {primaryNav.map(renderItem)}
        <div className="px-3 pb-1 pt-3.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-app-fg-3">
          Explore
        </div>
        {secondaryNav.map(renderItem)}
      </aside>
    </>
  );
}
