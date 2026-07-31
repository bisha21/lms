import mongoose, { Schema } from 'mongoose';

export interface ISection extends Document {
  course: mongoose.Types.ObjectId;
  title: string;
  order: number;
  createdAt: Date;
}

const sectionSchema = new Schema<ISection>({
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

sectionSchema.index({ course: 1, order: 1 });

export const Section = mongoose.models.Section || mongoose.model('Section', sectionSchema);
