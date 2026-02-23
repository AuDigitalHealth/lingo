import { useQuery } from '@tanstack/react-query';

import TicketProductService from '../../../api/TicketProductService';

export function useTicketAuthoringHistory(conceptId: string | undefined) {
  const { isLoading, data, isError } = useQuery({
    queryKey: [`ticket-authoring-history-${conceptId}`],
    queryFn: () => TicketProductService.getTicketAuthoringHistory(conceptId!),
    enabled: !!conceptId,
  });

  return { isLoading, ticketAuthoringHistory: data, isError };
}
