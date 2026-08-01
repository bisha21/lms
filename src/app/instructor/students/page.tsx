'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, BarChart3, CheckCircle2, Download, MoreHorizontal, Search, Users } from 'lucide-react';

import { useInstructorStudents } from '@/features/instructor/hooks';
import { IInstructorStudentRow } from '@/features/instructor/types';
import { downloadCsv } from '@/lib/exportCsv';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import StatTile from '@/_component/StatTile';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PAGE_SIZE = 10;

export default function InstructorStudentsPage() {
  const { data, isLoading } = useInstructorStudents();
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const rows = useMemo(() => data?.students ?? [], [data]);

  const courseOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) map.set(r.courseId, r.courseTitle);
    return [...map.entries()];
  }, [rows]);

  const filtered = rows.filter((r) => {
    const matchesCourse = courseFilter === 'all' || r.courseId === courseFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q || r.username.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
    return matchesCourse && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.enrollmentId));

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageRows.forEach((r) => next.delete(r.enrollmentId));
      } else {
        pageRows.forEach((r) => next.add(r.enrollmentId));
      }
      return next;
    });
  }

  function exportSelected() {
    const toExport =
      selected.size > 0 ? rows.filter((r) => selected.has(r.enrollmentId)) : filtered;
    downloadCsv(
      'students.csv',
      toExport.map((r: IInstructorStudentRow) => ({
        Student: r.username,
        Email: r.email,
        Course: r.courseTitle,
        Progress: `${r.percent}%`,
        'Last Active': r.lastActive,
        'Enrolled At': r.enrolledAt,
      }))
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <p className="mb-1 text-xs font-medium text-muted-foreground">Instructor Studio &gt; Students</p>
      <h1 className="text-2xl font-bold text-foreground">Student Management</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Monitor enrolled learners, track progress, and export insights across your courses.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <select
          value={courseFilter}
          onChange={(e) => {
            setCourseFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-56"
        >
          <option value="all">All Courses</option>
          {courseOptions.map(([id, title]) => (
            <option key={id} value={id}>
              {title}
            </option>
          ))}
        </select>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Find students by name or email"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm"
          />
        </div>
      </div>

      {isLoading || !data ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading...</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile icon={Users} value={data.totalStudents} label="Total students" colorClassName="bg-palette-1-soft text-palette-1" />
            <StatTile
              icon={Activity}
              value={data.activeThisWeek}
              label="Active this week"
              colorClassName="bg-palette-2-soft text-palette-2"
            />
            <StatTile
              icon={BarChart3}
              value={`${data.averageProgress}%`}
              label="Average progress"
              colorClassName="bg-palette-3-soft text-palette-3"
            />
            <StatTile
              icon={CheckCircle2}
              value={`${data.completionRate}%`}
              label="Completion rate"
              colorClassName="bg-palette-6-soft text-palette-6"
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selected.size > 0 ? `${selected.size} selected` : `${filtered.length} students`}
            </p>
            <Button variant="outline" size="sm" onClick={exportSelected}>
              <Download className="h-4 w-4" />
              Export{selected.size > 0 ? ' Selected' : ''}
            </Button>
          </div>

          <div className="mt-3 rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={allPageSelected} onCheckedChange={togglePage} aria-label="Select all" />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Enrolled Course</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      No students match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((row) => (
                    <TableRow key={row.enrollmentId}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(row.enrollmentId)}
                          onCheckedChange={() => toggleRow(row.enrollmentId)}
                          aria-label={`Select ${row.username}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-palette-1-soft text-xs font-semibold text-palette-1">
                            {row.profileImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={row.profileImage} alt="" className="h-full w-full object-cover" />
                            ) : (
                              row.username.slice(0, 1).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{row.username}</p>
                            <p className="truncate text-xs text-muted-foreground">#{row.studentId.slice(-6)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.email}</TableCell>
                      <TableCell className="text-sm text-foreground">{row.courseTitle}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={row.percent} className="h-2 w-24" />
                          <span className="text-xs text-muted-foreground">{row.percent}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelativeTime(row.lastActive)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/instructor/courses/${row.courseId}/curriculum`}>View course</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`mailto:${row.email}`}>Email student</a>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Prev
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={p === page ? 'default' : 'outline'}
                  className="h-9 w-9 p-0"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
