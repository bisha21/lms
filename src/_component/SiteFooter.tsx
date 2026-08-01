import Link from 'next/link';

const LINK_GROUPS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Explore',
    links: [
      { label: 'Browse courses', href: '/courses' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'My courses', href: '/my-courses' },
      { label: 'Wishlist', href: '/wishlist' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', href: '/login' },
      { label: 'Create account', href: '/register' },
      { label: 'Cart', href: '/cart' },
      { label: 'Payments', href: '/payments' },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="text-lg font-bold text-brand">
            LMS
          </Link>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Learn without limits. Practical, expert-led courses to help you build real skills.
          </p>
        </div>
        {LINK_GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-6 py-6">
        <p className="mx-auto max-w-6xl text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} LMS. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
