import { useMutation } from '@tanstack/react-query';
import { Ticket } from '../../../types/tickets/ticket';
import TicketsService from '../../../api/TicketsService';

interface UseUpdateTicketProps {
  ticket?: Ticket;
}
export function useUpdateTicket({ ticket }: UseUpdateTicketProps) {
  const mutation = useMutation({
    mutationFn: (updatedTicket: Ticket | undefined) => {
      return TicketsService.updateTicket(simplifyTicket(updatedTicket));
    },
  });

  return mutation;
}

const simplifyTicket = (ticket: Ticket | undefined) => {
    const tempTicket = Object.assign({}, {
        id: ticket?.id,
        title: ticket?.title,
        assignee: ticket?.assignee,
        description: ticket?.description,
        // labels: ticket?.labels,
        // comments: ticket?.comments,
        // ticketType: ticket?.ticketType,
        // state: ticket?.state,
        // iteration: ticket?.iteration,
        // priorityBucket: ticket?.priorityBucket,
        // attachments: ticket?.attachments,
        // 'ticket-additional-fields': ticket?.['ticket-additional-fields']
      } as Ticket);

      return tempTicket;
}
