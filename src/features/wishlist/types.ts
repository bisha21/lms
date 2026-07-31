import { ICourse } from '@/features/courses/types';

export interface IWishlist {
  _id?: string;
  student: string;
  items: ICourse[];
  updatedAt?: string;
}
