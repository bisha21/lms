'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';

export default function CTASection() {
  const { data: session } = useSession();

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-primary px-8 py-10 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary-foreground">Ready to start learning?</h2>
          <p className="mt-1 max-w-md text-sm text-primary-foreground/80">
            Join thousands of students building real skills with hands-on courses.
          </p>
        </div>
        <div className="flex flex-shrink-0 gap-3">
          <Link href="/courses">
            <Button size="lg" variant="secondary">
              Browse courses
            </Button>
          </Link>
          {!session && (
            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                Get started
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
