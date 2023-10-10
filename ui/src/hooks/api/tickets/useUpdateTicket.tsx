import { useMutation } from '@tanstack/react-query';
import {
  AdditionalFieldType,
  LabelType,
  Ticket,
} from '../../../types/tickets/ticket';
import TicketsService from '../../../api/TicketsService';
import { labelExistsOnTicket } from '../../../utils/helpers/tickets/labelUtils';

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
};

interface UseUpdateLabelsArguments {
  ticket: Ticket;
  label: LabelType;
}
export function useUpdateLabels() {
  const mutation = useMutation({
    mutationFn: ({ ticket, label }: UseUpdateLabelsArguments) => {
      const shouldDelete = labelExistsOnTicket(ticket, label);
      if (shouldDelete) {
        return TicketsService.deleteTicketLabel(ticket.id.toString(), label.id);
      } else {
        return TicketsService.addTicketLabel(ticket.id.toString(), label.id);
      }
    },
  });

  return mutation;
}

interface UseUpdateAdditionalFieldsArguments {
  ticket: Ticket | undefined;
  additionalFieldType: AdditionalFieldType;
  valueOf: string | undefined;
}
export function useUpdateAdditionalFields() {
  const mutation = useMutation({
    mutationFn: ({
      ticket,
      additionalFieldType,
      valueOf,
    }: UseUpdateAdditionalFieldsArguments) => {
      return TicketsService.updateAdditionalFieldValue(
        ticket?.id,
        additionalFieldType,
        valueOf,
      );
    },
  });

  return mutation;
}
