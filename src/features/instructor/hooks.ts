import { useQuery } from '@tanstack/react-query';
import { API } from '@/http/http';
import { queryKeys } from '@/lib/queryKeys';
import { IInstructorDashboard, IInstructorRevenue, IInstructorRevenueParams, IInstructorStudent } from './types';

export function useInstructorDashboard(enabled = true) {
  return useQuery({
    queryKey: queryKeys.instructor.dashboard,
    queryFn: async () => {
      const response = await API.get('/instructor/dashboard');
      return response.data.data as IInstructorDashboard;
    },
    enabled,
  });
}

export function useInstructorStudents(enabled = true) {
  return useQuery({
    queryKey: queryKeys.instructor.students,
    queryFn: async () => {
      const response = await API.get('/instructor/students');
      return response.data.data as IInstructorStudent[];
    },
    enabled,
  });
}

export function useInstructorRevenue(params?: IInstructorRevenueParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.instructor.revenue(params),
    queryFn: async () => {
      const response = await API.get('/instructor/revenue', { params });
      return response.data as { data: IInstructorRevenue; meta: { page: number; limit: number; total: number; totalPages: number } };
    },
    enabled,
  });
}
