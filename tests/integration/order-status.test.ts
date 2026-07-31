import mongoose from 'mongoose';
import { beforeEach, describe, expect, it } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Enrollment } from '@/database/models/enrollment.model';
import { Order, OrderStatus } from '@/database/models/order';
import { getOrderStatus } from '@/app/api/orders/order.controller';
import { mockGetServerSession } from '../setup';

async function createPaidCourse() {
  const category = await Category.create({ name: `Category ${new mongoose.Types.ObjectId()}` });
  return Course.create({
    title: `Course ${new mongoose.Types.ObjectId()}`,
    courseDescription: 'desc',
    duration: '1h',
    category: category._id,
    coursePrice: 49,
    status: 'published',
  });
}

describe('GET /api/orders/:id — read-only status, never grants enrollment', () => {
  const studentId = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    await createConnection();
    mockGetServerSession.mockResolvedValue({ user: { id: studentId, role: 'student' } });
  });

  it('hitting the success route on a still-pending order never creates an enrollment, even called repeatedly (acceptance criterion)', async () => {
    const course = await createPaidCourse();
    const order = await Order.create({
      student: studentId,
      items: [{ course: course._id, title: course.title, price: 49 }],
      subtotal: 49,
      discount: 0,
      total: 49,
      currency: 'usd',
      status: OrderStatus.PENDING,
      stripeCheckoutSessionId: 'cs_test_never_paid',
    });

    for (let i = 0; i < 5; i++) {
      const response = await getOrderStatus(order._id.toString());
      const body = await response.json();
      expect(body.data.status).toBe('pending');
    }

    expect(await Enrollment.countDocuments({ student: studentId })).toBe(0);
    // The order itself must also be untouched — this route is truly read-only.
    expect((await Order.findById(order._id))?.status).toBe('pending');
  });

  it('404s for a non-existent order', async () => {
    await expect(getOrderStatus(new mongoose.Types.ObjectId().toString())).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("rejects a different student viewing someone else's order", async () => {
    const course = await createPaidCourse();
    const order = await Order.create({
      student: new mongoose.Types.ObjectId(),
      items: [{ course: course._id, title: course.title, price: 49 }],
      subtotal: 49,
      discount: 0,
      total: 49,
      status: OrderStatus.PENDING,
    });

    await expect(getOrderStatus(order._id.toString())).rejects.toMatchObject({ statusCode: 403 });
  });

  it.each([['super_admin'], ['admin']])('lets %s view any order', async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'admin-1', role } });
    const course = await createPaidCourse();
    const order = await Order.create({
      student: new mongoose.Types.ObjectId(),
      items: [{ course: course._id, title: course.title, price: 49 }],
      subtotal: 49,
      discount: 0,
      total: 49,
      status: OrderStatus.PAID,
    });

    const response = await getOrderStatus(order._id.toString());
    expect(response.status).toBe(200);
  });
});
