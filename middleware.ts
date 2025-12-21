import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginPage = request.nextUrl.pathname === '/admin/login';

  if (isAdminRoute && !isLoginPage) {
    const sessionCookieName = process.env.SESSION_COOKIE_NAME || 'admin_session';
    const session = request.cookies.get(sessionCookieName);
    const sessionSecret = process.env.SESSION_SECRET;

    if (!sessionSecret) {
      console.error('SESSION_SECRET is not set');
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    if (!session || session.value !== sessionSecret) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
