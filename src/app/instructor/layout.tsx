'use client';

import { useState } from 'react';
import InstructorSidebar from '@/_component/instructor/InstructorSidebar';
import InstructorTopNav from '@/_component/instructor/InstructorTopNav';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Role } from '@/lib/rbac/roles';

export default function InstructorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { status } = useRequireAuth([Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (status === 'loading') {
    return <p className="p-10 text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <InstructorSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <InstructorTopNav onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
