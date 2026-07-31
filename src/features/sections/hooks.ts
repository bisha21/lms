import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { API } from '@/http/http';
import { queryKeys } from '@/lib/queryKeys';
import { ISection } from './types';

export function useSections(courseId: string) {
  return useQuery({
    queryKey: queryKeys.sections.forCourse(courseId),
    queryFn: async () => {
      const response = await API.get(`/courses/${courseId}/sections`);
      return response.data.data as ISection[];
    },
    enabled: !!courseId,
  });
}

export function useCreateSection(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string }) => {
      const response = await API.post(`/courses/${courseId}/sections`, data);
      return response.data.data as ISection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.forCourse(courseId) });
      toast.success('Section added successfully');
    },
    onError: () => {
      toast.error('Failed to add section');
    },
  });
}

export function useUpdateSection(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const response = await API.patch(`/sections/${id}`, { title });
      return response.data.data as ISection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.forCourse(courseId) });
      toast.success('Section updated successfully');
    },
    onError: () => {
      toast.error('Failed to update section');
    },
  });
}

export function useDeleteSection(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await API.delete(`/sections/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.forCourse(courseId) });
      toast.success('Section deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete section');
    },
  });
}

export function useReorderSections(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const response = await API.patch(`/courses/${courseId}/sections/reorder`, { orderedIds });
      return response.data.data as ISection[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.forCourse(courseId) });
    },
    onError: () => {
      toast.error('Failed to reorder sections');
    },
  });
}
