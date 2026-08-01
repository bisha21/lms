'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getRoleHomePath } from '@/lib/getRoleHomePath';

export function useRedirectIfAuthed() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (session) {
      router.push(getRoleHomePath(session.user?.role));
    }
  }, [session, status, router]);

  return { session, status };
}
