'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Clock, Heart } from 'lucide-react';

import { ICourse } from '@/features/courses/types';
import { useAddToCart } from '@/features/cart/hooks';
import { useAddToWishlist, useRemoveFromWishlist, useWishlist } from '@/features/wishlist/hooks';
import { cn } from '@/lib/utils';
import RatingStars from '@/_component/RatingStars';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CourseCardProps {
  course: ICourse;
  className?: string;
  /** Overrides the default `/courses/[slug]` link, e.g. to the course player for owned courses. */
  href?: string;
  /** Hides wishlist/add-to-cart controls, e.g. when the course is already owned. */
  showActions?: boolean;
  /** Optional progress bar shown under the price row (0-100). */
  progress?: number;
}

function getInstructorName(course: ICourse) {
  const instructor = course.instructor;
  if (instructor && typeof instructor === 'object') return instructor.username;
  return null;
}

export default function CourseCard({
  course,
  className,
  href,
  showActions = true,
  progress,
}: CourseCardProps) {
  const { data: session } = useSession();
  const authed = !!session;

  const { data: wishlist } = useWishlist(authed);
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const addToCart = useAddToCart();

  const isWishlisted = !!wishlist?.items.some((item) => item._id === course._id);
  const instructorName = getInstructorName(course);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!authed || !course._id) return;
    if (isWishlisted) removeFromWishlist.mutate(course._id);
    else addToWishlist.mutate(course._id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!authed || !course._id) return;
    addToCart.mutate(course._id);
  };

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} className="h-full">
      <Link
        href={href ?? `/courses/${course.slug}`}
        className={cn(
          'group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg',
          className
        )}
      >
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {course.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnail}
              alt={course.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              No preview
            </div>
          )}
          {course.level && (
            <Badge variant="secondary" className="absolute left-2 top-2 capitalize">
              {course.level}
            </Badge>
          )}
          {authed && showActions && (
            <button
              type="button"
              onClick={toggleWishlist}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={isWishlisted}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
            >
              <Heart className={cn('h-4 w-4', isWishlisted ? 'fill-wishlist text-wishlist' : 'text-foreground')} />
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          {instructorName && <p className="text-xs text-muted-foreground">{instructorName}</p>}
          <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">{course.title}</h3>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {typeof course.averageRating === 'number' && (
              <RatingStars rating={course.averageRating} reviewCount={course.reviewCount} />
            )}
            {course.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {course.duration}
              </span>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="text-lg font-bold text-foreground">
              {course.coursePrice > 0 ? `$${course.coursePrice}` : 'Free'}
            </span>
            {authed && showActions && course.coursePrice > 0 && (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={addToCart.isPending}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                Add to cart
              </button>
            )}
          </div>
          {typeof progress === 'number' && (
            <div className="pt-1">
              <Progress value={progress} className="h-1.5" />
              <p className="mt-1 text-xs text-muted-foreground">{progress}% complete</p>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
