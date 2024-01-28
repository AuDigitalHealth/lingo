import { useEffect, useState } from 'react';

import useTicketStore from '../stores/TicketStore';
import { Comment, Ticket, TicketDto } from '../types/tickets/ticket';
import TicketsService from '../api/TicketsService';
import TicketProductService from '../api/TicketProductService.ts';

function useTicketById(
  id: string | undefined,
  fetch: boolean,
  refreshKey: number,
) {
  const [ticket, setTicket] = useState<Ticket | undefined>();
  const { getTicketById, tickets, mergeTickets } = useTicketStore();

  useEffect(() => {
    const tempTicket: TicketDto | undefined = getTicketById(Number(id));
    sortComments(tempTicket?.comments);
    setTicket(Object.assign({}, tempTicket));
  }, [id, tickets, getTicketById]);

  useEffect(() => {
    void (async () => {
      const fullTicket = await TicketsService.getIndividualTicket(Number(id));
      const products = await TicketProductService.getTicketProducts(Number(id));
      fullTicket.products = products;
      sortComments(fullTicket?.comments);
      setTicket(fullTicket);
      mergeTickets(fullTicket);
    })();
  }, [fetch, refreshKey]);

  return ticket;
}

function sortComments(comments: Comment[] | undefined) {
  if (comments === undefined) return;
  comments.sort((a: Comment, b: Comment) => {
    return new Date(a.created).getTime() - new Date(b.created).getTime();
  });
}

export default useTicketById;
