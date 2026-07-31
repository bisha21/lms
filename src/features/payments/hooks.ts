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

function goToCheckoutUrl(data: { url?: string }) {
  if (data.url) {
    window.location.href = data.url;
  }
}

function checkoutErrorMessage(error: unknown) {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    'Could not start checkout'
  );
}

// "Buy Now" — a single course, bypassing the persisted cart entirely.
export function useCheckoutCourse() {
  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await API.post('/payments/checkout', { courseIds: [courseId] });
      return response.data as { url?: string; orderId: string };
    },
    onSuccess: goToCheckoutUrl,
    onError: (error: unknown) => toast.error(checkoutErrorMessage(error)),
  });
}

// Checks out the caller's persisted cart. couponCode is optional — omitted, the server
// falls back to whatever coupon is already applied to the cart.
export function useCheckoutCart() {
  return useMutation({
    mutationFn: async (couponCode?: string) => {
      const response = await API.post('/payments/checkout', couponCode ? { couponCode } : {});
      return response.data as { url?: string; orderId: string };
    },
    onSuccess: goToCheckoutUrl,
    onError: (error: unknown) => toast.error(checkoutErrorMessage(error)),
  });
}
