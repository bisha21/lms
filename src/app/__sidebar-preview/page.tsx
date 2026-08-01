'use client';

// TEMP, throwaway: forces an authenticated session so the sidebar can be screenshotted
// without a real Google OAuth login. Delete this route after visual verification.
import { SessionProvider } from 'next-auth/react';
import SiteShell from '@/_component/SiteShell';

const fakeSession = {
  user: { name: 'Alex Kim', email: 'alex.kim@seed.dev', role: 'student', id: 'preview' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

export default function SidebarPreviewPage() {
  return (
    <SessionProvider session={fakeSession as never} refetchInterval={0} refetchOnWindowFocus={false}>
      <SiteShell>
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="text-2xl font-bold text-foreground">Sidebar preview</h1>
          <p className="mt-2 text-muted-foreground">This page exists only to screenshot the sidebar.</p>
        </div>
      </SiteShell>
    </SessionProvider>
  );
}
