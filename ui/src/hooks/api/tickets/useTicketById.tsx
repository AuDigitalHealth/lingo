import useTicketStore from '../../../stores/TicketStore.ts';
import { Comment } from '../../../types/tickets/ticket.ts';
import TicketsService from '../../../api/TicketsService.ts';
import TicketProductService from '../../../api/TicketProductService.ts';
import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

function sortComments(comments: Comment[] | undefined) {
  if (comments === undefined) return;
  comments.sort((a: Comment, b: Comment) => {
    return new Date(a.created).getTime() - new Date(b.created).getTime();
  });
}

function useTicketDtoById(id: string | undefined, usingTicketNumber?: boolean) {
  const { mergeTicket: mergeTickets, tickets } = useTicketStore();

  const queryClient = useQueryClient();
  // Check if the ticket is already in the store
  const cachedTicket = usingTicketNumber
    ? tickets.find(ticket => ticket.ticketNumber === id)
    : tickets.find(ticket => ticket.id === Number(id));

  if (cachedTicket) {
    // Prefill the cache with the existing ticket data
    queryClient.setQueryData(['ticketDto', id], cachedTicket);
  }

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticketDto', id],
    queryFn: async () => {
      if (!id) return undefined;

      const fullTicket = usingTicketNumber
        ? await TicketsService.getIndividualTicketByTicketNumber(id)
        : await TicketsService.getIndividualTicket(Number(id));
      const products = await TicketProductService.getTicketProducts(
        Number(fullTicket.id),
      );
      const bulkProductActions =
        await TicketProductService.getTicketBulkProductActions(
          Number(fullTicket.id),
        );
      fullTicket.products = products;
      fullTicket.bulkProductActions = bulkProductActions;
      sortComments(fullTicket?.comments);

      mergeTickets(fullTicket);

      return fullTicket;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    initialData: cachedTicket,
  });

  return { ticket, isLoading };
}

export const getTicketByIdOptions = (
  id: string | undefined,
  useTicketNumber?: boolean,
) => {
  const queryKey = ['ticket', id];
  return queryOptions({
    queryKey,
    queryFn: () =>
      useTicketNumber
        ? TicketsService.getIndividualTicketByTicketNumber(id as string)
        : TicketsService.getIndividualTicket(Number(id)),
    retry: false,
    staleTime: 2 * 60 * 1000,
  });
};

export function useTicketById(
  id: string | undefined,
  fetch: boolean,
  useTicketNumber?: boolean,
) {
  const { mergeTicket } = useTicketStore();

  // Fetch the ticket first
  const queryResult = useQuery({
    ...getTicketByIdOptions(id, useTicketNumber),
    enabled: id !== undefined && fetch,
  });

  // Check if queryResult.data?.id is available before triggering products and bulk actions queries
  const productsQuery = useTicketProductsById(
    queryResult.data?.id ? String(queryResult.data.id) : undefined,
    !!queryResult.data?.id, // enable only when the ID is available
  );

  const bulkProductActionsQuery = useTicketBulkProductActionsById(
    queryResult.data?.id ? String(queryResult.data.id) : undefined,
    !!queryResult.data?.id, // enable only when the ID is available
  );

  useEffect(() => {
    if (queryResult.data) {
      sortComments(queryResult.data?.comments);

      if (productsQuery.data) {
        queryResult.data.products = productsQuery.data;
      }

      if (bulkProductActionsQuery.data) {
        queryResult.data.bulkProductActions = bulkProductActionsQuery.data;
      }

      mergeTicket(queryResult.data);
    }
  }, [queryResult.data, productsQuery.data, bulkProductActionsQuery.data]);

  return queryResult;
}

export const getTicketProductsByTicketIdOptions = (id: string | undefined) => {
  const queryKey = ['ticket-products', id];
  return queryOptions({
    queryKey,
    queryFn: () => TicketProductService.getTicketProducts(Number(id)),
    retry: false,
    staleTime: 2 * 60 * 1000,
  });
};

export const getTicketBulkProductActionsByTicketIdOptions = (
  id: string | undefined,
) => {
  const queryKey = ['ticket-bulk-product-actions', id];
  return queryOptions({
    queryKey,
    queryFn: () => TicketProductService.getTicketBulkProductActions(Number(id)),
    retry: false,
    staleTime: 2 * 60 * 1000,
  });
};

export function useTicketBulkProductActionsById(
  id: string | undefined,
  fetch: boolean,
) {
  const queryResult = useQuery({
    ...getTicketBulkProductActionsByTicketIdOptions(id),
    enabled: id !== undefined && fetch,
  });

  return queryResult;
}

export function useTicketProductsById(id: string | undefined, fetch: boolean) {
  const queryResult = useQuery({
    ...getTicketProductsByTicketIdOptions(id),
    enabled: id !== undefined && fetch,
  });

  return queryResult;
}

export const getTicketAssociationByTicketIdOptions = (
  id: number | undefined,
) => {
  const queryKey = ['ticket-association', id];
  return queryOptions({
    queryKey,
    queryFn: () => TicketProductService.getTicketAssociations(Number(id)),
    retry: false,
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export function useTicketAssociationByTicketId(id: number | undefined) {
  const queryResult = useQuery({
    ...getTicketAssociationByTicketIdOptions(id),
  });

  return queryResult;
}

export default useTicketDtoById;
