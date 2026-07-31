import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { API } from '@/http/http';
import { queryKeys } from '@/lib/queryKeys';
import { ILesson } from './types';

export function useLessons(courseId: string) {
  return useQuery({
    queryKey: queryKeys.lessons.forCourse(courseId),
    queryFn: async () => {
      const response = await API.get(`/courses/${courseId}/lessons`);
      return response.data.data as ILesson[];
    },
    enabled: !!courseId,
  });
}

export function useCreateLesson(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      durationSeconds?: number;
      video: File;
    }) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      if (data.durationSeconds) {
        formData.append('durationSeconds', String(data.durationSeconds));
      }
      formData.append('video', data.video);

      const response = await API.post(`/courses/${courseId}/lessons`, formData, {
        headers: { 'Content-Type': undefined },
      });
      return response.data.data as ILesson;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.forCourse(courseId) });
      toast.success('Lesson added successfully');
    },
    onError: () => {
      toast.error('Failed to add lesson');
    },
  });
}

export function useUpdateLesson(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{ title: string; description: string; order: number; durationSeconds: number }>;
    }) => {
      const response = await API.patch(`/lessons/${id}`, data);
      return response.data.data as ILesson;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.forCourse(courseId) });
      toast.success('Lesson updated successfully');
    },
    onError: () => {
      toast.error('Failed to update lesson');
    },
  });
}

export function useReorderLesson(courseId: string) {
  const { mutateAsync, ...rest } = useUpdateLesson(courseId);
  return {
    ...rest,
    mutateAsync: (args: { id: string; order: number }) =>
      mutateAsync({ id: args.id, data: { order: args.order } }),
  };
}

export function useDeleteLesson(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await API.delete(`/lessons/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.forCourse(courseId) });
      toast.success('Lesson deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete lesson');
    },
  });
}
