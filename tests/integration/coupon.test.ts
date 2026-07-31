import { beforeEach, describe, expect, it } from 'vitest';
import { createConnection } from '@/database/db';
import { Coupon, CouponDiscountType } from '@/database/models/coupon';
import {
  createCoupon,
  deleteCoupon,
  getAllCoupons,
  updateCoupon,
} from '@/app/api/coupons/coupon.controller';
import { computeDiscount } from '@/lib/commerce/coupon';
import { mockGetServerSession } from '../setup';

function jsonRequest(body: unknown, method = 'POST') {
  return new Request('http://localhost/api/coupons', {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('coupon controller — RBAC', () => {
  beforeEach(async () => {
    await createConnection();
  });

  it.each([['instructor'], ['student']])('blocks %s from creating/listing coupons (403)', async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1', role } });

    await expect(
      createCoupon(jsonRequest({ code: 'X', discountType: 'fixed', value: 10 })),
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(getAllCoupons()).rejects.toMatchObject({ statusCode: 403 });
  });

  it.each([['super_admin'], ['admin']])('lets %s create, list, update, and delete coupons', async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'admin-1', role } });

    const createResponse = await createCoupon(
      jsonRequest({ code: 'welcome10', discountType: 'percentage', value: 10 }),
    );
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()).data;
    expect(created.code).toBe('WELCOME10'); // stored uppercase

    const listResponse = await getAllCoupons();
    expect((await listResponse.json()).data).toHaveLength(1);

    const updateResponse = await updateCoupon(jsonRequest({ value: 15 }, 'PATCH'), created._id);
    expect((await updateResponse.json()).data.value).toBe(15);

    const deleteResponse = await deleteCoupon(created._id);
    expect(deleteResponse.status).toBe(200);
    expect(await Coupon.countDocuments({})).toBe(0);
  });

  it('rejects a percentage discount over 100', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });

    await expect(
      createCoupon(jsonRequest({ code: 'TOOMUCH', discountType: 'percentage', value: 150 })),
    ).rejects.toThrow();
  });
});

describe('computeDiscount', () => {
  const items = [
    { course: 'course-a', price: 100 },
    { course: 'course-b', price: 50 },
  ];

  it('computes a percentage discount across the whole cart', () => {
    const coupon = { discountType: CouponDiscountType.PERCENTAGE, value: 20, isActive: true } as never;
    expect(computeDiscount(coupon, items)).toBe(30); // 20% of 150
  });

  it('computes a fixed discount, clamped to the eligible subtotal', () => {
    const coupon = { discountType: CouponDiscountType.FIXED, value: 500, isActive: true } as never;
    expect(computeDiscount(coupon, items)).toBe(150); // clamped, not 500
  });

  it('restricts the discount to only the courseIds it applies to', () => {
    const coupon = {
      discountType: CouponDiscountType.PERCENTAGE,
      value: 50,
      isActive: true,
      courseIds: [{ toString: () => 'course-a' }],
    } as never;
    expect(computeDiscount(coupon, items)).toBe(50); // 50% of just course-a's 100
  });

  it('throws when the coupon matches none of the cart items', () => {
    const coupon = {
      discountType: CouponDiscountType.FIXED,
      value: 10,
      isActive: true,
      courseIds: [{ toString: () => 'course-z' }],
    } as never;
    expect(() => computeDiscount(coupon, items)).toThrow();
  });

  it('throws for an inactive coupon', () => {
    const coupon = { discountType: CouponDiscountType.FIXED, value: 10, isActive: false } as never;
    expect(() => computeDiscount(coupon, items)).toThrow();
  });

  it('throws for an exhausted coupon (maxUses reached)', () => {
    const coupon = {
      discountType: CouponDiscountType.FIXED,
      value: 10,
      isActive: true,
      maxUses: 5,
      usedCount: 5,
    } as never;
    expect(() => computeDiscount(coupon, items)).toThrow();
  });

  it('throws for an expired coupon', () => {
    const coupon = {
      discountType: CouponDiscountType.FIXED,
      value: 10,
      isActive: true,
      expiresAt: new Date(Date.now() - 1000),
    } as never;
    expect(() => computeDiscount(coupon, items)).toThrow();
  });
});
