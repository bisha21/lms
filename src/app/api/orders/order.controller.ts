import { createConnection } from '@/database/db';
import { Order } from '@/database/models/order';
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/appError';
import { bypassesOwnership } from '@/lib/rbac/permissions';
import { requireAuth } from '../../../../middleware/auth.middleware';

// Strictly read-only — this is what the checkout success page polls. It must never be
// able to grant enrollment; enrollment only ever happens inside the webhook handler
// (payment.controller.ts::handleWebhook) after Stripe signature verification.
export async function getOrderStatus(id: string) {
  await createConnection();
  const session = await requireAuth();

  const order = await Order.findById(id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  if (order.student.toString() !== session.user.id && !bypassesOwnership(session.user.role)) {
    throw new AppError('You do not have access to this order', 403);
  }

  return NextResponse.json({ data: order }, { status: 200 });
}
