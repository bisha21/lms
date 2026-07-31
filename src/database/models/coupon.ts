import mongoose, { Schema } from 'mongoose';

export enum CouponDiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export interface ICoupon extends Document {
  code: string;
  discountType: CouponDiscountType;
  value: number;
  expiresAt?: Date;
  maxUses?: number;
  usedCount: number;
  courseIds?: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
}

const couponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountType: {
    type: String,
    enum: Object.values(CouponDiscountType),
    required: true,
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },
  expiresAt: {
    type: Date,
  },
  maxUses: {
    type: Number,
    min: 1,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  courseIds: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
