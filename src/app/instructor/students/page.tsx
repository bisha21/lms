'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';

import { useInstructorStudents } from '@/features/instructor/hooks';
import SectionHeading from '@/_component/SectionHeading';
import { Progress } from '@/components/ui/progress';

export default function InstructorStudentsPage() {
  const { data: students, isLoading } = useInstructorStudents();
  const [search, setSearch] = useState('');

  const filtered = (students ?? []).filter(
    (s) =>
      s.username.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <SectionHeading title="Students" subtitle="Everyone enrolled across your courses." />

      <div className="mb-6 max-w-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {search ? 'No students match your search.' : 'No students enrolled yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((student) => (
            <div key={student._id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-palette-1-soft text-sm font-semibold text-palette-1">
                    {student.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={student.profileImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      student.username.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{student.username}</p>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">${student.totalSpent.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">total spent</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-border pt-4">
                {student.enrolledCourses.map((course) => (
                  <div key={course.courseId} className="flex items-center gap-3">
                    <span className="w-48 shrink-0 truncate text-sm text-foreground">{course.title}</span>
                    <Progress value={course.percent} className="h-2 flex-1" />
                    <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                      {course.percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
