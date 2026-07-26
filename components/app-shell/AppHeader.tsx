'use client';

import Link from 'next/link';
import { RiNotification3Line, RiMessage3Line, RiQuestionLine, RiSearchLine, RiMenuLine } from '@remixicon/react';
import { Avatar } from '@/components/ui/Avatar';
import { useMobileNav } from './MobileNavContext';

type AppHeaderProps = {
  role: string;
  displayName: string;
};

const roleLabels: Record<string, string> = {
  artist: 'Artist',
  pro: 'Pro',
  both: 'Artist & Pro',
};

const iconButtonClass =
  'flex h-9 w-9 items-center justify-center rounded-app-md border border-app-border bg-app-surface-2 text-app-fg-2 transition hover:border-app-border hover:bg-app-border hover:text-app-fg-1';

export function AppHeader({ role, displayName }: AppHeaderProps) {
  const { toggle } = useMobileNav();

  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-3.5 border-b border-app-border bg-app-surface px-4 sm:px-5">
      <button type="button" aria-label="Open menu" onClick={toggle} className={`${iconButtonClass} lg:hidden`}>
        <RiMenuLine size={18} />
      </button>

      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] bg-app-logo">
          <span className="text-[15px] font-extrabold text-white">M</span>
        </div>
        <span className="hidden text-[15px] font-bold tracking-[-0.01em] text-app-fg-1 sm:inline">musion</span>
      </Link>

      <div className="ml-2 hidden rounded-app-md border border-app-border bg-app-surface px-3 py-1.5 text-[13px] font-medium text-app-fg-1 sm:block">
        {roleLabels[role] ?? 'Artist'}
      </div>

      <div className="relative ml-2 max-w-[360px] flex-1">
        <label htmlFor="app-header-search" className="sr-only">
          Search
        </label>
        <RiSearchLine size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-app-fg-3" />
        <input
          id="app-header-search"
          className="w-full rounded-app-md border border-app-border bg-app-surface-2 py-2.5 pl-9 pr-3.5 text-[13px] text-app-fg-1 outline-none transition placeholder:text-app-fg-3 focus:border-app-border-focus"
          placeholder="Search"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button type="button" aria-label="Notifications" className={`${iconButtonClass} hidden sm:flex`}>
          <RiNotification3Line size={18} />
        </button>
        <Link href="/messages" aria-label="Messages" className={`${iconButtonClass} hidden sm:flex`}>
          <RiMessage3Line size={18} />
        </Link>
        <button type="button" aria-label="Help" className={`${iconButtonClass} hidden sm:flex`}>
          <RiQuestionLine size={18} />
        </button>
        <Link href="/profile" aria-label="Your profile">
          <Avatar name={displayName} size="sm" status="online" />
        </Link>
      </div>
    </header>
  );
}
