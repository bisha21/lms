'use client';

import Dashboard from '@/_component/Dashboard';
import { useRequireAuth } from '@/hooks/useRequireAuth';

function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { status } = useRequireAuth('admin');

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  return <Dashboard>{children}</Dashboard>;
}

export default AdminLayout;
