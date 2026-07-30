import { Status } from '../category/type';
import { ICourse } from '../courses/type';

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

export interface IPaymentInitialState {
  payments: IPayment[];
  status: Status;
}
