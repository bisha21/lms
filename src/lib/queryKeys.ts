export interface CoursesListParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
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
  },
  lessons: {
    forCourse: (courseId: string) => ['lessons', courseId] as const,
  },
  enrollments: {
    mine: ['enrollments', 'me'] as const,
  },
  payments: {
    mine: ['payments', 'me'] as const,
  },
  progress: {
    forCourse: (courseId: string) => ['progress', courseId] as const,
  },
  admin: {
    overview: ['admin', 'overview'] as const,
  },
};
