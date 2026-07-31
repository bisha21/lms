import { ICourse } from '@/features/courses/types';

export interface IPayment {
  _id: string;
  student: string;
  course: ICourse;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  transactionId?: string;
  createdAt: string;
}
