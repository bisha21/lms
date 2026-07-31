import { ILesson } from '@/features/lessons/types';

export interface ISection {
  _id: string;
  course: string;
  title: string;
  order: number;
  createdAt: string;
  lessons: ILesson[];
}
