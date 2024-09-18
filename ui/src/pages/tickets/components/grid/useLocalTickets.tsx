import { useEffect, useState } from 'react';
import useTicketStore from '../../../../stores/TicketStore';
import { PagedTicket, Ticket } from '../../../../types/tickets/ticket';
import TicketsService from '../../../../api/TicketsService';
import { LazyTicketTableState } from '../../../../types/tickets/table';
import { SearchConditionBody } from '../../../../types/tickets/search';
import { generateSearchConditions } from './GenerateSearchConditions';
import { useMutation } from '@tanstack/react-query';

export const useSearchTickets = () => {
  const { setPagedTickets, clearPagedTickets, pagedTickets } = useTicketStore();

  const [totalRecords, setTotalRecords] = useState(0);

  const mutation = useSearchTicketsMutation();
  const searchTickets = (
    lazyState: LazyTicketTableState,
    globalFilterValue: string,
  ) => {
    mutation.mutate(
      { lazyState, globalFilterValue },
      {
        onSuccess: response => {
          setTotalRecords(response?.page.totalElements);

          if (response.page.totalElements > 0) {
            setPagedTickets(response._embedded?.ticketBacklogDtoList);
          } else if (response.page.totalElements === 0) {
            clearPagedTickets();
          }
        },
      },
    );
  };

  return {
    searchTickets,
    loading: mutation.isPending,
    localTickets: pagedTickets,
    totalRecords,
  };
};

interface UseSearchTicketsMutationArgs {
  lazyState: LazyTicketTableState;
  globalFilterValue: string;
}

function useSearchTicketsMutation() {
  return useMutation({
    mutationFn: ({
      lazyState,
      globalFilterValue,
    }: UseSearchTicketsMutationArgs) => {
      const searchConditions = generateSearchConditions(
        lazyState,
        globalFilterValue,
      );
      return TicketsService.searchPaginatedTicketsByPost(
        searchConditions,
        lazyState.page,
        20,
      );
    },
  });
}
interface useLocalTicketsLazyStateProps {
  lazyState: LazyTicketTableState;
}
export function useLocalTicketsLazyState({
  lazyState,
}: useLocalTicketsLazyStateProps): {
  totalRecords: number;
  localTickets: Ticket[];
  loading: boolean;
} {
  const [totalRecords, setTotalRecords] = useState(0);
  const [localTickets, setLocalTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchConditionsBody, setSearchConditionsBody] = useState<
    SearchConditionBody | undefined
  >();
  useEffect(() => {
    const conditions = generateSearchConditions(lazyState, '');

    setSearchConditionsBody(conditions);
  }, [lazyState]);

  useEffect(() => {
    if (
      !searchConditionsBody ||
      (searchConditionsBody?.searchConditions.length === 0 &&
        searchConditionsBody?.orderCondition?.fieldName === '')
    )
      return;
    setLoading(true);
    TicketsService.searchPaginatedTicketsByPost(
      searchConditionsBody,
      lazyState.page,
      20,
    )
      .then((returnPagedTickets: PagedTicket) => {
        setLoading(false);
        setLocalTickets(
          returnPagedTickets?._embedded
            ? (returnPagedTickets?._embedded.ticketBacklogDtoList as Ticket[])
            : [],
        );
        setTotalRecords(returnPagedTickets.page.totalElements);
      })
      .catch(err => console.log(err))
      .finally(() => setLoading(false));
  }, [searchConditionsBody]);

  return {
    totalRecords,
    localTickets,
    loading,
  };
}
