import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../api/dashboard';
import { dashboardKeys } from '../query-keys';

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.detail(),
    queryFn: getDashboard,
  });
}
