'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { BookOpen, Pencil, Plus, Search, Star, Trash, Users } from 'lucide-react';

import { useCourses, useDeleteCourse, useTogglePublishCourse } from '@/features/courses/hooks';
import { ICourse } from '@/features/courses/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Modal from '@/_component/Modal';
import SectionHeading from '@/_component/SectionHeading';

export default function InstructorCoursesPage() {
  const { data: session } = useSession();
  const instructorId = session?.user?.id;
  const [search, setSearch] = useState('');
  const [deletingCourse, setDeletingCourse] = useState<ICourse | null>(null);

  const { data, isLoading } = useCourses(
    instructorId ? { instructor: instructorId, limit: 100, sort: 'newest' } : undefined
  );
  const togglePublish = useTogglePublishCourse();
  const deleteCourse = useDeleteCourse();

  const courses = (data?.courses ?? []).filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = () => {
    if (deletingCourse?._id) deleteCourse.mutate(deletingCourse._id);
    setDeletingCourse(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <SectionHeading
        title="My Courses"
        subtitle="Create, edit, and manage the courses you teach."
        action={
          <Link href="/instructor/courses/new">
            <Button>
              <Plus className="h-4 w-4" />
              New Course
            </Button>
          </Link>
        }
      />

      <div className="relative mb-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your courses"
          className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {search ? 'No courses match your search.' : "You haven't created any courses yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="p-4 font-medium">Course</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Enrollments</th>
                <th className="p-4 font-medium">Rating</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course._id} className="border-b border-border last:border-0">
                  <td className="p-4">
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
                      <span className="font-medium text-foreground">{course.title}</span>
                    </Link>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() =>
                        togglePublish.mutate({
                          id: course._id as string,
                          status: course.status === 'published' ? 'draft' : 'published',
                        })
                      }
                    >
                      <Badge variant={course.status === 'published' ? 'success' : 'secondary'}>
                        {course.status}
                      </Badge>
                    </button>
                  </td>
                  <td className="p-4 text-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {course.enrollmentCount ?? 0}
                    </span>
                  </td>
                  <td className="p-4 text-foreground">
                    {course.averageRating ? (
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-rating text-rating" />
                        {course.averageRating}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </td>
                  <td className="p-4 font-semibold text-foreground">${course.coursePrice}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Link href={`/instructor/courses/${course._id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => setDeletingCourse(course)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!deletingCourse}
        onOpenChange={(open) => !open && setDeletingCourse(null)}
        header={{
          title: 'Delete Confirmation',
          description: 'Are you sure you want to delete this course? This cannot be undone.',
        }}
      >
        <div className="flex justify-between">
          <Button variant="destructive" onClick={handleDelete}>
            Yes, Delete
          </Button>
          <Button onClick={() => setDeletingCourse(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
