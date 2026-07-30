import { Status } from '../category/type';
import { ICourse } from '../courses/type';

export interface IEnrollment {
  _id: string;
  student: string;
  course: ICourse;
  enrolledAt: string;
}

export interface IEnrollmentInitialState {
  enrollments: IEnrollment[];
  status: Status;
}
