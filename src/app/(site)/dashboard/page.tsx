'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Flame, Heart, Receipt } from 'lucide-react';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useMyEnrollments } from '@/features/enrollments/hooks';
import { useWishlist } from '@/features/wishlist/hooks';
import { useMyPayments } from '@/features/payments/hooks';
import { useContinueLearning } from '@/features/progress/hooks';
import StatTile from '@/_component/StatTile';
import SectionHeading from '@/_component/SectionHeading';
import CourseCard from '@/_component/course/CourseCard';
import ContinueLearningCard from '@/_component/dashboard/ContinueLearningCard';
import CourseTabs from '@/_component/dashboard/CourseTabs';
import Reveal from '@/_component/motion/Reveal';
import { Stagger, StaggerItem } from '@/_component/motion/Stagger';

type TabValue = 'all' | 'in-progress' | 'wishlist';

export default function StudentDashboardPage() {
  const { session, status } = useRequireAuth();
  const authed = status === 'authenticated';
  const [tab, setTab] = useState<TabValue>('all');

  const { data: continueLearning = [], isLoading: loadingContinue } = useContinueLearning(authed);
  const { data: enrollments = [] } = useMyEnrollments(authed);
  const { data: wishlist } = useWishlist(authed);
  const { data: payments = [] } = useMyPayments(authed);

  const progressByCourseId = useMemo(
    () => new Map(continueLearning.map((item) => [item.course._id, item.percent])),
    [continueLearning]
  );

  const wishlistItems = wishlist?.items ?? [];

  const visibleEnrollments = useMemo(() => {
    if (tab === 'in-progress') {
      return enrollments.filter((e) => progressByCourseId.has(e.course._id as string));
    }
    return enrollments;
  }, [enrollments, tab, progressByCourseId]);

  if (status === 'loading') {
    return <p className="mx-auto max-w-6xl px-6 py-10 text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Reveal>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your learning.</p>
      </Reveal>

      <Stagger className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem>
          <StatTile
            icon={BookOpen}
            value={enrollments.length}
            label="Enrolled courses"
            colorClassName="bg-palette-1-soft text-palette-1"
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            icon={Flame}
            value={continueLearning.length}
            label="In progress"
            colorClassName="bg-palette-4-soft text-palette-4"
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            icon={Heart}
            value={wishlistItems.length}
            label="Wishlist saved"
            colorClassName="bg-palette-5-soft text-palette-5"
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            icon={Receipt}
            value={payments.length}
            label="Payments"
            colorClassName="bg-palette-2-soft text-palette-2"
          />
        </StaggerItem>
      </Stagger>

      <section className="mt-10">
        <Reveal>
          <SectionHeading title="Continue learning" subtitle="Pick up right where you left off" />
        </Reveal>
        {loadingContinue ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : continueLearning.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No courses in progress yet.{' '}
            <Link href="/courses" className="font-medium text-brand hover:underline">
              Browse courses
            </Link>
            .
          </p>
        ) : (
          <Stagger className="flex gap-4 overflow-x-auto pb-2">
            {continueLearning.map((item) => (
              <StaggerItem key={item.course._id}>
                <ContinueLearningCard item={item} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>

      <section className="mt-10">
        <Reveal>
          <SectionHeading
            title="My courses"
            action={
              <Link href="/wishlist" className="text-sm font-medium text-brand hover:underline">
                View wishlist
              </Link>
            }
          />
        </Reveal>
        <div className="mb-5">
          <CourseTabs
            value={tab}
            onChange={(value) => setTab(value as TabValue)}
            options={[
              { value: 'all', label: 'All', count: enrollments.length },
              { value: 'in-progress', label: 'In Progress', count: continueLearning.length },
              { value: 'wishlist', label: 'Wishlist', count: wishlistItems.length },
              { value: 'certificates', label: 'Certificates', disabled: true },
            ]}
          />
        </div>

        {tab === 'wishlist' ? (
          wishlistItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your wishlist is empty.</p>
          ) : (
            <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {wishlistItems.map((course) => (
                <StaggerItem key={course._id}>
                  <CourseCard course={course} />
                </StaggerItem>
              ))}
            </Stagger>
          )
        ) : visibleEnrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {tab === 'in-progress'
              ? 'No courses in progress yet.'
              : 'You are not enrolled in any courses yet.'}{' '}
            <Link href="/courses" className="font-medium text-brand hover:underline">
              Browse the catalog
            </Link>
            .
          </p>
        ) : (
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleEnrollments.map((enrollment) => (
              <StaggerItem key={enrollment._id}>
                <CourseCard
                  course={enrollment.course}
                  href={`/courses/${enrollment.course.slug}/learn`}
                  showActions={false}
                  progress={progressByCourseId.get(enrollment.course._id as string)}
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>
    </div>
  );
}
