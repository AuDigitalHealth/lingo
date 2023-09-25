import { useEffect, useState } from 'react';
import { TaskAssocation, Ticket } from '../types/tickets/ticket';
import useTicketStore from '../stores/TicketStore';
import TicketsService from '../api/TicketsService';

export default function useGetTicketsByAssociations(
  taskAssociations: TaskAssocation[],
): Ticket[] {
  const { tickets, addTicket, getTicketById, getAllTicketsByTaskAssociations } =
    useTicketStore();
  const [localTickets, setLocalTickets] = useState<Ticket[]>([]);
  console.log('here');
  useEffect(() => {
    taskAssociations.forEach(association => {
      const alreadyFetchedTicket = getTicketById(association.ticketId);
      if (alreadyFetchedTicket === undefined) {
        TicketsService.getIndividualTicket(association.ticketId)
          .then(ticket => {
            addTicket(ticket);
          })
          .catch(err => console.log(err));
      }
    });
  }, [taskAssociations]);

  useEffect(() => {
    const tempTickets = getAllTicketsByTaskAssociations(taskAssociations);
    setLocalTickets(tempTickets);
  }, [tickets]);

  return localTickets;
}
