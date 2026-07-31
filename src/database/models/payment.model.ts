import mongoose, { Schema } from 'mongoose';

export enum PaymentStatus {
  Completed = 'completed',
  Pending = 'pending',
  Failed = 'failed',
}

export interface IPayment {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transactionId?: string;
}

const paymentSchema = new Schema<IPayment>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'usd' },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.Pending,
    },
    transactionId: { type: String },
  },
  { timestamps: true }
);

export const Payment =
  mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
