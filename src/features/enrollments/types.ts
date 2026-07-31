import { ICourse } from '@/features/courses/types';

export interface IEnrollment {
  _id: string;
  student: string;
  course: ICourse;
  enrolledAt: string;
}
