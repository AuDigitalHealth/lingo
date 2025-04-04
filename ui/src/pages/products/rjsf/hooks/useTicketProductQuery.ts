import { useQuery } from '@tanstack/react-query';
import { Ticket } from '../../../../types/tickets/ticket.ts';
import TicketProductService from '../../../../api/TicketProductService.ts';
interface TicketProductQueryProps {
  ticketProductId?: string;
  ticket: Ticket;
  setFunction?: ({}) => void;
}
export const useTicketProductQuery = ({
  ticketProductId,
  ticket,
  setFunction,
}: TicketProductQueryProps) => {
  const queryKey = ['ticket-product', ticketProductId];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const data = await fetchTicketProductDataFn({ ticketProductId, ticket });
      if (setFunction && data) setFunction(data.packageDetails);
      return data;
    },
    enabled: !!ticketProductId && !!ticket.ticketNumber,
    staleTime: 0,
    gcTime: 0,
  });
};

const fetchTicketProductDataFn = async ({
  ticketProductId,
  ticket,
}: TicketProductQueryProps) => {
  if (!ticketProductId) return null;

  const mp = await TicketProductService.getTicketProduct(
    ticket.id,
    ticketProductId,
  );
  return mp ? mp : null;
};
