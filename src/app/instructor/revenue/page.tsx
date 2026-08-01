'use client';

import { useState } from 'react';
import { DollarSign, Receipt, TrendingUp, Wallet } from 'lucide-react';

import { useInstructorRevenue } from '@/features/instructor/hooks';
import { IInstructorRevenueParams } from '@/features/instructor/types';
import StatTile from '@/_component/StatTile';
import SectionHeading from '@/_component/SectionHeading';
import LineChart from '@/_component/charts/LineChart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const RANGE_OPTIONS: { value: NonNullable<IInstructorRevenueParams['range']>; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

function formatShortDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

const STATUS_VARIANT = {
  completed: 'success',
  pending: 'warning',
  failed: 'destructive',
} as const;

export default function InstructorRevenuePage() {
  const [range, setRange] = useState<NonNullable<IInstructorRevenueParams['range']>>('30d');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useInstructorRevenue({ range, page, limit: 10 });

  const revenue = data?.data;
  const meta = data?.meta;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <SectionHeading
        title="Revenue"
        subtitle="Track your earnings across all courses."
        action={
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setRange(opt.value);
                  setPage(1);
                }}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  range === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      />

      {isLoading || !revenue ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile
              icon={DollarSign}
              value={`$${revenue.totalEarnings.toFixed(2)}`}
              label="Total earnings"
              colorClassName="bg-palette-2-soft text-palette-2"
            />
            <StatTile
              icon={TrendingUp}
              value={`$${revenue.thisMonthEarnings.toFixed(2)}`}
              label="This month"
              colorClassName="bg-palette-1-soft text-palette-1"
            />
            <StatTile
              icon={Receipt}
              value={revenue.transactionCount}
              label="Transactions"
              colorClassName="bg-palette-3-soft text-palette-3"
            />
            <StatTile
              icon={Wallet}
              value={`$${revenue.averageOrderValue.toFixed(2)}`}
              label="Avg. order value"
              colorClassName="bg-palette-6-soft text-palette-6"
            />
          </div>

          <div className="mt-8 rounded-xl border border-border bg-card p-5">
            <SectionHeading className="mb-4" title="Revenue Analytics" subtitle={`Earnings trend across the last ${range}`} />
            <LineChart
              data={revenue.revenueTrend.map((d) => ({ label: d.date, value: d.amount ?? 0 }))}
              formatLabel={formatShortDate}
              formatValue={(v) => `$${v.toFixed(2)}`}
            />
          </div>

          <div className="mt-8">
            <SectionHeading className="mb-4" title="Transactions" subtitle="Search, filter, and review payment records." />
            <div className="rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenue.payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                        No transactions in this range.
                      </TableCell>
                    </TableRow>
                  ) : (
                    revenue.payments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell className="font-medium text-foreground">{payment.courseTitle}</TableCell>
                        <TableCell className="text-foreground">
                          {payment.currency.toUpperCase()} {payment.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[payment.status]}>{payment.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
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
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
