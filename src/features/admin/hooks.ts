import { useQuery } from '@tanstack/react-query';
import { API } from '@/http/http';
import { queryKeys } from '@/lib/queryKeys';
import { IAdminDashboard, IOverviewRow } from './types';

export function useAdminOverview() {
  return useQuery({
    queryKey: queryKeys.admin.overview,
    queryFn: async () => {
      const response = await API.get('/admin/overview');
      return response.data.data as IOverviewRow[];
    },
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: async () => {
      const response = await API.get('/admin/dashboard');
      return response.data.data as IAdminDashboard;
    },
  });
}
