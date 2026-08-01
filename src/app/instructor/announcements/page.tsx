'use client';

import { FormEvent, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Megaphone } from 'lucide-react';

import { useCourses } from '@/features/courses/hooks';
import { useCreateAnnouncement, useInstructorAnnouncements } from '@/features/instructor/hooks';
import { Button } from '@/components/ui/button';
import SectionHeading from '@/_component/SectionHeading';
import { formatRelativeTime } from '@/lib/formatRelativeTime';

export default function InstructorAnnouncementsPage() {
  const { data: session } = useSession();
  const instructorId = session?.user?.id;

  const { data: coursesData } = useCourses(
    instructorId ? { instructor: instructorId, limit: 100 } : undefined
  );
  const courses = coursesData?.courses ?? [];

  const { data: announcements, isLoading } = useInstructorAnnouncements();
  const createAnnouncement = useCreateAnnouncement();

  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!courseId || !title || !body) return;
    createAnnouncement.mutate(
      { course: courseId, title, body },
      {
        onSuccess: () => {
          setTitle('');
          setBody('');
        },
      }
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <SectionHeading title="Announcements" subtitle="Post updates to students enrolled in your courses." />

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div>
          <label className="block text-sm font-medium text-foreground">Course</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. New lesson added"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={4}
            placeholder="What do you want to tell your students?"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <Button type="submit" disabled={createAnnouncement.isPending}>
          <Megaphone className="h-4 w-4" />
          Post announcement
        </Button>
      </form>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Past announcements</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !announcements || announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven&apos;t posted any announcements yet.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a._id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.courseTitle} &middot; {formatRelativeTime(a.createdAt)}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-foreground">{a.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
