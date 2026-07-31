import mongoose, { Schema } from 'mongoose';

export interface ICart extends Document {
  student: mongoose.Types.ObjectId;
  items: mongoose.Types.ObjectId[];
  appliedCoupon?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const cartSchema = new Schema<ICart>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    appliedCoupon: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
    },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
