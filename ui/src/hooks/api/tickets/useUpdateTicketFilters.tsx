import { useMutation } from '@tanstack/react-query';
import TicketsService from '../../../api/TicketsService';
import { TicketFilter, TicketFilterDto } from '../../../types/tickets/ticket';
import { LingoProblem } from '../../../types/ErrorHandler';

export function useDeleteTicketFilter() {
  return useMutation({
    mutationFn: async (id: number) => {
      return TicketsService.deleteTicketFilter(id);
    },
  });
}

export function useCreateTicketFilter() {
  return useMutation<TicketFilter, LingoProblem, TicketFilterDto>({
    mutationFn: async (ticketFilter: TicketFilterDto) => {
      try {
        return await TicketsService.createTicketFilter(ticketFilter);
      } catch (error) {
        console.log('error from create ticket filter');
        // If there's an error, handle it here
        console.error('Error creating ticket filter:', error);
        throw error; // Assuming error.response.data contains the error details
      }
    },
  });
}

export function useUpdateTicketFilter() {
  return useMutation({
    mutationFn: async (data: { id: number; ticketFilter: TicketFilter }) => {
      const { id, ticketFilter } = data;
      return TicketsService.updateTicketFilter(id, ticketFilter);
    },
  });
}
