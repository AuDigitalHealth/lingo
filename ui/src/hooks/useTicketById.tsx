import useTicketStore from '../stores/TicketStore';
import { Comment } from '../types/tickets/ticket';
import TicketsService from '../api/TicketsService';
import TicketProductService from '../api/TicketProductService.ts';
import { useQuery } from '@tanstack/react-query';

function sortComments(comments: Comment[] | undefined) {
  if (comments === undefined) return;
  comments.sort((a: Comment, b: Comment) => {
    return new Date(a.created).getTime() - new Date(b.created).getTime();
  });
}

function useTicketById(id: string | undefined) {
  const { mergeTickets } = useTicketStore();

  const { data: ticket, isLoading } = useQuery(
    ['ticket', id],
    async () => {
      if (!id) return undefined;

      const fullTicket = await TicketsService.getIndividualTicket(Number(id));
      const products = await TicketProductService.getTicketProducts(Number(id));
      fullTicket.products = products;
      sortComments(fullTicket?.comments);

      mergeTickets(fullTicket);

      return fullTicket;
    },
    {
      enabled: !!id,
      staleTime: 2 * 60 * 1000,
    },
  );

  return { ticket, isLoading };
}
export default useTicketById;
