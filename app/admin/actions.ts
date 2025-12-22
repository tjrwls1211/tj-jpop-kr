'use server';

import { deleteSession } from '@/lib/auth';

export async function logout() {
  await deleteSession();
  // No redirect here - allowing client to handle hard navigation
}
