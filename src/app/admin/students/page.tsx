'use client';

import { Receipt, Users } from 'lucide-react';

import { useAdminOverview } from '@/features/admin/hooks';
import StatTile from '@/_component/StatTile';
import SectionHeading from '@/_component/SectionHeading';
import Reveal from '@/_component/motion/Reveal';
import { Stagger, StaggerItem } from '@/_component/motion/Stagger';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminStudentsPage() {
  const { data: rows = [], isLoading } = useAdminOverview();

  const totalEnrollments = rows.reduce((sum, r) => sum + r.enrollmentCount, 0);
  const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="mx-auto max-w-7xl">
      <SectionHeading title="Enrollments &amp; Revenue" subtitle="Per-course enrollment and revenue breakdown." />

      <Stagger className="mb-6 grid max-w-md grid-cols-2 gap-4">
        <StaggerItem>
          <StatTile
            icon={Users}
            value={totalEnrollments}
            label="Total enrollments"
            colorClassName="bg-palette-1-soft text-palette-1"
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            icon={Receipt}
            value={`$${totalRevenue.toFixed(2)}`}
            label="Total revenue"
            colorClassName="bg-palette-2-soft text-palette-2"
          />
        </StaggerItem>
      </Stagger>

      <Reveal className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Enrollments</TableHead>
              <TableHead>Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No courses yet
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell className="font-medium text-foreground">{row.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.coursePrice > 0 ? `$${row.coursePrice}` : 'Free'}
                  </TableCell>
                  <TableCell className="text-foreground">{row.enrollmentCount}</TableCell>
                  <TableCell className="font-semibold text-foreground">${row.revenue.toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Reveal>
    </div>
  );
}
