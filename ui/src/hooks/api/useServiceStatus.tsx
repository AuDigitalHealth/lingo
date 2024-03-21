import { useQuery } from '@tanstack/react-query';
import { ConfigService } from '../../api/ConfigService';

export function useServiceStatus() {
  const { isLoading, data, error } = useQuery(
    ['service-status'],
    () => {
      return ConfigService.getServiceStatus();
    },
    { staleTime: 60 * 1000, refetchInterval: 60 * 1000 },
  );

  const serviceStatusIsLoading: boolean = isLoading;
  const serviceStatus = data;

  return { serviceStatusIsLoading, serviceStatus, error };
}
