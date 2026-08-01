'use client';

import { DollarSign, GraduationCap, Presentation, BookOpen } from 'lucide-react';

import { useAdminDashboard } from '@/features/admin/hooks';
import StatTile from '@/_component/StatTile';
import SectionHeading from '@/_component/SectionHeading';
import BarChart from '@/_component/charts/BarChart';
import Reveal from '@/_component/motion/Reveal';
import { Stagger, StaggerItem } from '@/_component/motion/Stagger';
import { formatRelativeTime } from '@/lib/formatRelativeTime';

const ACTIVITY_LABEL: Record<string, string> = {
  enrollment: 'Enrollment',
  payment: 'Sale',
  review: 'Review',
  course: 'New course',
};

export default function AdminPage() {
  const { data, isLoading } = useAdminDashboard();

  if (isLoading || !data) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="mx-auto max-w-7xl">
      <SectionHeading title="Admin Dashboard" subtitle="Platform-wide revenue, growth, and activity." />

      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem>
          <StatTile
            icon={DollarSign}
            value={`$${data.totalRevenue.toFixed(2)}`}
            label="Total revenue"
            colorClassName="bg-palette-2-soft text-palette-2"
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            icon={GraduationCap}
            value={data.studentCount}
            label="Students"
            colorClassName="bg-palette-1-soft text-palette-1"
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            icon={Presentation}
            value={data.instructorCount}
            label="Instructors"
            colorClassName="bg-palette-3-soft text-palette-3"
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            icon={BookOpen}
            value={data.courseCount}
            label="Courses"
            colorClassName="bg-palette-6-soft text-palette-6"
          />
        </StaggerItem>
      </Stagger>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Reveal className="rounded-xl border border-border bg-card p-5">
          <SectionHeading className="mb-4" title="Sales trend" subtitle="Last 30 days" />
          <BarChart
            data={data.salesTrend.map((p) => ({ label: p.date, value: p.revenue }))}
            colorClassName="bg-palette-2"
            formatValue={(v) => `$${v.toFixed(2)}`}
          />
        </Reveal>

        <Reveal delay={0.1} className="rounded-xl border border-border bg-card p-5">
          <SectionHeading className="mb-4" title="Recent activity" />
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.recentActivity.map((item, i) => (
                <li key={i} className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-foreground">
                    <span className="mr-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {ACTIVITY_LABEL[item.type] ?? item.type}
                    </span>
                    {item.message}
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                    {formatRelativeTime(item.date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Reveal>
      </div>
    </div>
  );
}
