import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { API } from '@/http/http';
import { queryKeys } from '@/lib/queryKeys';
import { ILesson } from './types';

// Flat, course-wide list (section order, then lesson order) — used by the student-facing
// course player. The instructor builder reads lessons nested under useSections() instead.
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

function invalidateLessonViews(queryClient: ReturnType<typeof useQueryClient>, courseId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.lessons.forCourse(courseId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.sections.forCourse(courseId) });
}

export function useCreateLesson(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionId,
      data,
    }: {
      sectionId: string;
      data: { title: string; description: string; durationSeconds?: number; video: File };
    }) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      if (data.durationSeconds) {
        formData.append('durationSeconds', String(data.durationSeconds));
      }
      formData.append('video', data.video);

      const response = await API.post(`/sections/${sectionId}/lessons`, formData, {
        headers: { 'Content-Type': undefined },
      });
      return response.data.data as ILesson;
    },
    onSuccess: () => {
      invalidateLessonViews(queryClient, courseId);
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
      data: Partial<{ title: string; description: string; durationSeconds: number }>;
    }) => {
      const response = await API.patch(`/lessons/${id}`, data);
      return response.data.data as ILesson;
    },
    onSuccess: () => {
      invalidateLessonViews(queryClient, courseId);
      toast.success('Lesson updated successfully');
    },
    onError: () => {
      toast.error('Failed to update lesson');
    },
  });
}

export function useDeleteLesson(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await API.delete(`/lessons/${id}`);
      return id;
    },
    onSuccess: () => {
      invalidateLessonViews(queryClient, courseId);
      toast.success('Lesson deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete lesson');
    },
  });
}

export function useReorderLessons(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sectionId, orderedIds }: { sectionId: string; orderedIds: string[] }) => {
      const response = await API.patch(`/sections/${sectionId}/lessons/reorder`, { orderedIds });
      return response.data.data as ILesson[];
    },
    onSuccess: () => {
      invalidateLessonViews(queryClient, courseId);
    },
    onError: () => {
      toast.error('Failed to reorder lessons');
    },
  });
}
