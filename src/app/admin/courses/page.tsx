'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Pencil, Plus, Search, Trash } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useCourses, useDeleteCourse, useTogglePublishCourse } from '@/features/courses/hooks';
import { closeModal, openModal } from '@/redux/modal/modalSlice';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Modal from '@/_component/Modal';
import CourseForm from '@/_component/CourseForm';
import SectionHeading from '@/_component/SectionHeading';
import Reveal from '@/_component/motion/Reveal';

function Courses() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data } = useCourses();
  const courses = data?.courses ?? [];
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const { isOpen, type, data: modalData } = useAppSelector((store) => store.modal);

  const dispatch = useAppDispatch();
  const deleteCourse = useDeleteCourse();
  const togglePublishCourse = useTogglePublishCourse();

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase())
  );
  const handleDelete = () => {
    if (modalData?._id) {
      deleteCourse.mutate(modalData._id);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <SectionHeading
        title="Courses"
        subtitle="Manage every course on the platform."
        action={
          <Button onClick={() => dispatch(openModal({ type: 'add' }))}>
            <Plus className="h-4 w-4" />
            Add Course
          </Button>
        }
      />

      <div className="relative mb-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm"
          placeholder="Search for course"
        />
      </div>

      <Reveal className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => {
                const categoryName =
                  typeof course.category === 'string' ? course.category : course.category?.name;
                return (
                  <TableRow key={course._id}>
                    <TableCell
                      onClick={() => router.push(`/admin/courses/${course._id}/builder`)}
                      className="cursor-pointer font-medium text-foreground hover:underline"
                    >
                      {course?.title}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {course.coursePrice > 0 ? `$${course.coursePrice}` : 'Free'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{course?.duration}</TableCell>
                    <TableCell className="text-muted-foreground">{categoryName}</TableCell>
                    <TableCell>
                      <button
                        onClick={() =>
                          togglePublishCourse.mutate({
                            id: course._id as string,
                            status: course.status === 'published' ? 'draft' : 'published',
                          })
                        }
                      >
                        <Badge variant={course.status === 'published' ? 'success' : 'secondary'}>
                          {course.status === 'published' ? 'Published' : 'Draft'}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => dispatch(openModal({ type: 'edit', data: course }))}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => dispatch(openModal({ type: 'delete', data: course }))}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No courses available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Reveal>

      <Modal
        open={isOpen && (type === 'add' || type === 'edit')}
        onOpenChange={(open) => !open && dispatch(closeModal())}
        header={{
          title: type === 'edit' ? 'Edit Course' : 'Add course',
          description:
            type === 'edit'
              ? 'Update the courses details.'
              : 'Fill out the form to add a new category.',
        }}
      >
        <CourseForm defaultValues={type === 'edit' ? modalData : undefined} />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isOpen && type === 'delete'}
        onOpenChange={(open) => !open && dispatch(closeModal())}
        header={{
          title: 'Delete Confirmation',
          description: 'Are you sure you want to delete this course?',
        }}
      >
        <div className="flex justify-between">
          <Button variant="destructive" onClick={handleDelete}>
            Yes, Delete
          </Button>
          <Button onClick={() => dispatch(closeModal())}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
      <Courses />
    </Suspense>
  );
}
