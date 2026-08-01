'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { PlayCircle, Sparkles } from 'lucide-react';

import { useCourses } from '@/features/courses/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RatingStars from '@/_component/RatingStars';
import Reveal from '@/_component/motion/Reveal';

export default function HeroSection() {
  const { data: session } = useSession();
  const { data } = useCourses({ sort: 'popular', limit: 1 });
  const featured = data?.courses[0];

  return (
    <section className="relative overflow-hidden border-b border-border bg-card">
      {/* Soft ambient glow blobs — pure CSS, no assets, always subtle enough not to fight copy */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 animate-float rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute -right-16 top-16 h-80 w-80 animate-float-slow rounded-full bg-palette-3/20 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        <div>
          <Reveal>
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              New courses added every week
            </Badge>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              Learn without limits.
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-4 max-w-md text-muted-foreground">
              Discover expert-led courses across web development, data science, design, marketing and
              more &mdash; and build skills that move your career forward.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/courses">
                <Button size="lg">
                  Start learning
                  <motion.span
                    className="inline-block"
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    →
                  </motion.span>
                </Button>
              </Link>
              {!session && (
                <Link href="/register">
                  <Button size="lg" variant="outline">
                    Create free account
                  </Button>
                </Link>
              )}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.3} y={24} className="relative">
          {featured ? (
            <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <Link
                href={`/courses/${featured.slug}`}
                className="group block overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-shadow hover:shadow-xl"
              >
                <div className="relative aspect-video w-full bg-muted">
                  {featured.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featured.thumbnail}
                      alt={featured.title}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                  <Badge variant="destructive" className="absolute left-3 top-3">
                    Featured
                  </Badge>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background/90 transition-transform group-hover:scale-110">
                      <PlayCircle className="h-8 w-8 text-brand" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 p-4">
                  <h3 className="font-semibold text-foreground">{featured.title}</h3>
                  <div className="flex items-center justify-between">
                    {typeof featured.averageRating === 'number' ? (
                      <RatingStars rating={featured.averageRating} reviewCount={featured.reviewCount} />
                    ) : (
                      <span className="text-xs text-muted-foreground">{featured.duration}</span>
                    )}
                    <span className="font-bold text-foreground">
                      {featured.coursePrice > 0 ? `$${featured.coursePrice}` : 'Free'}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ) : (
            <div className="aspect-video w-full rounded-2xl border border-dashed border-border" />
          )}
        </Reveal>
      </div>
    </section>
  );
}
