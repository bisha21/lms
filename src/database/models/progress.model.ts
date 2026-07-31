import mongoose, { Schema } from 'mongoose';

export interface IProgress extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  completedLessons: mongoose.Types.ObjectId[];
  lastViewedLesson?: mongoose.Types.ObjectId;
}

const progressSchema = new Schema<IProgress>({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  completedLessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
  // The resume pointer — updated whenever an enrolled student actually views a lesson's
  // content (GET /api/lessons/:id), not just when they mark one complete.
  lastViewedLesson: { type: Schema.Types.ObjectId, ref: 'Lesson' },
});

progressSchema.index({ student: 1, course: 1 }, { unique: true });

export const Progress =
  mongoose.models.Progress || mongoose.model('Progress', progressSchema);
