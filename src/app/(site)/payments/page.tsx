'use client';

import { Receipt } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useMyPayments } from '@/features/payments/hooks';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Reveal from '@/_component/motion/Reveal';

const STATUS_VARIANT = {
  completed: 'success',
  pending: 'warning',
  failed: 'destructive',
} as const;

export default function PaymentsPage() {
  const { status } = useRequireAuth();
  const { data: payments = [] } = useMyPayments(status === 'authenticated');

  if (status === 'loading') return <p className="mx-auto max-w-4xl px-6 py-10 text-muted-foreground">Loading...</p>;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Reveal>
        <h1 className="mb-6 text-2xl font-bold text-foreground">Payment history</h1>
      </Reveal>

      {payments.length === 0 ? (
        <Reveal>
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <Receipt className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No payments yet.</p>
          </div>
        </Reveal>
      ) : (
        <Reveal>
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
                {payments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell className="font-medium text-foreground">{payment.course?.title}</TableCell>
                    <TableCell className="text-foreground">
                      {payment.amount} {payment.currency.toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[payment.status]}>{payment.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Reveal>
      )}
    </div>
  );
}
