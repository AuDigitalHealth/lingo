import { useEffect, useState } from 'react';
import useTicketById from '../../useTicketById.tsx';
import { Ticket } from '../../../types/tickets/ticket.ts';

export function useCanEditTicketById(ticketId: string | undefined) {
  const { ticket } = useTicketById(ticketId);
  const [canEdit, setCanEdit] = useState(false);
  useEffect(() => {
    setCanEdit(ticket?.state?.label !== 'Closed');
  }, [ticket]);

  return [canEdit];
}

export function useCanEditTicket(ticket: Ticket | undefined) {
  const [canEdit, setCanEdit] = useState(false);
  useEffect(() => {
    setCanEdit(ticket?.state?.label !== 'Closed');
  }, [ticket]);

  return [canEdit];
}
