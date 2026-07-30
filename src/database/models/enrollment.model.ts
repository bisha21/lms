import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  enrolledAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
});

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export const Enrollment =
  mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);
