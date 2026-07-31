export interface IProgressData {
  completedLessons: string[];
  totalLessons: number;
  percent: number;
  lastViewedLesson: string | null;
}

export interface IContinueLearningItem {
  course: {
    _id: string;
    title: string;
    slug: string;
    thumbnail?: string;
  };
  percent: number;
  lastViewedLesson: string | null;
}
