import { AppError } from '@/lib/appError';
import { CouponDiscountType, ICoupon } from '@/database/models/coupon';

export interface DiscountableItem {
  course: string;
  price: number;
}

function assertCouponUsable(coupon: ICoupon): void {
  if (!coupon.isActive) {
    throw new AppError('This coupon is no longer active', 400);
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    throw new AppError('This coupon has expired', 400);
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    throw new AppError('This coupon has reached its usage limit', 400);
  }
}

// Shared by both the cart's "apply coupon" preview and checkout's actual charge
// computation, so the two can never disagree about what a coupon is worth. Throws
// AppError(400) for any reason the coupon can't be applied right now; otherwise
// returns the discount amount, computed only against the subset of items the coupon
// is restricted to (if any restriction exists at all).
export function computeDiscount(coupon: ICoupon, items: DiscountableItem[]): number {
  assertCouponUsable(coupon);

  const restrictedTo = coupon.courseIds?.map((id) => id.toString());
  const eligible = restrictedTo?.length
    ? items.filter((item) => restrictedTo.includes(item.course))
    : items;

  if (eligible.length === 0) {
    throw new AppError('This coupon does not apply to any item in your cart', 400);
  }

  const eligibleSubtotal = eligible.reduce((sum, item) => sum + item.price, 0);
  const discount =
    coupon.discountType === CouponDiscountType.PERCENTAGE
      ? eligibleSubtotal * (coupon.value / 100)
      : Math.min(coupon.value, eligibleSubtotal);

  return Math.round(discount * 100) / 100;
}
