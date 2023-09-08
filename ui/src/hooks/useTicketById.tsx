import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useTaskStore from '../stores/TaskStore';
import { Task } from '../types/task';
import useTicketStore from '../stores/TicketStore';
import { Ticket } from '../types/tickets/ticket';

function useTicketById(id: string | undefined) {
    if(id=== undefined) return undefined;

  const [ticket, setTicket] = useState<Ticket | undefined>();
  const {getTicketById, tickets} = useTicketStore();
  

  useEffect(() => {
    const tempTicket: Ticket | undefined = getTicketById(Number(id));
    setTicket(tempTicket);
  }, [id, tickets]);

  return ticket;
}

export default useTicketById;
