import { ICourse } from '@/features/courses/types';

export type CouponDiscountTypeValue = 'percentage' | 'fixed';

export interface ICoupon {
  _id: string;
  code: string;
  discountType: CouponDiscountTypeValue;
  value: number;
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
  courseIds?: string[];
  isActive: boolean;
}

export interface ICart {
  _id?: string;
  student: string;
  items: ICourse[];
  appliedCoupon?: ICoupon | null;
  updatedAt?: string;
}
