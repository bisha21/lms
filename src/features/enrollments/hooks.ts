import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { API } from '@/http/http';
import { queryKeys } from '@/lib/queryKeys';
import { IEnrollment } from './types';

export function useMyEnrollments(enabled = true) {
  return useQuery({
    queryKey: queryKeys.enrollments.mine,
    queryFn: async () => {
      const response = await API.get('/enrollments/me');
      return response.data.data as IEnrollment[];
    },
    enabled,
  });
}

export function useEnrollInCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await API.post('/enrollments', { courseId });
      return response.data.data as IEnrollment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.mine });
      toast.success('Enrolled successfully');
    },
    onError: () => {
      toast.error('Failed to enroll');
    },
  });
}
