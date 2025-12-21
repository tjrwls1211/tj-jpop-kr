'use server';

import { redirect } from 'next/navigation';
import { createSession } from '@/lib/auth';

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string;

  if (password === process.env.ADMIN_PASSWORD) {
    await createSession();
    redirect('/admin/pending');
  } else {
    redirect('/admin/login?error=1');
  }
}
