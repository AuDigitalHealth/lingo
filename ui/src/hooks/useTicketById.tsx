import { useEffect, useState } from 'react';

import useTicketStore from '../stores/TicketStore';
import { Comment, Ticket } from '../types/tickets/ticket';
import TicketsService from '../api/TicketsService';

function useTicketById(id: string | undefined) {
  const [ticket, setTicket] = useState<Ticket | undefined>();
  const { getTicketById, tickets } = useTicketStore();

  useEffect(() => {
    const tempTicket: Ticket | undefined = getTicketById(Number(id));
    sortComments(tempTicket?.comments);
    setTicket(tempTicket);
    void (async () => {
      const fullTicket = await TicketsService.getIndividualTicket(Number(id));
      sortComments(fullTicket?.comments);
      setTicket(fullTicket);
    })();
  }, [id, tickets, getTicketById]);

  return ticket;
}

function sortComments(comments: Comment[] | undefined) {
  if (comments === undefined) return;
  comments.sort((a: Comment, b: Comment) => {
    return new Date(a.created).getTime() - new Date(b.created).getTime();
  });
}

export default useTicketById;
