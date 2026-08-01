'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Award, CheckCircle2, DollarSign, Download, Megaphone, Users } from 'lucide-react';

import { useInstructorDashboard } from '@/features/instructor/hooks';
import { Button } from '@/components/ui/button';
import StatTile from '@/_component/StatTile';
import SectionHeading from '@/_component/SectionHeading';
import BarChart from '@/_component/charts/BarChart';
import RecentActivityFeed from '@/_component/instructor/RecentActivityFeed';
import TopCoursesTable from '@/_component/instructor/TopCoursesTable';
import { downloadCsv } from '@/lib/exportCsv';

function formatShortDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export default function InstructorDashboardPage() {
  const { data: session } = useSession();
  const { data, isLoading } = useInstructorDashboard();

  const handleExport = () => {
    if (!data) return;
    downloadCsv(
      'course-performance.csv',
      data.coursePerformance.map((c) => ({
        Course: c.title,
        Status: c.status,
        Enrollments: c.enrollmentCount,
        Revenue: c.revenue,
        Rating: c.averageRating ?? '',
        'Completion Rate': c.completionRate ?? '',
      }))
    );
  };

  if (isLoading || !data) {
    return <p className="p-10 text-muted-foreground">Loading...</p>;
  }

  const firstName = session?.user?.name?.split(' ')[0];
  const topCourses = [...data.coursePerformance].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back{firstName ? `, ${firstName}` : ''}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track revenue, monitor enrollments, and keep your courses performing at their best.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Link href="/instructor/announcements">
            <Button>
              <Megaphone className="h-4 w-4" />
              Create Announcement
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={DollarSign}
          value={`$${data.totalRevenue.toFixed(2)}`}
          label="Total revenue"
          colorClassName="bg-palette-2-soft text-palette-2"
        />
        <StatTile
          icon={Users}
          value={data.enrolledStudentsCount}
          label="Total students"
          colorClassName="bg-palette-1-soft text-palette-1"
        />
        <StatTile
          icon={Award}
          value={data.averageRating !== null ? `${data.averageRating}/5` : '—'}
          label="Course rating"
          colorClassName="bg-palette-3-soft text-palette-3"
        />
        <StatTile
          icon={CheckCircle2}
          value={data.averageCompletionRate !== null ? `${data.averageCompletionRate}%` : '—'}
          label="Completion rate"
          colorClassName="bg-palette-6-soft text-palette-6"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeading
            className="mb-4"
            title="Revenue Analytics"
            subtitle="Revenue trend across your active catalog"
          />
          <BarChart
            data={data.revenueTrend.map((d) => ({ label: d.date, value: d.amount ?? 0 }))}
            colorClassName="bg-palette-2"
            formatLabel={formatShortDate}
            formatValue={(v) => `$${v.toFixed(2)}`}
          />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeading
            className="mb-4"
            title="Enrollment Analytics"
            subtitle="New enrollments across your courses"
          />
          <BarChart
            data={data.enrollmentTrend.map((d) => ({ label: d.date, value: d.count ?? 0 }))}
            colorClassName="bg-palette-1"
            formatLabel={formatShortDate}
            formatValue={(v) => `${v} enrollment${v === 1 ? '' : 's'}`}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeading className="mb-4" title="Recent Activity" subtitle="Latest enrollments and reviews" />
          <RecentActivityFeed items={data.recentActivity} />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeading className="mb-4" title="Top Performing Courses" subtitle="Sorted by revenue" />
          <TopCoursesTable courses={topCourses} />
        </div>
      </div>
    </div>
  );
}
