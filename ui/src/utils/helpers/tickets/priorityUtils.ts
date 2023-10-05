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
