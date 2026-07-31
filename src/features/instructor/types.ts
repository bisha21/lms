export interface ICoursePerformance {
  _id: string;
  title: string;
  status: 'draft' | 'published';
  enrollmentCount: number;
  revenue: number;
  averageRating: number | null;
  completionRate: number | null;
}

export interface IInstructorDashboard {
  publishedCount: number;
  draftCount: number;
  totalRevenue: number;
  enrolledStudentsCount: number;
  coursePerformance: ICoursePerformance[];
}
