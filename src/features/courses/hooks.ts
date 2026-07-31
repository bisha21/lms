import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { API } from '@/http/http';
import { CoursesListParams, queryKeys } from '@/lib/queryKeys';
import { useAppDispatch } from '@/redux/hooks';
import { closeModal } from '@/redux/modal/modalSlice';
import { ILesson } from '@/features/lessons/types';
import { CourseStatusValue, ICourse, ICourseForData, ICoursesMeta } from './types';

export function useCourses(params?: CoursesListParams) {
  return useQuery({
    queryKey: queryKeys.courses.all(params),
    queryFn: async () => {
      const response = await API.get('/courses', { params });
      return { courses: response.data.data as ICourse[], meta: response.data.meta as ICoursesMeta };
    },
  });
}

export function useCourseBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.courses.bySlug(slug),
    queryFn: async () => {
      const response = await API.get(`/courses/slug/${slug}`);
      return response.data.data as { course: ICourse; lessons: ILesson[] };
    },
    enabled: !!slug,
  });
}

function invalidateCourseLists(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['courses', 'list'] });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (data: ICourseForData) => {
      const response = await API.post('/courses', data);
      return response.data.data as ICourse;
    },
    onSuccess: () => {
      invalidateCourseLists(queryClient);
      toast.success('Course added successfully');
      dispatch(closeModal());
    },
    onError: () => {
      toast.error('Failed to add course');
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ICourseForData> }) => {
      const response = await API.patch(`/courses/${id}`, data);
      return response.data.data as ICourse;
    },
    onSuccess: () => {
      invalidateCourseLists(queryClient);
      toast.success('Course updated successfully');
      dispatch(closeModal());
    },
    onError: () => {
      toast.error('Failed to update course');
    },
  });
}

export function useTogglePublishCourse() {
  const { mutate, mutateAsync, ...rest } = useUpdateCourse();

  return {
    ...rest,
    mutate: (args: { id: string; status: CourseStatusValue }) =>
      mutate({ id: args.id, data: { status: args.status } }),
    mutateAsync: (args: { id: string; status: CourseStatusValue }) =>
      mutateAsync({ id: args.id, data: { status: args.status } }),
  };
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (id: string) => {
      await API.delete(`/courses/${id}`);
      return id;
    },
    onSuccess: () => {
      invalidateCourseLists(queryClient);
      toast.success('Course deleted successfully');
      dispatch(closeModal());
    },
    onError: () => {
      toast.error('Failed to delete course');
    },
  });
}
