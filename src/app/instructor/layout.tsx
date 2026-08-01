'use client';

import InstructorTopNav from '@/_component/instructor/InstructorTopNav';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Role } from '@/lib/rbac/roles';

export default function InstructorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { status } = useRequireAuth([Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR]);

  if (status === 'loading') {
    return <p className="p-10 text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-background">
      <InstructorTopNav />
      <main>{children}</main>
    </div>
  );
}
