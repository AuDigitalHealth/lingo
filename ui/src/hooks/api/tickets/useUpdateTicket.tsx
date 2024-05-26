import { useMutation } from '@tanstack/react-query';
import {
  AdditionalFieldType,
  ExternalRequestor,
  LabelType,
  Ticket,
} from '../../../types/tickets/ticket';
import TicketsService from '../../../api/TicketsService';
import { enqueueSnackbar } from 'notistack';

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
  method: string;
}
export function useUpdateLabels() {
  const mutation = useMutation({
    mutationFn: ({ ticket, label, method }: UseUpdateLabelsArguments) => {
      if (method === 'DELETE') {
        return TicketsService.deleteTicketLabel(ticket.id.toString(), label.id);
      } else {
        return TicketsService.addTicketLabel(ticket.id.toString(), label.id);
      }
    },
  });

  return mutation;
}
interface UseUpdateExternalRequestorsArguments {
  ticket: Ticket;
  externalRequestor: ExternalRequestor;
  method: string;
}
export function useUpdateExternalRequestors() {
  const mutation = useMutation({
    mutationFn: ({
      ticket,
      externalRequestor,
      method,
    }: UseUpdateExternalRequestorsArguments) => {
      if (method === 'DELETE') {
        return TicketsService.deleteTicketExternalRequestor(
          ticket.id.toString(),
          externalRequestor.id,
        );
      } else {
        return TicketsService.addTicketExternalRequestor(
          ticket.id.toString(),
          externalRequestor.id,
        );
      }
    },
  });

  return mutation;
}
interface UseBulkCreateTicketsArgs {
  tickets: Ticket[];
}
export function useBulkCreateTickets() {
  const mutation = useMutation({
    mutationFn: ({ tickets }: UseBulkCreateTicketsArgs) => {
      return TicketsService.bulkCreateTicket(tickets);
    },
    onError: error => {
      enqueueSnackbar('Error updating', {
        variant: 'error',
      });
    },
    onSuccess: data => {
      enqueueSnackbar(`Updated ${data.length} rows`, {
        variant: 'success',
      });
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

interface UseDeleteAdditionalFieldsArguments {
  ticket: Ticket | undefined;
  additionalFieldType: AdditionalFieldType;
}

export function useDeleteAdditionalFields() {
  const deleteMutation = useMutation({
    mutationFn: ({
      ticket,
      additionalFieldType,
    }: UseDeleteAdditionalFieldsArguments) => {
      return TicketsService.deleteAdditionalFieldValue(
        ticket?.id,
        additionalFieldType,
      );
    },
  });

  return deleteMutation;
}
