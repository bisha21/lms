import { ICategory } from '@/features/categories/types';

export type CourseStatusValue = 'draft' | 'published';
export type CourseLevelValue = 'beginner' | 'intermediate' | 'advanced';

export interface IInstructorSummary {
  _id: string;
  username: string;
  profileImage?: string;
}

export interface ICourseForData {
  title: string;
  subtitle?: string;
  coursePrice: number;
  courseDescription: string;
  category: ICategory | string;
  duration: string;
  thumbnail?: string;
  status?: CourseStatusValue;
  level?: CourseLevelValue;
  language?: string;
  _id?: string;
}

export interface ICourse extends ICourseForData {
  slug: string;
  createdAt: string;
  instructor?: IInstructorSummary | string;
  averageRating?: number | null;
  reviewCount?: number;
  enrollmentCount?: number;
  salesCount?: number;
}

export interface ICoursesMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
