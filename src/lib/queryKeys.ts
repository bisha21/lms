export type CourseSortParam = 'newest' | 'price' | 'rating' | 'popular' | 'best-selling';

export interface CoursesListParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  level?: string;
  language?: string;
  instructor?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: CourseSortParam;
}

// Central key factory so query keys can't drift between the hook that fetches
// data and the mutation that invalidates it.
export const queryKeys = {
  categories: {
    all: ['categories'] as const,
  },
  courses: {
    all: (params?: CoursesListParams) => ['courses', 'list', params ?? {}] as const,
    detail: (id: string) => ['courses', 'detail', id] as const,
    bySlug: (slug: string) => ['courses', 'slug', slug] as const,
    instructors: ['courses', 'instructors'] as const,
  },
  lessons: {
    forCourse: (courseId: string) => ['lessons', courseId] as const,
    content: (lessonId: string) => ['lessons', 'content', lessonId] as const,
  },
  sections: {
    forCourse: (courseId: string) => ['sections', courseId] as const,
  },
  enrollments: {
    mine: ['enrollments', 'me'] as const,
  },
  payments: {
    mine: ['payments', 'me'] as const,
  },
  cart: {
    mine: ['cart', 'me'] as const,
  },
  wishlist: {
    mine: ['wishlist', 'me'] as const,
  },
  orders: {
    detail: (id: string) => ['orders', 'detail', id] as const,
  },
  progress: {
    forCourse: (courseId: string) => ['progress', courseId] as const,
    continueLearning: ['progress', 'continue-learning'] as const,
  },
  admin: {
    overview: ['admin', 'overview'] as const,
    dashboard: ['admin', 'dashboard'] as const,
  },
  instructor: {
    dashboard: ['instructor', 'dashboard'] as const,
    students: ['instructor', 'students'] as const,
    revenue: (params?: { range?: string; page?: number; status?: string }) =>
      ['instructor', 'revenue', params ?? {}] as const,
    announcements: ['instructor', 'announcements'] as const,
  },
};
