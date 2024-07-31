import { ConfigService } from '../../api/ConfigService';
import { useQuery } from '@tanstack/react-query';
import { FieldBindings } from '../../types/FieldBindings.ts';

export function useApplicationConfig() {
  const { isLoading, data } = useQuery({
    queryKey: ['config'],
    queryFn: () => {
      return ConfigService.getApplicationConfig();
    },
    staleTime: 1 * (60 * 1000),
  });

  const applicationConfigIsLoading: boolean = isLoading;
  const applicationConfig = data;

  return { applicationConfigIsLoading, applicationConfig };
}

export function useFieldBindings(branch: string) {
  const { isLoading, data } = useQuery({
    queryKey: [`fieldBindings-${branch}`],
    queryFn: () => ConfigService.loadFieldBindings(branch),
    staleTime: Infinity,
  });

  const fieldBindingIsLoading: boolean = isLoading;
  const fieldBindings = data as FieldBindings;

  return { fieldBindingIsLoading, fieldBindings };
}
