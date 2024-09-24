import { create } from 'zustand';
import { TaskAssocation, Ticket, TicketDto } from '../types/tickets/ticket';
import { sortTicketsByPriority } from '../utils/helpers/tickets/priorityUtils';

export interface TicketStoreConfig {
  tickets: TicketDto[];
  pagedTickets: TicketDto[] | undefined;
  setPagedTickets: (tickets: TicketDto[] | undefined) => void;
  clearPagedTickets: () => void;
  addTickets: (newTickets: TicketDto[]) => void;
  getTicketById: (id: number) => TicketDto | undefined;
  getAllTicketsByTaskAssociations: (
    taskAssociations: TaskAssocation[],
  ) => Ticket[];
  deleteTicket: (ticketId: number) => void;
  mergeTicket: (updatedTicket: Ticket) => void;
  mergeTickets: (updatedTickets: Ticket[]) => void;
  addTicket: (newTicket: Ticket) => void;
}

const useTicketStore = create<TicketStoreConfig>()((set, get) => ({
  tickets: [],
  pagedTickets: [],
  setPagedTickets: (tickets: TicketDto[] | undefined) => {
    set({ pagedTickets: tickets });
  },
  addTickets: (newTickets: TicketDto[]) => {
    newTickets = newTickets !== null ? newTickets : [];
    const existingIds = new Set(get().tickets.map(ticket => ticket.id));
    const merged = [
      ...get().tickets,
      ...newTickets.filter(ticket => !existingIds.has(ticket.id)),
    ];
    const mergedAndSorted = sortTicketsByPriority(merged);
    set({ tickets: mergedAndSorted });
  },
  clearPagedTickets: () => {
    set({ pagedTickets: [] });
  },
  getTicketById: (id: number): TicketDto | undefined => {
    const extendedTicket = get().tickets.find(ticket => {
      return ticket?.id === id;
    });
    if (extendedTicket) {
      return extendedTicket;
    }
    return get().pagedTickets?.find(ticket => {
      return ticket.id === id;
    });
  },
  getAllTicketsByTaskAssociations: (taskAssociations: TaskAssocation[]) => {
    const returnTickets = get().tickets.filter(ticket => {
      return taskAssociations.some((taskAssociation: TaskAssocation) => {
        return taskAssociation.ticketId === ticket.id;
      });
    });
    return returnTickets;
  },
  mergeTicket: (updatedTicket: Ticket) => {
    let updatedTickets = get().tickets;
    // if it exists in the store already, merge it with the existing ticket
    if (
      get().tickets.filter(ticket => {
        return ticket.id === updatedTicket.id;
      }).length === 1
    ) {
      updatedTickets = get().tickets.map((ticket: Ticket): Ticket => {
        return ticket.id === updatedTicket.id ? updatedTicket : ticket;
      });
      // else, add it to the ticket list
    } else {
      updatedTickets.push(updatedTicket);
    }

    if (get().pagedTickets !== undefined) {
      const updatedTickets = get().pagedTickets?.map(ticket => {
        if (ticket.id === updatedTicket.id) {
          return updatedTicket;
        }
        return ticket;
      });
      if (updatedTickets !== undefined) {
        set({ pagedTickets: [...updatedTickets] });
      }
    }
  },
  deleteTicket: (ticketId: number) => {
    // Remove the ticket from pagedTickets if it exists
    if (get().pagedTickets !== undefined) {
      const updatedPagedTickets = get().pagedTickets?.filter(ticket => {
        return ticketId !== ticket.id;
      });

      // Update the store with the modified pagedTickets
      set({ pagedTickets: updatedPagedTickets });
    }
  },
  mergeTickets: (updatedTickets: Ticket[]) => {
    const currentTickets = get().tickets;

    updatedTickets.forEach(updatedTicket => {
      if (get().pagedTickets !== undefined) {
        get().pagedTickets?.forEach(ticket => {
          if (updatedTicket.id === ticket.id) {
            get().mergeTicket(updatedTicket);
          }
        });
      }
    });

    sortTicketsByPriority(currentTickets);
    set({ tickets: [...currentTickets] });
  },
  addTicket: (newTicket: Ticket) => {
    set({ tickets: get().tickets.concat(newTicket) });
  },
}));

export default useTicketStore;
