export interface ICoursePerformance {
  _id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  status: 'draft' | 'published';
  enrollmentCount: number;
  revenue: number;
  averageRating: number | null;
  completionRate: number | null;
  createdAt: string;
}

export interface ITrendPoint {
  date: string;
  amount?: number;
  count?: number;
}

export interface IActivityItem {
  type: 'enrollment' | 'review';
  courseTitle: string;
  actor: string;
  date: string;
  rating?: number;
}

export interface IInstructorDashboard {
  publishedCount: number;
  draftCount: number;
  totalRevenue: number;
  enrolledStudentsCount: number;
  averageRating: number | null;
  averageCompletionRate: number | null;
  revenueTrend: ITrendPoint[];
  enrollmentTrend: ITrendPoint[];
  recentActivity: IActivityItem[];
  coursePerformance: ICoursePerformance[];
}

export interface IInstructorStudentCourse {
  courseId: string;
  title: string;
  enrolledAt: string;
  percent: number;
}

export interface IInstructorStudent {
  _id: string;
  username: string;
  email: string;
  profileImage?: string;
  enrolledCourses: IInstructorStudentCourse[];
  totalSpent: number;
}

export interface IInstructorPayment {
  _id: string;
  courseTitle: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

export interface IInstructorRevenue {
  totalEarnings: number;
  thisMonthEarnings: number;
  transactionCount: number;
  averageOrderValue: number;
  revenueTrend: ITrendPoint[];
  payments: IInstructorPayment[];
}

export interface IInstructorRevenueParams {
  range?: '7d' | '30d' | '90d';
  page?: number;
  limit?: number;
  status?: string;
}

export interface IInstructorAnnouncement {
  _id: string;
  title: string;
  body: string;
  courseId: string;
  courseTitle: string;
  createdAt: string;
}

export interface ICreateAnnouncementData {
  course: string;
  title: string;
  body: string;
}
