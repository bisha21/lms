import { useQuery } from '@tanstack/react-query';
import { API } from '@/http/http';
import { queryKeys } from '@/lib/queryKeys';
import { IOrder } from './types';

// Purely read-only — used by the checkout success page to poll for the webhook having
// completed. Polling this can never itself grant enrollment; it only ever reflects
// whatever the webhook handler has already done.
export function useOrderStatus(orderId: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: async () => {
      const response = await API.get(`/orders/${orderId}`);
      return response.data.data as IOrder;
    },
    enabled: !!orderId,
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 2000 : false),
  });
}
