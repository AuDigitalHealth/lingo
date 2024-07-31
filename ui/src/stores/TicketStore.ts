import { create } from 'zustand';
import {
  PagedTicket,
  TaskAssocation,
  Ticket,
  TicketDto,
} from '../types/tickets/ticket';
import { sortTicketsByPriority } from '../utils/helpers/tickets/priorityUtils';
import { SearchConditionBody } from '../types/tickets/search';

export interface TicketStoreConfig {
  queryString: string;
  tickets: TicketDto[];
  pagedTickets: PagedTicket[];
  addPagedTickets: (pagedTicket: PagedTicket) => void;
  clearPagedTickets: () => void;
  getPagedTicketByPageNumber: (page: number) => PagedTicket | undefined;
  mergePagedTickets: (pagedTicket: PagedTicket) => void;
  mergeTicketIntoPage: (
    pagedTickets: PagedTicket[],
    updatedTicket: Ticket,
    page: number,
    queryPagedTickets: boolean,
  ) => void;
  addTickets: (newTickets: TicketDto[]) => void;
  getTicketsByStateId: (id: number) => Ticket[] | [];
  getTicketById: (id: number) => TicketDto | undefined;
  getAllTicketsByTaskAssociations: (
    taskAssociations: TaskAssocation[],
  ) => Ticket[];
  mergeTicket: (updatedTicket: Ticket) => void;
  mergeTickets: (updatedTickets: Ticket[]) => void;
  addTicket: (newTicket: Ticket) => void;
  updateQueryString: (newQueryString: string) => void;
  searchConditionsBody: SearchConditionBody | undefined;
  setSearchConditionsBody: (
    searchConditions: SearchConditionBody | undefined,
  ) => void;
}

const useTicketStore = create<TicketStoreConfig>()((set, get) => ({
  queryString: '',
  tickets: [],
  pagedTickets: [],
  searchConditionsBody: undefined,
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
  addPagedTickets: (pagedTicket: PagedTicket) => {
    const existingPagedTickets = get().pagedTickets;
    const alreadyExists = existingPagedTickets.find(ticket => {
      return ticket.page.number === pagedTicket.page.number;
    });
    if (alreadyExists) {
      get().mergePagedTickets(pagedTicket);
    } else if (pagedTicket._embedded?.ticketBacklogDtoList) {
      const updatedPagedTickets = get().pagedTickets.concat(pagedTicket);
      get().addTickets(pagedTicket._embedded.ticketBacklogDtoList);
      set({ pagedTickets: [...updatedPagedTickets] });
    }
  },
  getPagedTicketByPageNumber: (page: number) => {
    const foundTickets = get().pagedTickets.find(ticket => {
      return ticket.page.number === page;
    });

    return foundTickets;
  },
  clearPagedTickets: () => {
    set({ pagedTickets: [] });
  },
  mergePagedTickets: (pagedTicket: PagedTicket) => {
    const updatedPagedTickets = get().pagedTickets.map(
      (existingPagedTicket: PagedTicket): PagedTicket => {
        return pagedTicket.page.number === existingPagedTicket.page.number
          ? pagedTicket
          : existingPagedTicket;
      },
    );
    set({ pagedTickets: [...updatedPagedTickets] });
  },
  getTicketsByStateId: (id: number): TicketDto[] | [] => {
    const returnTickets = get().tickets.filter(ticket => {
      return ticket?.state?.id === id;
    });

    return returnTickets;
  },
  getTicketById: (id: number): TicketDto | undefined => {
    const extendedTicket = get().tickets.find(ticket => {
      return ticket?.id === id;
    });
    if (extendedTicket) {
      return extendedTicket;
    }
    let returnItem = undefined;
    get().pagedTickets.forEach(page => {
      const inThisPage = page._embedded?.ticketBacklogDtoList?.filter(
        ticket => {
          return ticket.id === id;
        },
      );
      if (inThisPage?.length === 1) {
        returnItem = inThisPage[0];
      }
    });
    return returnItem;
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
      get().pagedTickets.forEach((page, index) => {
        const inThisPage = page?._embedded?.ticketBacklogDtoList?.filter(
          ticket => {
            return ticket.id === updatedTicket.id;
          },
        );
        if (inThisPage?.length === 1) {
          get().mergeTicketIntoPage(
            get().pagedTickets,
            updatedTicket,
            index,
            false,
          );
        }
      });
    }

    sortTicketsByPriority(updatedTickets);
    set({ tickets: [...updatedTickets] });
  },
  mergeTickets: (updatedTickets: Ticket[]) => {
    const currentTickets = get().tickets;

    updatedTickets.forEach(updatedTicket => {
      const existingTicketIndex = currentTickets.findIndex(
        ticket => ticket.id === updatedTicket.id,
      );

      if (existingTicketIndex !== -1) {
        // Merge with the existing ticket
        currentTickets[existingTicketIndex] = updatedTicket;
      } else {
        // Add it to the ticket list
        currentTickets.push(updatedTicket);
      }

      if (get().pagedTickets !== undefined) {
        get().pagedTickets.forEach((page, index) => {
          const inThisPage = page?._embedded?.ticketBacklogDtoList?.some(
            ticket => ticket.id === updatedTicket.id,
          );
          if (inThisPage) {
            get().mergeTicketIntoPage(
              get().pagedTickets,
              updatedTicket,
              index,
              false,
            );
          }
        });
      }
    });

    sortTicketsByPriority(currentTickets);
    set({ tickets: [...currentTickets] });
  },
  mergeTicketIntoPage: (
    pagedTickets: PagedTicket[],
    updatedTicket: Ticket,
    page: number,
  ) => {
    const updatedTickets = pagedTickets[
      page
    ]?._embedded?.ticketBacklogDtoList?.map(ticket => {
      return ticket.id === updatedTicket.id ? updatedTicket : ticket;
    });

    if (pagedTickets[page]?._embedded !== undefined) {
      // eslint-disable-next-line
      (pagedTickets[page] as any)._embedded!.ticketBacklogDtoList =
        updatedTickets;
    }

    set({ pagedTickets: [...pagedTickets] });
  },
  addTicket: (newTicket: Ticket) => {
    set({ tickets: get().tickets.concat(newTicket) });
  },
  updateQueryString: (newQueryString: string) => {
    set({ queryString: newQueryString });
  },
  setSearchConditionsBody: (
    searchConditionsBody: SearchConditionBody | undefined,
  ) => {
    set({ searchConditionsBody: searchConditionsBody });
  },
}));

export default useTicketStore;
