'use client';

import { useState } from 'react';
import AdminSidebar from '@/_component/admin/AdminSidebar';
import AdminTopNav from '@/_component/admin/AdminTopNav';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Role } from '@/lib/rbac/roles';

function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { status } = useRequireAuth([Role.SUPER_ADMIN, Role.ADMIN]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (status === 'loading') {
    return <p className="p-10 text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopNav onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export default AdminLayout;
