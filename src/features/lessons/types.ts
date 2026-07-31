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
