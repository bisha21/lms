'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import Reveal from '@/_component/motion/Reveal';

export default function CTASection() {
  const { data: session } = useSession();

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <Reveal>
        <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl bg-primary px-8 py-10 sm:flex-row sm:items-center">
          <div
            className="pointer-events-none absolute inset-0 animate-shine bg-[length:200%_100%] opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(110deg, transparent 40%, hsl(var(--brand) / 0.35) 50%, transparent 60%)',
            }}
          />
          <div className="relative">
            <h2 className="text-2xl font-bold text-primary-foreground">Ready to start learning?</h2>
            <p className="mt-1 max-w-md text-sm text-primary-foreground/80">
              Join thousands of students building real skills with hands-on courses.
            </p>
          </div>
          <div className="relative flex flex-shrink-0 gap-3">
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
      </Reveal>
    </section>
  );
}
