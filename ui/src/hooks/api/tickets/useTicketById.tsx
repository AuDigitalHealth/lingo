import useTicketStore from '../../../stores/TicketStore.ts';
import { Comment } from '../../../types/tickets/ticket.ts';
import TicketsService from '../../../api/TicketsService.ts';
import TicketProductService from '../../../api/TicketProductService.ts';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

function sortComments(comments: Comment[] | undefined) {
  if (comments === undefined) return;
  comments.sort((a: Comment, b: Comment) => {
    return new Date(a.created).getTime() - new Date(b.created).getTime();
  });
}

export const getTicketByTicketNumberOptions = (
  ticketNumber: string | undefined,
) => {
  const queryKey = ['ticket', ticketNumber];
  return queryOptions({
    queryKey,
    queryFn: () =>
      TicketsService.getIndividualTicketByTicketNumber(ticketNumber as string),
    retry: false,
    refetchOnMount: true,
  });
};

export function useTicketByTicketNumber(
  ticketNumber: string | undefined,
  fetch: boolean,
) {
  const { mergeTicket } = useTicketStore();
  // Fetch the ticket first
  const queryResult = useQuery({
    ...getTicketByTicketNumberOptions(ticketNumber),
    enabled: ticketNumber !== undefined && fetch,
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
  }, [
    queryResult.data,
    productsQuery.data,
    bulkProductActionsQuery.data,
    mergeTicket,
  ]);

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
    staleTime: 0,
    refetchOnMount: true,
  });
};

export function useTicketAssociationByTicketId(id: number | undefined) {
  const queryResult = useQuery({
    ...getTicketAssociationByTicketIdOptions(id),
  });

  return queryResult;
}
