import { Status } from '../category/type';

export interface ILesson {
  _id: string;
  course: string;
  title: string;
  description: string;
  videoUrl: string;
  order: number;
  durationSeconds?: number;
  createdAt: string;
}

export interface ILessonInitialState {
  lessons: ILesson[];
  status: Status;
}
