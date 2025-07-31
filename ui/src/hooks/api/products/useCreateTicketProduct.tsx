import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useServiceStatus } from '../useServiceStatus';
import TicketProductService from '../../../api/TicketProductService';
import { getTicketProductsByTicketIdOptions } from '../tickets/useTicketById';
import { snowstormErrorHandler } from '../../../types/ErrorHandler';
import { TicketProductDto } from '../../../types/tickets/ticket';

interface CreateTicketProductParams {
  ticketId: number;
  ticketProductDto: TicketProductDto[];
}

interface UseCreateTicketProductOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  navigateOnSuccess?: boolean;
  navigationPath?: string;
}

export const useCreateTicketProducts = (
  options: UseCreateTicketProductOptions = {},
) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { serviceStatus } = useServiceStatus();

  const {
    onSuccess,
    onError,
    navigateOnSuccess = true,
    navigationPath,
  } = options;

  return useMutation({
    mutationFn: async ({
      ticketId,
      ticketProductDto,
    }: CreateTicketProductParams) => {
      return TicketProductService.draftTicketProducts(
        ticketId,
        ticketProductDto,
      );
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch ticket products
      void queryClient.invalidateQueries({
        queryKey: getTicketProductsByTicketIdOptions(
          variables.ticketId.toString(),
        ).queryKey,
      });

      // Navigate if enabled
      if (navigateOnSuccess && navigationPath) {
        navigate(navigationPath);
      }

      // Call custom success handler if provided
      onSuccess?.();
    },
    onError: (error, variables) => {
      // Handle the error with snowstorm error handler
      snowstormErrorHandler(
        error,
        `Failed to save the product ${variables.ticketProductDto.name}`,
        serviceStatus,
      );

      // Call custom error handler if provided
      onError?.(error);
    },
  });
};
