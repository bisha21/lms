import mongoose, { Schema } from 'mongoose';

export interface IReview extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  rating: number;
  createdAt: Date;
}

// Deliberately minimal — rating only, no text/moderation. Exists to back real
// sort/filter/aggregate-display on the public catalog and course detail pages; review
// submission (text, ownership checks, moderation) is separate, later work.
const reviewSchema = new Schema<IReview>({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

reviewSchema.index({ student: 1, course: 1 }, { unique: true });

export const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
