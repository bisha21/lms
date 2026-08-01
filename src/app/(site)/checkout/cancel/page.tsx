'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Button } from '@/components/ui/button';
import Reveal from '@/_component/motion/Reveal';

export default function CheckoutCancelPage() {
  useRequireAuth();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <Reveal>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <XCircle className="h-9 w-9 text-muted-foreground" />
        </div>
        <h1 className="mb-3 mt-6 text-2xl font-bold text-foreground">Checkout cancelled</h1>
        <p className="mb-6 text-muted-foreground">No payment was made. Your cart is still here.</p>
        <Link href="/cart">
          <Button size="lg" variant="outline">
            Back to cart
          </Button>
        </Link>
      </Reveal>
    </div>
  );
}
