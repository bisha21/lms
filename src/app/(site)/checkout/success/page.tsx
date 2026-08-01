'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useOrderStatus } from '@/features/orders/hooks';
import { Button } from '@/components/ui/button';

// Purely a status display — it only ever reads GET /api/orders/:id (see
// src/features/orders/hooks.ts / src/app/api/orders/order.controller.ts). It never calls
// anything that could grant enrollment itself; enrollment only happens inside the Stripe
// webhook handler once the payment is verified.
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-2xl px-6 py-10 text-center text-muted-foreground">Loading...</p>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessContent() {
  useRequireAuth();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') ?? '';
  const { data: order, isLoading } = useOrderStatus(orderId);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      {isLoading || !order ? (
        <p className="text-muted-foreground">Loading order...</p>
      ) : order.status === 'paid' ? (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft"
          >
            <CheckCircle2 className="h-9 w-9 text-success" />
          </motion.div>
          <h1 className="mb-3 mt-6 text-2xl font-bold text-foreground">You&apos;re enrolled!</h1>
          <p className="mb-6 text-muted-foreground">
            Payment confirmed for {order.items.length} course{order.items.length === 1 ? '' : 's'}.
          </p>
          <Link href="/my-courses">
            <Button size="lg">Go to My Courses</Button>
          </Link>
        </>
      ) : order.status === 'pending' ? (
        <>
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand" />
          <h1 className="mb-3 mt-6 text-2xl font-bold text-foreground">Processing your payment...</h1>
          <p className="text-muted-foreground">This usually only takes a few seconds.</p>
        </>
      ) : (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive-soft">
            <XCircle className="h-9 w-9 text-destructive" />
          </div>
          <h1 className="mb-3 mt-6 text-2xl font-bold text-foreground">Payment not completed</h1>
          <p className="text-muted-foreground">
            This order is marked &quot;{order.status}&quot;. If you were charged, contact support.
          </p>
        </>
      )}
    </div>
  );
}
