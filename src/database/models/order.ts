import mongoose, { Schema } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface IOrderItem {
  course: mongoose.Types.ObjectId;
  title: string;
  price: number;
}

export interface IOrder extends Document {
  student: mongoose.Types.ObjectId;
  items: IOrderItem[];
  coupon?: mongoose.Types.ObjectId;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  status: OrderStatus;
  stripeCheckoutSessionId?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Items snapshot {course, title, price} at checkout time — a later price/coupon change
// must never retroactively change what was actually charged for a placed order.
const orderItemSchema = new Schema<IOrderItem>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: 'An order must have at least one item',
      },
    },
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'usd' },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    // Set immediately after the Stripe session is created — the webhook's idempotency
    // check looks orders up by this field, not by anything in the event payload.
    stripeCheckoutSessionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
