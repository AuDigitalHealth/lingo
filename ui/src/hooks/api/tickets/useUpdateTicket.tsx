import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AdditionalFieldType,
  BulkAddExternalRequestorRequest,
  Comment,
  ExternalRequestor,
  LabelType,
  Ticket,
  TicketDto,
} from '../../../types/tickets/ticket';
import TicketsService from '../../../api/TicketsService';
import { enqueueSnackbar } from 'notistack';
import { getTicketByTicketNumberOptions } from './useTicketById';
import { allTaskAssociationsOptions } from '../useInitializeTickets';
import useTicketStore from '../../../stores/TicketStore';

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (updatedTicket: Ticket) => {
      return TicketsService.updateTicket(updatedTicket);
    },
    onSuccess: updatedTicket => {
      void queryClient.invalidateQueries({
        queryKey: ['ticket', updatedTicket.ticketNumber],
      });
    },
  });

  return mutation;
}

interface UsePatchTicketArgs {
  updatedTicket: Ticket;
  clearCache?: boolean;
}
export function usePatchTicket() {
  const queryClient = useQueryClient();
  const { mergeTicket } = useTicketStore();
  const mutation = useMutation({
    mutationFn: ({ updatedTicket, clearCache = true }: UsePatchTicketArgs) => {
      const simpleTicket = {
        id: updatedTicket.id,
        title: updatedTicket.title,
        description: updatedTicket.description,
        assignee: updatedTicket.assignee,
      } as Ticket;
      return TicketsService.patchTicket(simpleTicket);
    },
    onSuccess: (updatedTicket, _args) => {
      if (_args.clearCache) {
        void queryClient.invalidateQueries({
          queryKey: ['ticket', updatedTicket.ticketNumber],
        });
      }
      mergeTicket(updatedTicket);
    },
  });

  return mutation;
}

export function useDeleteTicket() {
  const mutation = useMutation({
    mutationFn: (ticket: Ticket) => {
      return TicketsService.deleteTicket(ticket.id);
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
      const ticketNumber = variables.ticket.ticketNumber;
      void queryClient.invalidateQueries({
        queryKey: ['ticket', ticketNumber],
      });
      void queryClient.invalidateQueries({
        queryKey: ['ticketDto', ticketNumber],
      });
    },
  });

  return mutation;
}

interface UseDeleteCommentArguments {
  ticket: TicketDto;
  commentId: number;
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ ticket, commentId }: UseDeleteCommentArguments) => {
      return TicketsService.deleteTicketComment(commentId, ticket.id);
    },
    onSuccess: (_, variables) => {
      const ticketNumber = variables.ticket.ticketNumber;
      void queryClient.invalidateQueries({
        queryKey: ['ticket', ticketNumber],
      });
      void queryClient.invalidateQueries({
        queryKey: ['ticketDto', ticketNumber],
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
      const ticketNumber = variables.ticket.ticketNumber;
      void queryClient.invalidateQueries({
        queryKey: ['ticket', ticketNumber],
      });
      void queryClient.invalidateQueries({
        queryKey: ['ticketDto', ticketNumber],
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

export function useBulkCreateExternalRequestors() {
  const mutation = useMutation({
    mutationFn: (
      bulkAddExternalRequestorRequest: BulkAddExternalRequestorRequest,
    ) => {
      return TicketsService.bulkCreateExternalRequestors(
        bulkAddExternalRequestorRequest,
      );
    },
    onError: () => {
      enqueueSnackbar('Error updating', {
        variant: 'error',
      });
    },
    onSuccess: () => {
      enqueueSnackbar('Process complete.', {
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
  const queryClient = useQueryClient();
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
    onSuccess: (_, variables) => {
      const ticketNumber = variables.ticket?.ticketNumber;
      void queryClient.invalidateQueries({
        queryKey: ['ticket', ticketNumber],
      });
      void queryClient.invalidateQueries({
        queryKey: ['ticketDto', ticketNumber],
      });
    },
  });

  return mutation;
}

interface UseDeleteAdditionalFieldsArguments {
  ticket: Ticket | undefined;
  additionalFieldType: AdditionalFieldType;
}

export function useDeleteAdditionalFields() {
  const queryClient = useQueryClient();
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
    onSuccess: (_, variables) => {
      const ticketNumber = variables.ticket?.ticketNumber;
      void queryClient.invalidateQueries({
        queryKey: ['ticket', ticketNumber],
      });
      void queryClient.invalidateQueries({
        queryKey: ['ticketDto', ticketNumber],
      });
    },
  });

  return deleteMutation;
}

interface useUpdateTaskAssociationArguments {
  ticketId: number;
  ticketNumber: string;
  taskKey: string;
}

export function useUpdateTaskAssociation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ ticketId, taskKey }: useUpdateTaskAssociationArguments) => {
      return TicketsService.createTaskAssociation(ticketId, taskKey);
    },
    onSuccess: (response, request) => {
      response.ticketId = request.ticketId;
      response.ticketNumber = request.ticketNumber;

      queryClient.setQueryData(
        allTaskAssociationsOptions().queryKey,
        oldData => {
          // Assuming the old data structure and response structure are known
          if (oldData) {
            return [...oldData, response];
          }
          return [response];
        },
      );
      void queryClient.invalidateQueries({
        queryKey: ['ticket', request.ticketNumber],
      });
    },
  });

  return mutation;
}

interface useDeleteTaskAssociationArguments {
  ticket: Ticket;
  taskAssociationId: number;
}

export function useDeleteTaskAssociation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({
      ticket,
      taskAssociationId,
    }: useDeleteTaskAssociationArguments) => {
      return TicketsService.deleteTaskAssociation(ticket.id, taskAssociationId);
    },
    onSuccess: (response, request) => {
      queryClient.setQueryData(
        allTaskAssociationsOptions().queryKey,
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
      void queryClient.invalidateQueries({
        queryKey: ['ticket', request.ticket.ticketNumber],
      });
    },
  });

  return mutation;
}

interface UseUpdateCommentParams {
  ticket: Ticket;
  comment: Comment;
}
export function useUpdateComment() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ ticket, comment }: UseUpdateCommentParams) => {
      return TicketsService.editTicketComment(ticket.id, comment);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['ticket', variables.ticket.ticketNumber],
      });
    },
  });

  return mutation;
}
