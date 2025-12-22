'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === '/search') return pathname?.startsWith('/search');
    return pathname === href;
  };

  return (
    <nav className="bottom-nav">
      <Link href="/chart/1-50" className={`bottom-nav-link ${isLinkActive('/chart/1-50') ? 'active' : ''}`}>
        <HomeIcon />
        <span>1-50</span>
      </Link>
      <Link href="/chart/51-100" className={`bottom-nav-link ${isLinkActive('/chart/51-100') ? 'active' : ''}`}>
        <ListIcon />
        <span>51-100</span>
      </Link>
      <Link href="/search" className={`bottom-nav-link ${isLinkActive('/search') ? 'active' : ''}`}>
        <SearchIcon />
        <span>검색</span>
      </Link>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="nav-icon">
      <path d="M12.5 3.2L3 11v10h6v-6h6v6h6V11l-8.5-7.8a.7.7 0 0 0-1 0z" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="nav-icon">
      <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="nav-icon">
      <path d="M10.5 3a7.5 7.5 0 0 1 5.6 12.4l4.2 4.2-1.4 1.4-4.2-4.2A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z" />
    </svg>
  )
}
