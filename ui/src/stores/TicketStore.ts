import { create } from 'zustand';
import {
  AdditionalFieldType,
  AdditionalFieldTypeOfListType,
  Iteration,
  LabelType,
  PagedTicket,
  PriorityBucket,
  State,
  Ticket,
  TicketDto,
} from '../types/tickets/ticket';
import { sortTicketsByPriority } from '../utils/helpers/tickets/priorityUtils';

interface TicketStoreConfig {
  tickets: TicketDto[];
  pagedTickets: PagedTicket[];
  iterations: Iteration[];
  availableStates: State[];
  activeTicket: TicketDto | null;
  labelTypes: LabelType[];
  priorityBuckets: PriorityBucket[];
  additionalFieldTypes: AdditionalFieldType[];
  setAdditionalFieldTypes: (
    additionalFieldTypes: AdditionalFieldType[] | null,
  ) => void;
  additionalFieldTypesOfListType: AdditionalFieldTypeOfListType[];
  setAdditionalFieldTypesOfListType: (
    additionalFieldTypesOfListType: AdditionalFieldTypeOfListType[] | null,
  ) => void;
  addPagedTickets: (pagedTicket: PagedTicket) => void;
  getPagedTicketByPageNumber: (page: number) => PagedTicket | undefined;
  mergePagedTickets: (pagedTicket: PagedTicket) => void;
  setIterations: (iterations: Iteration[] | null) => void;
  setLabelTypes: (labelTypes: LabelType[] | null) => void;
  setAvailableStates: (states: State[] | null) => void;
  setTickets: (tickets: TicketDto[] | null) => void;
  setPriorityBuckets: (buckets: PriorityBucket[]) => void;
  setActiveTicket: (ticket: TicketDto | null) => void;
  getTicketsByStateId: (id: number) => Ticket[] | [];
  getTicketById: (id: number) => TicketDto | undefined;
  getLabelByName: (labelName: string) => LabelType | undefined;
  mergeTickets: (updatedTicket: TicketDto) => void;
}

const useTicketStore = create<TicketStoreConfig>()((set, get) => ({
  tickets: [],
  iterations: [],
  availableStates: [],
  pagedTickets: [],
  labelTypes: [],
  priorityBuckets: [],
  additionalFieldTypes: [],
  additionalFieldTypesOfListType: [],
  activeTicket: null,
  setTickets: (tickets: TicketDto[] | null) => {
    tickets = tickets !== null ? tickets : [];
    tickets = sortTicketsByPriority(tickets);
    set({ tickets: tickets ? tickets : [] });
  },
  addPagedTickets: (pagedTicket: PagedTicket) => {
    const existingPagedTickets = get().pagedTickets;
    const alreadyExists = existingPagedTickets.find(ticket => {
      return ticket.page.number === pagedTicket.page.number;
    });
    if (alreadyExists) {
      get().mergePagedTickets(pagedTicket);
    } else {
      const updatedPagedTickets = get().pagedTickets.concat(pagedTicket);
      set({
        tickets: get().tickets.concat(pagedTicket._embedded.ticketDtoList),
      });
      set({ pagedTickets: [...updatedPagedTickets] });
    }
  },
  getPagedTicketByPageNumber: (page: number) => {
    const foundTickets = get().pagedTickets.find(ticket => {
      return ticket.page.number === page;
    });

    return foundTickets;
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
  setIterations: (iterations: Iteration[] | null) => {
    set({ iterations: iterations ? iterations : [] });
  },
  setLabelTypes: (labelTypes: LabelType[] | null) => {
    set({ labelTypes: labelTypes ? labelTypes : [] });
  },
  setAvailableStates: (states: State[] | null) => {
    set({ availableStates: states ? states : [] });
  },
  setActiveTicket: ticket => {
    set({ activeTicket: ticket });
  },
  setPriorityBuckets: (buckets: PriorityBucket[]) => {
    buckets.sort((aBucket, bBucket) => {
      return aBucket.orderIndex - bBucket.orderIndex;
    });
    set({ priorityBuckets: buckets ? buckets : [] });
  },
  setAdditionalFieldTypes: (
    additionalFieldTypes: AdditionalFieldType[] | null,
  ) => {
    set({
      additionalFieldTypes: additionalFieldTypes ? additionalFieldTypes : [],
    });
  },
  setAdditionalFieldTypesOfListType: (
    additionalFieldTypesOfListType: AdditionalFieldTypeOfListType[] | null,
  ) => {
    set({
      additionalFieldTypesOfListType: additionalFieldTypesOfListType
        ? additionalFieldTypesOfListType
        : [],
    });
  },
  getTicketsByStateId: (id: number): TicketDto[] | [] => {
    const returnTickets = get().tickets.filter(ticket => {
      return ticket?.state?.id === id;
    });

    return returnTickets;
  },
  getTicketById: (id: number): TicketDto | undefined => {
    return get().tickets.find(ticket => {
      return ticket?.id === id;
    });
  },
  getLabelByName: (labelName: string): LabelType | undefined => {
    return get().labelTypes.find(labelType => {
      return labelType.name === labelName;
    });
  },
  mergeTickets: (updatedTicket: TicketDto) => {
    const updatedTickets = get().tickets.map((ticket: TicketDto): TicketDto => {
      return ticket.id === updatedTicket.id ? updatedTicket : ticket;
    });
    sortTicketsByPriority(updatedTickets);
    set({ tickets: [...updatedTickets] });
  },
}));

export default useTicketStore;
