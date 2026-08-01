import Link from 'next/link';
import { Star } from 'lucide-react';

import { ICoursePerformance } from '@/features/instructor/types';
import { Badge } from '@/components/ui/badge';

interface TopCoursesTableProps {
  courses: ICoursePerformance[];
}

export default function TopCoursesTable({ courses }: TopCoursesTableProps) {
  if (courses.length === 0) {
    return <p className="text-sm text-muted-foreground">No courses yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="pb-2 font-medium">Course</th>
            <th className="pb-2 font-medium">Enrollments</th>
            <th className="pb-2 font-medium">Rating</th>
            <th className="pb-2 font-medium">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course._id} className="border-t border-border">
              <td className="py-3 pr-4">
                <Link
                  href={`/instructor/courses/${course._id}/curriculum`}
                  className="flex items-center gap-3 hover:text-brand"
                >
                  <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                    {course.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{course.title}</p>
                    <Badge variant={course.status === 'published' ? 'success' : 'secondary'} className="mt-0.5">
                      {course.status}
                    </Badge>
                  </div>
                </Link>
              </td>
              <td className="py-3 pr-4 text-foreground">{course.enrollmentCount}</td>
              <td className="py-3 pr-4 text-foreground">
                {course.averageRating !== null ? (
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-rating text-rating" />
                    {course.averageRating}
                  </span>
                ) : (
                  <span className="text-muted-foreground">&mdash;</span>
                )}
              </td>
              <td className="py-3 font-semibold text-foreground">${course.revenue.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
