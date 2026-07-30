import SiteHeader from '@/_component/SiteHeader';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SiteHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
