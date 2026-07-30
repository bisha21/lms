import mongoose, { Schema } from 'mongoose';

export interface ILesson extends Document {
  course: mongoose.Types.ObjectId;
  title: string;
  description: string;
  videoUrl: string;
  videoPublicId?: string;
  order: number;
  durationSeconds?: number;
  createdAt: Date;
}
const lessonSchema = new Schema<ILesson>({
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  videoUrl: {
    type: String,
    required: true,
  },
  videoPublicId: {
    type: String,
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
  durationSeconds: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

lessonSchema.index({ course: 1, order: 1 });

export const Lesson = mongoose.models.Lesson || mongoose.model('Lesson', lessonSchema);
