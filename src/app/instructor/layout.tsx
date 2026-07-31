'use client';

import SiteHeader from '@/_component/SiteHeader';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Role } from '@/lib/rbac/roles';

export default function InstructorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { status } = useRequireAuth([Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR]);

  if (status === 'loading') {
    return <p className="max-w-6xl mx-auto px-6 py-10">Loading...</p>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SiteHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
