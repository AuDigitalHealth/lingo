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

import { PriorityBucket, TicketDto } from '../../../types/tickets/ticket';

export function mapToPriorityOptions(buckets: PriorityBucket[]) {
  const priortyList = buckets.map(iteration => {
    return { value: iteration.name, label: iteration.name };
  });
  return priortyList;
}

export function sortTicketsByPriority(tickets: TicketDto[]) {
  tickets?.sort((ticketA, ticketB) => {
    const aVal = ticketA.priorityBucket
      ? ticketA.priorityBucket.orderIndex
      : -1;
    const bVal = ticketB.priorityBucket
      ? ticketB.priorityBucket.orderIndex
      : -1;
    return aVal - bVal;
  });
  return tickets;
}
