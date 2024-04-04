import { useEffect, useState } from 'react';
import useTicketById from '../../useTicketById.tsx';

export default function useCanEditTicket(ticketId: string | undefined) {
  const { ticket } = useTicketById(ticketId);
  const [canEdit, setCanEdit] = useState(false);
  useEffect(() => {
    setCanEdit(ticket?.state?.label !== 'Closed');
  }, [ticket]);

  return [canEdit];
}
