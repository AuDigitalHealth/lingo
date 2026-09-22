///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import { useQuery } from '@tanstack/react-query';
import {
  Ticket,
  TicketProductAuditDto,
} from '../../../../types/tickets/ticket.ts';
import TicketProductService from '../../../../api/TicketProductService.ts';
import { mapAuditToProduct } from '../../../../utils/helpers/ticketProductsUtils.ts';
interface TicketProductQueryProps {
  ticketProductId?: string;
  productAuditDto?: TicketProductAuditDto;
  ticket: Ticket;
}
export const useTicketProductQuery = ({
  ticketProductId,
  productAuditDto,
  ticket,
}: TicketProductQueryProps) => {
  const queryKey = [
    'ticket-product',
    ticket.id,
    ticketProductId,
    productAuditDto ? productAuditDto?.revisionNumber : 0,
  ];
  return useQuery({
    queryKey,
    queryFn: async () => {
      if (productAuditDto) {
        // simulate async call
        return await new Promise(resolve => {
          setTimeout(() => {
            resolve(mapAuditToProduct(productAuditDto));
          }, 0); // 0 ms ensures microtask
        });
      }
      return await fetchTicketProductDataFn({ ticketProductId, ticket });
    },
    enabled: !!ticketProductId && !!ticket.ticketNumber,
    staleTime: 0,
    // Kept so the fetch timing is unchanged from before the queryFn-closure fix: with no retained
    // cache, `data` is undefined on the first render and the caller's effect applies the result
    // asynchronously, as the old in-queryFn write did.
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
/** Callers apply the result from `data` in an effect - see useTicketProductQuery for why. */
export const useTicketProductAuditQuery = ({
  ticketProductId,
  ticket,
}: TicketProductQueryProps) => {
  const queryKey = ['ticket-product-audit', ticket.id, ticketProductId];
  return useQuery({
    queryKey,
    queryFn: () => fetchTicketProductAuditDataFn({ ticketProductId, ticket }),
    enabled: !!ticketProductId && !!ticket.ticketNumber,
    staleTime: 0,
    // Kept so the fetch timing is unchanged from before the queryFn-closure fix: with no retained
    // cache, `data` is undefined on the first render and the caller's effect applies the result
    // asynchronously, as the old in-queryFn write did.
    gcTime: 0,
  });
};
const fetchTicketProductAuditDataFn = async ({
  ticketProductId,
  ticket,
}: TicketProductQueryProps) => {
  if (!ticketProductId) return null;

  const mp = await TicketProductService.getTicketProductAudit(
    ticket.id,
    ticketProductId,
  );
  return mp ? mp : null;
};
