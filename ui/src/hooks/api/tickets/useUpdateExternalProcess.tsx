import { useMutation, useQueryClient } from '@tanstack/react-query';
import TicketsService from '../../../api/TicketsService';
import { externalProcessesQueryKey } from '../../../types/queryKeys';
import { ExternalProcess } from '../../../types/tickets/ticket';

export const useUpdateExternalProcess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (externalProcess: ExternalProcess) => {
      return TicketsService.updateExternalProcess(externalProcess);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [externalProcessesQueryKey],
      });
    },
  });
};

export const useDeleteExternalProcess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return TicketsService.deleteExternalProcess(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: externalProcessesQueryKey,
      });
    },
  });
};
