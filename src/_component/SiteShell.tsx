'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Menu } from 'lucide-react';

import SiteHeader from '@/_component/SiteHeader';
import SiteFooter from '@/_component/SiteFooter';
import StudentSidebar from '@/_component/sidebar/StudentSidebar';

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Signed-in students get a persistent sidebar instead of the marketing top nav; visitors
  // (and the brief window while the session is resolving) see the normal marketing layout.
  if (status === 'authenticated' && session) {
    return (
      <div className="flex min-h-screen bg-background md:flex-row">
        <StudentSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-14 items-center border-b border-border px-4 md:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              className="text-foreground"
            >
              <Menu className="h-6 w-6" />
            </button>
            <span className="ml-3 text-base font-bold text-brand">LMS</span>
          </div>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
