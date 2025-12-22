import { isAuthenticated } from '@/lib/auth';
import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return children;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>관리자 페이지</h1>
        <div
          className="nav"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', gap: '15px' }}>
            <Link href="/admin/pending">미확정 곡</Link>
            <Link href="/chart/1-50">공개 페이지</Link>
          </div>
          <LogoutButton />
        </div>
      </div>
      {children}
    </div>
  );
}
