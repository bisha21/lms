import { useQuery } from '@tanstack/react-query';
import { API } from '@/http/http';
import { queryKeys } from '@/lib/queryKeys';
import { IInstructorDashboard } from './types';

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
