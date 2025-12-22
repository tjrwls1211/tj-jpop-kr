'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isLinkActive = (href: string) => {
    if (href === '/search') return pathname?.startsWith('/search');
    return pathname === href;
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && <div className="sidebar-logo">TJ J-POP</div>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="toggle-btn"
          aria-label={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
        >
          {isCollapsed ? (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          )}
        </button>
      </div>

      {/* Green Separator Line */}
      <div style={{ height: '2px', backgroundColor: 'var(--brand)', width: '100%', marginBottom: '20px', borderRadius: '1px' }}></div>

      <nav className="sidebar-nav">
        <Link href="/chart/1-50" className={`nav-link ${isLinkActive('/chart/1-50') ? 'active' : ''}`}>
          <HomeIcon />
          <span>TOP 1-50</span>
        </Link>
        <Link href="/chart/51-100" className={`nav-link ${isLinkActive('/chart/51-100') ? 'active' : ''}`}>
          <ListIcon />
          <span>TOP 51-100</span>
        </Link>
        <Link href="/search" className={`nav-link ${isLinkActive('/search') ? 'active' : ''}`}>
          <SearchIcon />
          <span>검색</span>
        </Link>
      </nav>

      <div className="sidebar-footer">
        <p className="footer-text">TJ 노래방 J-POP 인기 차트</p>
      </div>
    </div>
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
