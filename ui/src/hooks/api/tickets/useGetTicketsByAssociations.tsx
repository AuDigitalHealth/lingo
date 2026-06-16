import { useEffect, useState } from 'react';
import { TaskAssocation, Ticket } from '../../../types/tickets/ticket';
import useTicketStore from '../../../stores/TicketStore';
import TicketsService from '../../../api/TicketsService';

export default function useGetTicketsByAssociations(
  taskAssociations: TaskAssocation[],
): Ticket[] {
  const { tickets, addTickets, getAllTicketsByTaskAssociations } =
    useTicketStore();
  const [localTickets, setLocalTickets] = useState<Ticket[]>([]);

  // fetches all of the tickets that will be needed for this task
  // Only check the main `tickets` array (not pagedTickets) — getAllTicketsByTaskAssociations
  // only searches `tickets`, so a ticket that exists only in pagedTickets would be skipped
  // by getTicketById but never surfaced by getAllTicketsByTaskAssociations.
  useEffect(() => {
    taskAssociations.forEach(association => {
      const alreadyFetchedTicket = tickets.find(
        t => t.id === association.ticketId,
      );
      if (alreadyFetchedTicket === undefined) {
        TicketsService.getIndividualTicketByTicketNumber(
          association.ticketNumber,
        )
          .then(ticket => {
            addTickets([ticket]);
          })
          .catch(err => console.log(err));
      }
    });
  }, [taskAssociations, tickets, addTickets]);

  useEffect(() => {
    const tempTickets = getAllTicketsByTaskAssociations(taskAssociations);
    setLocalTickets(tempTickets);
  }, [tickets, taskAssociations, getAllTicketsByTaskAssociations]);

  return localTickets;
}
