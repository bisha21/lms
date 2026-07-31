export interface IProgressData {
  completedLessons: string[];
  totalLessons: number;
  percent: number;
  lastViewedLesson: string | null;
}
