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
import {
  mapAuditToProduct,
  mapToTicketProductDto,
} from '../../../../utils/helpers/ticketProductsUtils.ts';
interface TicketProductQueryProps {
  ticketProductId?: string;
  productAuditDto?: TicketProductAuditDto;
  ticket: Ticket;
  setFunction?: ({}) => void;
}
export const useTicketProductQuery = ({
  ticketProductId,
  productAuditDto,
  ticket,
  setFunction,
}: TicketProductQueryProps) => {
  const queryKey = [
    'ticket-product',
    ticketProductId,
    productAuditDto ? productAuditDto?.revisionNumber : 0,
  ];
  return useQuery({
    queryKey,
    queryFn: async () => {
      let data;

      if (productAuditDto) {
        // simulate async call
        data = await new Promise(resolve => {
          setTimeout(() => {
            resolve(mapAuditToProduct(productAuditDto));
          }, 0); // 0 ms ensures microtask
        });
      } else {
        data = await fetchTicketProductDataFn({ ticketProductId, ticket });
      }

      if (setFunction && data) {
        setFunction(data);
      }

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
export const useTicketProductAuditQuery = ({
  ticketProductId,
  ticket,
  setFunction,
}: TicketProductQueryProps) => {
  const queryKey = ['ticket-product-audit', ticketProductId];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const data = await fetchTicketProductAuditDataFn({
        ticketProductId,
        ticket,
      });
      if (setFunction && data) setFunction(data);
      return data;
    },
    enabled: !!ticketProductId && !!ticket.ticketNumber,
    staleTime: 0,
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
