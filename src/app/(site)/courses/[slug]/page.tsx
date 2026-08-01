'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircle2, Clock, Globe, Heart, Lock, PlayCircle, ShoppingCart } from 'lucide-react';

import { useCourseBySlug } from '@/features/courses/hooks';
import { useEnrollInCourse, useMyEnrollments } from '@/features/enrollments/hooks';
import { useCheckoutCourse } from '@/features/payments/hooks';
import { useAddToCart, useCart } from '@/features/cart/hooks';
import { useAddToWishlist, useRemoveFromWishlist, useWishlist } from '@/features/wishlist/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RatingStars from '@/_component/RatingStars';
import Reveal from '@/_component/motion/Reveal';
import { Stagger, StaggerItem } from '@/_component/motion/Stagger';
import { cn } from '@/lib/utils';

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { data, isLoading } = useCourseBySlug(slug);
  const { data: enrollments = [] } = useMyEnrollments(!!session);
  const { data: cart } = useCart(!!session);
  const { data: wishlist } = useWishlist(!!session);
  const enrollInCourse = useEnrollInCourse();
  const checkoutCourse = useCheckoutCourse();
  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const course = data?.course;
  const lessons = data?.lessons ?? [];
  const actionLoading = enrollInCourse.isPending || checkoutCourse.isPending;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-6 py-10">
        <div className="h-8 w-2/3 rounded bg-muted" />
        <div className="mt-4 h-4 w-1/2 rounded bg-muted" />
        <div className="mt-8 aspect-video w-full rounded-2xl bg-muted" />
      </div>
    );
  }
  if (!course) return <p className="mx-auto max-w-4xl px-6 py-10 text-muted-foreground">Course not found.</p>;

  const isEnrolled = enrollments.some((e) => e.course?._id === course._id);
  const isInCart = cart?.items.some((item) => item._id === course._id) ?? false;
  const isWishlisted = wishlist?.items.some((item) => item._id === course._id) ?? false;
  const instructor = typeof course.instructor === 'string' ? null : course.instructor;

  const handleEnrollOrBuy = async () => {
    if (!session) {
      router.push('/login');
      return;
    }
    try {
      if (course.coursePrice > 0) {
        await checkoutCourse.mutateAsync(course._id as string);
      } else {
        await enrollInCourse.mutateAsync(course._id as string);
        router.push(`/courses/${course.slug}/learn`);
      }
    } catch {
      // toasted by the mutation's onError; stay on the page.
    }
  };

  const requireAuth = (action: () => void) => {
    if (!session) {
      router.push('/login');
      return;
    }
    action();
  };

  return (
    <div>
      {/* Hero band */}
      <div className="relative overflow-hidden border-b border-border bg-card">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-brand/15 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-10">
          <Reveal>
            {course.level && (
              <Badge variant="secondary" className="mb-3 capitalize">
                {course.level}
              </Badge>
            )}
            <h1 className="max-w-3xl text-3xl font-bold text-foreground sm:text-4xl">{course.title}</h1>
            {course.subtitle && <p className="mt-3 max-w-2xl text-muted-foreground">{course.subtitle}</p>}
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {typeof data?.averageRating === 'number' && (
                <RatingStars rating={data.averageRating} reviewCount={data.reviewCount} size="md" />
              )}
              {course.duration && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {course.duration}
                </span>
              )}
              {course.language && (
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  {course.language}
                </span>
              )}
            </div>
          </Reveal>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-3 lg:items-start">
        {/* Purchase card — first on mobile (the actual buy decision), sticky sidebar on desktop */}
        <Reveal y={24} className="order-first lg:sticky lg:top-20 lg:order-last">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="relative aspect-video w-full bg-muted">
              {course.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <PlayCircle className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="space-y-4 p-5">
              <p className="text-3xl font-bold text-foreground">
                {course.coursePrice > 0 ? `$${course.coursePrice}` : 'Free'}
              </p>

              {isEnrolled ? (
                <Button className="w-full" size="lg" onClick={() => router.push(`/courses/${course.slug}/learn`)}>
                  <CheckCircle2 className="h-4 w-4" />
                  Continue Learning
                </Button>
              ) : (
                <>
                  <Button className="w-full" size="lg" onClick={handleEnrollOrBuy} disabled={actionLoading}>
                    {course.coursePrice > 0 ? `Buy for $${course.coursePrice}` : 'Enroll for free'}
                  </Button>
                  {course.coursePrice > 0 && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        disabled={isInCart || addToCart.isPending}
                        onClick={() => requireAuth(() => addToCart.mutate(course._id as string))}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {isInCart ? 'In Cart' : 'Add to Cart'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                        onClick={() =>
                          requireAuth(() =>
                            isWishlisted
                              ? removeFromWishlist.mutate(course._id as string)
                              : addToWishlist.mutate(course._id as string)
                          )
                        }
                      >
                        <Heart className={cn('h-4 w-4', isWishlisted && 'fill-wishlist text-wishlist')} />
                      </Button>
                    </div>
                  )}
                </>
              )}

              {instructor && (
                <div className="flex items-center gap-3 border-t border-border pt-4">
                  {instructor.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={instructor.profileImage}
                      alt={instructor.username}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-palette-1-soft text-sm font-semibold text-palette-1">
                      {instructor.username.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Instructor</p>
                    <p className="font-medium text-foreground">{instructor.username}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Reveal>

        {/* Main content */}
        <div className="space-y-10 lg:col-span-2">
          {course.courseDescription && (
            <Reveal>
              <h2 className="mb-3 text-xl font-semibold text-foreground">About this course</h2>
              <p className="whitespace-pre-line text-muted-foreground">{course.courseDescription}</p>
            </Reveal>
          )}

          <div>
            <Reveal>
              <h2 className="mb-4 text-xl font-semibold text-foreground">
                Curriculum{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  &middot; {lessons.length} lesson{lessons.length === 1 ? '' : 's'}
                </span>
              </h2>
            </Reveal>
            {lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">Curriculum coming soon.</p>
            ) : (
              <Stagger className="space-y-2">
                {lessons.map((lesson, i) => (
                  <StaggerItem key={lesson._id}>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                      <span className="flex items-center gap-3 text-foreground">
                        <PlayCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {i + 1}. {lesson.title}
                      </span>
                      {!isEnrolled && <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="Locked" />}
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </div>

          <Reveal>
            <h2 className="mb-4 text-xl font-semibold text-foreground">Reviews</h2>
            {data?.reviewCount ? (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                <span className="text-2xl font-bold text-foreground">{data.averageRating}</span>
                <div>
                  <RatingStars rating={data.averageRating ?? 0} size="md" />
                  <p className="text-xs text-muted-foreground">
                    {data.reviewCount} rating{data.reviewCount === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No ratings yet.</p>
            )}
          </Reveal>
        </div>
      </div>
    </div>
  );
}
