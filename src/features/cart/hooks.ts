import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { API } from '@/http/http';
import { queryKeys } from '@/lib/queryKeys';
import { ICart } from './types';

export function useCart(enabled = true) {
  return useQuery({
    queryKey: queryKeys.cart.mine,
    queryFn: async () => {
      const response = await API.get('/cart');
      return response.data.data as ICart;
    },
    enabled,
  });
}

function invalidateCart(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.cart.mine });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await API.post('/cart/items', { courseId });
      return response.data.data as ICart;
    },
    onSuccess: () => {
      invalidateCart(queryClient);
      toast.success('Added to cart');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not add to cart';
      toast.error(message);
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await API.delete(`/cart/items/${courseId}`);
      return response.data.data as ICart;
    },
    onSuccess: () => {
      invalidateCart(queryClient);
    },
    onError: () => {
      toast.error('Could not remove from cart');
    },
  });
}

export function useApplyCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const response = await API.post('/cart/coupon', { code });
      return response.data.data as { cart: ICart; previewDiscount: number };
    },
    onSuccess: () => {
      invalidateCart(queryClient);
      toast.success('Coupon applied');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid coupon';
      toast.error(message);
    },
  });
}

export function useRemoveCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await API.delete('/cart/coupon');
      return response.data.data as ICart;
    },
    onSuccess: () => {
      invalidateCart(queryClient);
    },
  });
}
