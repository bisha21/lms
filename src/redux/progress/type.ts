import { Status } from '../category/type';

export interface IProgressData {
  completedLessons: string[];
  totalLessons: number;
  percent: number;
}

export interface IProgressInitialState {
  byCourse: Record<string, IProgressData>;
  status: Status;
}
