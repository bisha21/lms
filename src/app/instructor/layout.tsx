'use client';

import { useState } from 'react';
import InstructorSidebar from '@/_component/sidebar/InstructorSidebar';
import InstructorTopbar from '@/_component/InstructorTopbar';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Role } from '@/lib/rbac/roles';

export default function InstructorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { status } = useRequireAuth([Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (status === 'loading') {
    return <p className="p-10 text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-background">
      <InstructorTopbar onOpenNav={() => setMobileNavOpen(true)} />
      <div className="flex">
        <InstructorSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
