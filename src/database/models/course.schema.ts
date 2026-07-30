import mongoose from 'mongoose';
import { slugify } from '@/lib/slugify';

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

interface Course extends Document {
  title: string;
  slug: string;
  courseDescription: string;
  coursePrice: number;
  thumbnail?: string;
  duration: string;
  category: mongoose.Types.ObjectId;
  instructor: mongoose.Types.ObjectId;
  status: CourseStatus;
  isDeleted: boolean;
  createdAt: Date;
}
const Schema = mongoose.Schema;
const courseSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  slug: {
    type: String,
    unique: true,
  },
  courseDescription: {
    type: String,
    required: true,
  },
  coursePrice: {
    type: Number,
    default: 0,
  },
  thumbnail: {
    type: String,
  },
  duration: {
    type: String,
    required: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
  },
  instructor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: Object.values(CourseStatus),
    default: CourseStatus.DRAFT,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

courseSchema.pre('save', function (next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title);
  }
  next();
});

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);
export default Course;
