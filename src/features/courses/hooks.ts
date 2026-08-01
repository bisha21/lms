import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type { AxiosProgressEvent } from 'axios';
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

export interface ICourseBySlugResult {
  course: ICourse;
  lessons: ILesson[];
  averageRating: number | null;
  reviewCount: number;
}

export function useCourseBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.courses.bySlug(slug),
    queryFn: async () => {
      const response = await API.get(`/courses/slug/${slug}`);
      return response.data.data as ICourseBySlugResult;
    },
    enabled: !!slug,
  });
}

export interface IInstructorOption {
  _id: string;
  username: string;
}

export function useInstructors() {
  return useQuery({
    queryKey: queryKeys.courses.instructors,
    queryFn: async () => {
      const response = await API.get('/courses/instructors');
      return response.data.data as IInstructorOption[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: queryKeys.courses.detail(id),
    queryFn: async () => {
      const response = await API.get(`/courses/${id}`);
      return response.data.data as ICourse;
    },
    enabled: !!id,
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
    onSuccess: (_result, variables) => {
      invalidateCourseLists(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(variables.id) });
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
    mutate: (args: { id: string; status: CourseStatusValue }, options?: Parameters<typeof mutate>[1]) =>
      mutate({ id: args.id, data: { status: args.status } }, options),
    mutateAsync: (args: { id: string; status: CourseStatusValue }) =>
      mutateAsync({ id: args.id, data: { status: args.status } }),
  };
}

interface UploadAssetArgs {
  file: File;
  onProgress?: (percent: number) => void;
}

// Reports genuine browser→server upload progress via axios' onUploadProgress — the
// Cloudinary leg (server→Cloudinary) has no progress signal, so callers show a
// "Processing…" state between 100% and the response resolving.
function uploadCourseAsset(url: string) {
  return async ({ file, onProgress }: UploadAssetArgs) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post(url, formData, {
      headers: { 'Content-Type': undefined },
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    });
    return response.data.data as { url: string; publicId: string };
  };
}

export function useUploadCourseThumbnail() {
  return useMutation({
    mutationFn: uploadCourseAsset('/courses/thumbnail'),
    onError: () => {
      toast.error('Failed to upload thumbnail');
    },
  });
}

export function useUploadCoursePromoVideo() {
  return useMutation({
    mutationFn: uploadCourseAsset('/courses/promo-video'),
    onError: () => {
      toast.error('Failed to upload promo video');
    },
  });
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
