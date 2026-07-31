import mongoose from 'mongoose';
import { slugify } from '@/lib/slugify';

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

export enum CourseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
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
  level?: CourseLevel;
  language: string;
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
  level: {
    type: String,
    enum: Object.values(CourseLevel),
  },
  language: {
    type: String,
    default: 'English',
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
