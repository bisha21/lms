export interface IOverviewRow {
  _id: string;
  title: string;
  coursePrice: number;
  enrollmentCount: number;
  revenue: number;
}

export interface ISalesTrendPoint {
  date: string;
  revenue: number;
}

export interface IActivityItem {
  type: 'enrollment' | 'payment' | 'review' | 'course';
  message: string;
  date: string;
}

export interface IAdminDashboard {
  courseCount: number;
  studentCount: number;
  instructorCount: number;
  totalRevenue: number;
  salesTrend: ISalesTrendPoint[];
  recentActivity: IActivityItem[];
}
