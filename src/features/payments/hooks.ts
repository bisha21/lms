import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { API } from '@/http/http';
import { queryKeys } from '@/lib/queryKeys';
import { IPayment } from './types';

export function useMyPayments(enabled = true) {
  return useQuery({
    queryKey: queryKeys.payments.mine,
    queryFn: async () => {
      const response = await API.get('/payments/me');
      return response.data.data as IPayment[];
    },
    enabled,
  });
}

export function useCheckoutCourse() {
  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await API.post('/payments/checkout', { courseId });
      return response.data as { url?: string };
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast.error('Could not start checkout');
    },
  });
}
