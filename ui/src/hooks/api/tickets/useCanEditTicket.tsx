import { useEffect, useState } from 'react';
import useTicketDtoById from './useTicketById.tsx';
import { Ticket } from '../../../types/tickets/ticket.ts';

export function useCanEditTicketById(ticketId: string | undefined) {
  const { ticket } = useTicketDtoById(ticketId);
  const [canEdit, setCanEdit] = useState(false);
  useEffect(() => {
    setCanEdit(ticket?.state?.label.toLowerCase().trim() !== 'closed');
  }, [ticket]);

  return { canEdit };
}

export function useCanEditTicket(ticket: Ticket | undefined) {
  const [canEdit, setCanEdit] = useState(false);
  const [lockDescription, setLockDescription] = useState<string | undefined>(
    undefined,
  );
  useEffect(() => {
    if (ticket?.state?.label.toLowerCase().trim() === 'closed') {
      setCanEdit(false);
      setLockDescription(
        `Unable to edit ticket as it is "${ticket?.state.label}"`,
      );
    } else {
      setCanEdit(true);
    }
  }, [ticket]);

  return { canEdit, lockDescription };
}
