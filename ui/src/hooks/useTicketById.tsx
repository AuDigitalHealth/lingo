import { useEffect, useState } from 'react';

import useTicketStore from '../stores/TicketStore';
import { Comment, Ticket, TicketDto } from '../types/tickets/ticket';
import TicketsService from '../api/TicketsService';

function useTicketById(id: string | undefined) {
  const [ticket, setTicket] = useState<TicketDto | undefined>();
  const { getTicketById, tickets, mergeTickets } = useTicketStore();

  useEffect(() => {
    const tempTicket: TicketDto | undefined = getTicketById(Number(id));
    sortComments(tempTicket?.comments);
    setTicket(tempTicket);
    void (async () => {
      const fullTicket = await TicketsService.getIndividualTicket(Number(id));
      sortComments(fullTicket?.comments);
      setTicket(fullTicket);
      mergeTickets(fullTicket);
    })();
  }, [id, getTicketById]);

  return ticket;
}

function sortComments(comments: Comment[] | undefined) {
  if (comments === undefined) return;
  comments.sort((a: Comment, b: Comment) => {
    return new Date(a.created).getTime() - new Date(b.created).getTime();
  });
}

export default useTicketById;
