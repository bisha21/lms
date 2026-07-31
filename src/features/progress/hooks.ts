import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API } from '@/http/http';
import { queryKeys } from '@/lib/queryKeys';
import { IProgressData } from './types';

export function useProgress(courseId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.progress.forCourse(courseId),
    queryFn: async () => {
      const response = await API.get(`/progress/${courseId}`);
      return response.data.data as IProgressData;
    },
    enabled: enabled && !!courseId,
  });
}

export function useMarkLessonComplete(courseId: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.progress.forCourse(courseId);

  return useMutation({
    mutationFn: async (lessonId: string) => {
      await API.patch(`/progress/${courseId}/lessons/${lessonId}`);
      return lessonId;
    },
    // Optimistic: flips the local percentage/completed list before the request
    // resolves, and rolls back to the pre-mutation snapshot if it fails.
    onMutate: async (lessonId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<IProgressData>(queryKey);

      if (previous && !previous.completedLessons.includes(lessonId)) {
        const completedLessons = [...previous.completedLessons, lessonId];
        const percent =
          previous.totalLessons === 0
            ? 0
            : Math.round((completedLessons.length / previous.totalLessons) * 100);
        queryClient.setQueryData<IProgressData>(queryKey, {
          ...previous,
          completedLessons,
          percent,
        });
      }

      return { previous };
    },
    onError: (_err, _lessonId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
