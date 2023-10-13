import { useEffect, useState } from 'react';
import { TaskAssocation, Ticket } from '../types/tickets/ticket';
import useTicketStore from '../stores/TicketStore';
import TicketsService from '../api/TicketsService';

export default function useGetTicketsByAssociations(
  taskAssociations: TaskAssocation[],
): Ticket[] {
  const {
    tickets,
    addTickets,
    getTicketById,
    getAllTicketsByTaskAssociations,
  } = useTicketStore();
  const [localTickets, setLocalTickets] = useState<Ticket[]>([]);

  // fetches all of the tickets that will be needed for this task
  useEffect(() => {
    taskAssociations.forEach(association => {
      const alreadyFetchedTicket = getTicketById(association.ticketId);
      if (alreadyFetchedTicket === undefined) {
        TicketsService.getIndividualTicket(association.ticketId)
          .then(ticket => {
            addTickets([ticket]);
          })
          .catch(err => console.log(err));
      }
    });
  }, [taskAssociations, addTickets, getTicketById]);

  useEffect(() => {
    console.log('task associations changed');
    const tempTickets = getAllTicketsByTaskAssociations(taskAssociations);
    setLocalTickets(tempTickets);
  }, [tickets, taskAssociations]);

  return localTickets;
}
