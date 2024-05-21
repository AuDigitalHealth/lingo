import { useCallback, useEffect, useState } from 'react';
import useTicketStore from '../../../../stores/TicketStore';
import {
  PagedTicket,
  Ticket,
  TicketDto,
} from '../../../../types/tickets/ticket';
import TicketsService from '../../../../api/TicketsService';
import { LazyTicketTableState } from '../../../../types/tickets/table';
import { SearchConditionBody } from '../../../../types/tickets/search';
import { generateSearchConditions } from './GenerateSearchConditions';

export default function useLocalTickets(lazyState: LazyTicketTableState) {
  const {
    addPagedTickets,
    clearPagedTickets,
    pagedTickets,
    getPagedTicketByPageNumber,
    searchConditionsBody,
  } = useTicketStore();

  const [totalRecords, setTotalRecords] = useState(0);
  const [localTickets, setLocalTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const searchPaginatedTickets = useCallback(
    (searchConditions: SearchConditionBody | undefined) => {
      setLoading(true);
      TicketsService.searchPaginatedTicketsByPost(
        searchConditions,
        lazyState.page,
        20,
      )
        .then((returnPagedTickets: PagedTicket) => {
          setLoading(false);
          if (returnPagedTickets.page.totalElements > 0) {
            addPagedTickets(returnPagedTickets);
          } else if (
            returnPagedTickets.page.totalElements === 0 &&
            pagedTickets[0].page.totalElements > 0
          ) {
            clearPagedTickets();
          }
        })
        .catch(err => console.log(err));
    },
    [pagedTickets, lazyState.page, addPagedTickets, clearPagedTickets],
  );

  const handlePagedTicketChange = useCallback(
    (pagedTickets: PagedTicket[]) => {
      const localPagedTickets = getPagedTicketByPageNumber(lazyState.page);

      setTotalRecords(
        localPagedTickets?.page.totalElements
          ? localPagedTickets?.page.totalElements
          : 0,
      );

      setLocalTickets(
        localPagedTickets?._embedded
          ? (localPagedTickets?._embedded.ticketDtoList as TicketDto[])
          : ([] as TicketDto[]),
      );
      if (
        pagedTickets.length > 0 &&
        pagedTickets[0].page.totalPages >= lazyState.page &&
        localPagedTickets === undefined
      ) {
        searchPaginatedTickets(searchConditionsBody);
      }
    },
    [
      getPagedTicketByPageNumber,
      lazyState.page,
      searchConditionsBody,
      searchPaginatedTickets,
    ],
  );

  useEffect(() => {
    handlePagedTicketChange(pagedTickets);
  }, [pagedTickets, handlePagedTicketChange]);

  useEffect(() => {
    if (searchConditionsBody !== undefined) {
      searchPaginatedTickets(searchConditionsBody);
    }
    // adding search paginated tickets here will create an infinite loop.
  }, [searchConditionsBody, lazyState.page]);

  return { loading, localTickets, totalRecords };
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
            ? (returnPagedTickets?._embedded.ticketDtoList as Ticket[])
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
