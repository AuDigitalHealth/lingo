import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import TicketsService from '../../../api/TicketsService';
import { synonymConfigurationsQueryKey } from '../../../types/queryKeys';
import {
  SynonymConfiguration,
  SynonymConfigurationDto,
} from '../../../types/tickets/ticket';
import { useServiceStatus } from '../useServiceStatus';

export const useUpdateSynonymConfiguration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: SynonymConfigurationDto;
    }) => {
      return TicketsService.updateSynonymConfiguration(id, data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [synonymConfigurationsQueryKey],
      });
    },
  });
};

export const useDeleteSynonymConfiguration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return TicketsService.deleteSynonymConfiguration(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [synonymConfigurationsQueryKey],
      });
    },
  });
};

export const useAllSynonymConfigurations = () => {
  const { serviceStatus } = useServiceStatus();
  const {
    data: synonymConfigurations = [],
    isLoading: synonymConfigurationsIsLoading,
  } = useQuery({
    queryKey: [synonymConfigurationsQueryKey],
    queryFn: () => TicketsService.getAllSynonymConfigurations(),
    enabled: serviceStatus?.authoringPlatform.running ?? false,
  });

  return {
    synonymConfigurations,
    synonymConfigurationsIsLoading,
  };
};
