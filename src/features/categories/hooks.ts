import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { API } from '@/http/http';
import { queryKeys } from '@/lib/queryKeys';
import { useAppDispatch } from '@/redux/hooks';
import { closeModal } from '@/redux/modal/modalSlice';
import { ICategory } from './types';

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: async () => {
      const response = await API.get('/category');
      return response.data.data as ICategory[];
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await API.post('/category', data);
      return response.data.data as ICategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success('Category created successfully');
      dispatch(closeModal());
    },
    onError: () => {
      toast.error('Error creating category');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name: string; description: string };
    }) => {
      const response = await API.patch(`/category/${id}`, data);
      return response.data.data as ICategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success('Category updated successfully');
      dispatch(closeModal());
    },
    onError: () => {
      toast.error('Error updating category');
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (id: string) => {
      await API.delete(`/category/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success('Category deleted successfully');
      dispatch(closeModal());
    },
    onError: () => {
      toast.error('Error deleting category');
    },
  });
}
