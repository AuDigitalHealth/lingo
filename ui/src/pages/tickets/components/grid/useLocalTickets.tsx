import { useCallback, useEffect, useState } from 'react';
import useTicketStore from '../../../../stores/TicketStore';
import { LazyTableState } from '../../TicketsBacklog';
import { PagedTicket, Ticket } from '../../../../types/tickets/ticket';
import TicketsService from '../../../../api/TicketsService';

export default function useLocalTickets(lazyState: LazyTableState) {
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

  const handlePagedTicketChange = useCallback(
    (pagedTickets: PagedTicket[]) => {
      const localPagedTickets = getPagedTicketByPageNumber(lazyState.page);

      setTotalRecords(
        localPagedTickets?.page.totalElements
          ? localPagedTickets?.page.totalElements
          : 0,
      );

      setLocalTickets(
        localPagedTickets?._embedded.ticketDtoList
          ? localPagedTickets?._embedded.ticketDtoList
          : [],
      );
      if (
        pagedTickets.length > 0 &&
        pagedTickets[0].page.totalPages >= lazyState.page &&
        localPagedTickets === undefined
      ) {
        searchPaginatedTickets(searchConditionsBody);
      }
    },
    [getPagedTicketByPageNumber, lazyState.page, searchConditionsBody],
  );

  useEffect(() => {
    handlePagedTicketChange(pagedTickets);
  }, [pagedTickets]);

  useEffect(() => {
    searchPaginatedTickets(searchConditionsBody);
  }, [searchConditionsBody, lazyState.page]);

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
    [pagedTickets, lazyState.page],
  );

  return { loading, localTickets, totalRecords };
}
