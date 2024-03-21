import { useMemo } from 'react';
import { ConfigService } from '../../api/ConfigService';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore';
import { useQuery } from '@tanstack/react-query';
import { FieldBindings } from '../../types/FieldBindings.ts';

export function useInitializeConfig() {
  const { updateApplicationConfigState } = useApplicationConfigStore();
  const { isLoading, data } = useQuery(
    ['config'],
    () => {
      return ConfigService.getApplicationConfig();
    },
    { staleTime: 1 * (60 * 1000) },
  );

  useMemo(() => {
    if (data) {
      updateApplicationConfigState(data);
    }
  }, [data, updateApplicationConfigState]);

  const applicationConfigIsLoading: boolean = isLoading;
  const applicationConfig = data;

  return { applicationConfigIsLoading, applicationConfig };
}

export function useInitializeFieldBindings(branch: string) {
  const { setFieldBindings } = useApplicationConfigStore();
  const { isLoading, data } = useQuery(
    [`fieldBindings-${branch}`],
    () => ConfigService.loadFieldBindings(branch),
    { staleTime: Infinity },
  );
  useMemo(() => {
    if (data) {
      setFieldBindings(data);
    }
  }, [data, setFieldBindings]);

  const fieldBindingIsLoading: boolean = isLoading;
  const fieldBindings = data as FieldBindings;

  return { fieldBindingIsLoading, fieldBindings };
}
