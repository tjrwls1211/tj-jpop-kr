'use client';

import { logout } from '@/app/admin/actions';
import { useState } from 'react';

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await logout();
    // Force full page reload/navigation to clear state and cache
    window.location.href = '/admin/login';
  };

  return (
    <button
      onClick={handleLogout}
      className="btn btn-secondary"
      disabled={isLoggingOut}
    >
      {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
    </button>
  );
}
