import { useQuery } from '@tanstack/react-query';
import { ConfigService } from '../../api/ConfigService';
import OntoserverService from '../../api/OntoserverService';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore';

export function useServiceStatus() {
  const { isLoading, data, error } = useQuery({
    queryKey: ['service-status'],
    queryFn: () => {
      return ConfigService.getServiceStatus();
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const serviceStatusIsLoading: boolean = isLoading;
  const serviceStatus = data;

  return { serviceStatusIsLoading, serviceStatus, error };
}

export function useOntoserverStatus() {
  const { applicationConfig } = useApplicationConfigStore();
  const { isLoading, data, error } = useQuery({
    queryKey: ['ontoserver-service-status'],
    queryFn: () => {
      return OntoserverService.getServiceStatus(
        applicationConfig.fhirServerBaseUrl,
        applicationConfig.fhirServerExtension,
      );
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const ontoserverStatusIsLoading: boolean = isLoading;
  const ontoserverStatus = data;

  return { ontoserverStatusIsLoading, ontoserverStatus, error };
}
