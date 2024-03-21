import { useMemo } from 'react';
import TicketsService from '../../../api/TicketsService';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  UiSearchConfiguration,
  UiSearchConfigurationDto,
} from '../../../types/tickets/ticket';

export function useUiSearchConfiguration() {
  const { isLoading, data } = useQuery(
    ['ui-search-configuration'],
    () => TicketsService.getUiSearchConfigurations(),
    { staleTime: Infinity },
  );

  return { isLoading, data };
}

export function useCreateUiSearchConfiguration() {
  const mutation = useMutation({
    mutationFn: (uiSearchConfiguration: UiSearchConfigurationDto) => {
      return TicketsService.createUiSearchConfiguration(uiSearchConfiguration);
    },
  });

  return mutation;
}

export function useUpdateUiSearchConfigurations() {
  const mutation = useMutation({
    mutationFn: (uiSearchConfiguration: UiSearchConfiguration[]) => {
      return TicketsService.updateUiSearchConfiguration(uiSearchConfiguration);
    },
  });

  return mutation;
}

export function useDeleteUiSearchConfiguration() {
  const mutation = useMutation({
    mutationFn: (id: number) => {
      return TicketsService.deleteUiSearchConfiguration(id);
    },
  });
  return mutation;
}
