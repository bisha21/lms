'use client';

import Dashboard from '@/_component/Dashboard';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Role } from '@/lib/rbac/roles';

function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { status } = useRequireAuth([Role.SUPER_ADMIN, Role.ADMIN]);

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  return <Dashboard>{children}</Dashboard>;
}

export default AdminLayout;
