import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AdditionalFieldType,
  ExternalRequestor,
  LabelType,
  Ticket,
} from '../../../types/tickets/ticket';
import TicketsService from '../../../api/TicketsService';
import { enqueueSnackbar } from 'notistack';
import { getTicketByIdOptions } from './useTicketById';
import { initializeTaskAssociationsOptions } from '../useInitializeTickets';

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (updatedTicket: Ticket) => {
      return TicketsService.updateTicket(updatedTicket);
    },
    onSuccess: updatedTicket => {
      const queryKey = getTicketByIdOptions(
        updatedTicket.id.toString(),
      ).queryKey;
      void queryClient.invalidateQueries({ queryKey: queryKey });
    },
  });

  return mutation;
}

export function usePatchTicket() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (updatedTicket: Ticket) => {
      const simpleTicket = {
        id: updatedTicket.id,
        title: updatedTicket.title,
        description: updatedTicket.description,
        assignee: updatedTicket.assignee,
      } as Ticket;
      return TicketsService.patchTicket(simpleTicket);
    },
    onSuccess: updatedTicket => {
      const queryKey = getTicketByIdOptions(
        updatedTicket.id.toString(),
      ).queryKey;
      void queryClient.invalidateQueries({ queryKey: queryKey });
    },
  });

  return mutation;
}

interface UseUpdateLabelsArguments {
  ticket: Ticket;
  label: LabelType;
  method: string;
}
export function useUpdateLabels() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ ticket, label, method }: UseUpdateLabelsArguments) => {
      if (method === 'DELETE') {
        return TicketsService.deleteTicketLabel(ticket.id.toString(), label.id);
      } else {
        return TicketsService.addTicketLabel(ticket.id.toString(), label.id);
      }
    },
    onSuccess: (_, variables) => {
      const ticketId = variables.ticket.id;
      void queryClient.invalidateQueries({
        queryKey: ['ticket', ticketId.toString()],
      });
      void queryClient.invalidateQueries({
        queryKey: ['ticketDto', ticketId.toString()],
      });
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
  const queryClient = useQueryClient();
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
    onSuccess: (_, variables) => {
      const ticketId = variables.ticket.id;
      void queryClient.invalidateQueries({
        queryKey: ['ticket', ticketId.toString()],
      });
      void queryClient.invalidateQueries({
        queryKey: ['ticketDto', ticketId.toString()],
      });
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
    onError: () => {
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

interface useUpdateTaskAssociationArguments {
  ticketId: number;
  taskKey: string;
}

export function useUpdateTaskAssociation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ ticketId, taskKey }: useUpdateTaskAssociationArguments) => {
      return TicketsService.createTaskAssociation(ticketId, taskKey);
    },
    onSuccess: (response, request) => {
      const ticketQueryKey = getTicketByIdOptions(
        request.ticketId.toString(),
      ).queryKey;
      response.ticketId = request.ticketId;

      queryClient.setQueryData(
        initializeTaskAssociationsOptions().queryKey,
        oldData => {
          // Assuming the old data structure and response structure are known
          if (oldData) {
            return [...oldData, response];
          }
          return [response];
        },
      );
      void queryClient.invalidateQueries({ queryKey: ticketQueryKey });
    },
  });

  return mutation;
}

interface useDeleteTaskAssociationArguments {
  ticketId: number;
  taskAssociationId: number;
}

export function useDeleteTaskAssociation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({
      ticketId,
      taskAssociationId,
    }: useDeleteTaskAssociationArguments) => {
      return TicketsService.deleteTaskAssociation(ticketId, taskAssociationId);
    },
    onSuccess: (response, request) => {
      const ticketQueryKey = getTicketByIdOptions(
        request.ticketId.toString(),
      ).queryKey;

      queryClient.setQueryData(
        initializeTaskAssociationsOptions().queryKey,
        oldData => {
          // Assuming the old data structure and response structure are known
          if (oldData) {
            return [
              ...oldData.filter(association => {
                return association.id !== request.taskAssociationId;
              }),
            ];
          }
          return [];
        },
      );
      void queryClient.invalidateQueries({ queryKey: ticketQueryKey });
    },
  });

  return mutation;
}
