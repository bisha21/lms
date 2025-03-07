'use client';

import Dashboard from '@/_component/Dashboard';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { data: session, status } = useSession(); // Use correct destructuring
  const router = useRouter();
  console.log('Data from admin', session);

  useEffect(() => {
    if (status === 'loading') return;

    console.log('Session Data:', session); // Debugging log

    if (!session || session.user?.role !== 'admin') {
      router.push('/');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  return <Dashboard>{children}</Dashboard>;
}

export default AdminLayout;
