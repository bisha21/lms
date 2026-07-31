import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { API } from '@/http/http';
import { queryKeys } from '@/lib/queryKeys';
import { IWishlist } from './types';

export function useWishlist(enabled = true) {
  return useQuery({
    queryKey: queryKeys.wishlist.mine,
    queryFn: async () => {
      const response = await API.get('/wishlist');
      return response.data.data as IWishlist;
    },
    enabled,
  });
}

function invalidateWishlistAndCart(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.mine });
  queryClient.invalidateQueries({ queryKey: queryKeys.cart.mine });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await API.post('/wishlist/items', { courseId });
      return response.data.data as IWishlist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.mine });
      toast.success('Added to wishlist');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not add to wishlist';
      toast.error(message);
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await API.delete(`/wishlist/items/${courseId}`);
      return response.data.data as IWishlist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.mine });
    },
  });
}

export function useMoveToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await API.post(`/wishlist/items/${courseId}/move-to-cart`);
      return response.data.data;
    },
    onSuccess: () => {
      invalidateWishlistAndCart(queryClient);
      toast.success('Moved to cart');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not move to cart';
      toast.error(message);
    },
  });
}
