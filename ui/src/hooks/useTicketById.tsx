import { useEffect, useState } from 'react';

import useTicketStore from '../stores/TicketStore';
import { Ticket } from '../types/tickets/ticket';

function useTicketById(id: string | undefined) {
  const [ticket, setTicket] = useState<Ticket | undefined>();
  const { getTicketById, tickets } = useTicketStore();

  useEffect(() => {
    const tempTicket: Ticket | undefined = getTicketById(Number(id));
    setTicket(tempTicket);
  }, [id, tickets]);

  return ticket;
}

export default useTicketById;
