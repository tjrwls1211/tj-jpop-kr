import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'admin_session';

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not set');
  }
  return secret;
}

export async function createSession() {
  const cookieStore = await cookies();
  const secret = getSessionSecret();
  cookieStore.set(SESSION_COOKIE_NAME, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  const secret = getSessionSecret();
  return session?.value === secret;
}
