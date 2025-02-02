import mongoose, { Schema } from 'mongoose';
enum Status {
  Completed = 'completed',
  Pending = 'pending',
  Failed = 'failed',
}

interface IPayment {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  amount: number;
  status: Status;
}

const paymentSchema = new Schema<IPayment>({
  student: { type: Schema.Types.ObjectId, ref: 'Student' },
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  amount: { type: Number },
  status: {
    type: String,
    enum: Object.values(Status),
    default: Status.Pending,
  },
});

export const Payment =
  mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
