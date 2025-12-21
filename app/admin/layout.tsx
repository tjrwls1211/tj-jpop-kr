import { isAuthenticated, deleteSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

async function logoutAction() {
  'use server';
  await deleteSession();
  redirect('/admin/login');
}

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
          <form action={logoutAction}>
            <button type="submit" className="btn btn-secondary">
              로그아웃
            </button>
          </form>
        </div>
      </div>
      {children}
    </div>
  );
}
