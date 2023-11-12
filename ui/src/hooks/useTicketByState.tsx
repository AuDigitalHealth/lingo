import { useEffect, useState } from 'react';
import { Ticket } from '../types/tickets/ticket';
import useTicketStore from '../stores/TicketStore';

interface UseTicketByStateProps {
  stateId: number;
}
function useTicketByState({ stateId }: UseTicketByStateProps) {
  const [columnTickets, setColumnTickets] = useState<Ticket[] | []>();
  const { tickets, availableStates, getTicketsByStateId } = useTicketStore();

  useEffect(() => {
    const tempTickets: Ticket[] | null = getTicketsByStateId(stateId);
    setColumnTickets(tempTickets);
  }, [stateId, tickets, availableStates, getTicketsByStateId]);

  return columnTickets;
}

export default useTicketByState;
