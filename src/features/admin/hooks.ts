import { useQuery } from '@tanstack/react-query';
import { API } from '@/http/http';
import { queryKeys } from '@/lib/queryKeys';
import { IOverviewRow } from './types';

export function useAdminOverview() {
  return useQuery({
    queryKey: queryKeys.admin.overview,
    queryFn: async () => {
      const response = await API.get('/admin/overview');
      return response.data.data as IOverviewRow[];
    },
  });
}
