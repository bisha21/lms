import { Status } from '../category/type';
import { ICategory } from '../category/type';

export type CourseStatusValue = 'draft' | 'published';

export interface ICourseForData {
  title: string;
  coursePrice: number;
  courseDescription: string;
  category: ICategory | string;
  duration: string;
  thumbnail?: string;
  status?: CourseStatusValue;
  _id?: string;
}

export interface ICourse extends ICourseForData {
  slug: string;
  createdAt: string;
}

export interface IInitialData {
  courses: ICourse[];
  status: Status;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}
