import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { API } from '@/http/http';
import { queryKeys } from '@/lib/queryKeys';
import {
  ICreateAnnouncementData,
  IInstructorAnnouncement,
  IInstructorDashboard,
  IInstructorRevenue,
  IInstructorRevenueParams,
  IInstructorStudents,
} from './types';

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
      return response.data.data as IInstructorStudents;
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

export function useInstructorAnnouncements(enabled = true) {
  return useQuery({
    queryKey: queryKeys.instructor.announcements,
    queryFn: async () => {
      const response = await API.get('/instructor/announcements');
      return response.data.data as IInstructorAnnouncement[];
    },
    enabled,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ICreateAnnouncementData) => {
      const response = await API.post('/instructor/announcements', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.instructor.announcements });
      toast.success('Announcement posted');
    },
    onError: () => {
      toast.error('Failed to post announcement');
    },
  });
}
