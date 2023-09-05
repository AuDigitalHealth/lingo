import { create } from 'zustand';
import {
  Iteration,
  LabelType,
  PriorityBucket,
  State,
  Ticket,
} from '../types/tickets/ticket';
import { sortTicketsByPriority } from '../utils/helpers/tickets/priorityUtils';

interface TicketStoreConfig {
  tickets: Ticket[];
  iterations: Iteration[];
  availableStates: State[];
  activeTicket: Ticket | null;
  labelTypes: LabelType[];
  priorityBuckets: PriorityBucket[];
  setIterations: (iterations: Iteration[] | null) => void;
  setLabelTypes: (labelTypes: LabelType[] | null) => void;
  setAvailableStates: (states: State[] | null) => void;
  setTickets: (tickets: Ticket[] | null) => void;
  setPriorityBuckets: (buckets: PriorityBucket[]) => void;
  setActiveTicket: (ticket: Ticket | null) => void;
  getTicketsByStateId: (id: number) => Ticket[] | [];
  getTicketById: (id: number) => Ticket | undefined;
  getLabelByName: (labelName: string) => LabelType | undefined;
  mergeTickets: (updatedTicket: Ticket) => void;
}

const useTicketStore = create<TicketStoreConfig>()((set, get) => ({
  tickets: [],
  iterations: [],
  availableStates: [],
  labelTypes: [],
  priorityBuckets: [],
  activeTicket: null,
  setTickets: (tickets: Ticket[] | null) => {
    tickets = tickets !== null ? tickets : [];
    tickets = sortTicketsByPriority(tickets);
    set({ tickets: tickets ? tickets : [] });
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
  getTicketsByStateId: (id: number): Ticket[] | [] => {
    const returnTickets = get().tickets.filter(ticket => {
      return ticket?.state?.id === id;
    });

    return returnTickets;
  },
  getTicketById: (id: number): Ticket | undefined => {
    return get().tickets.find(ticket => {
      return ticket?.id === id;
    });
  },
  getLabelByName: (labelName: string): LabelType | undefined => {
    return get().labelTypes.find(labelType => {
      return labelType.name === labelName;
    });
  },
  mergeTickets: (updatedTicket: Ticket) => {
    const updatedTickets = get().tickets.map((ticket: Ticket): Ticket => {
      return ticket.id === updatedTicket.id ? updatedTicket : ticket;
    });
    sortTicketsByPriority(updatedTickets);
    set({ tickets: [...updatedTickets] });
  },
}));

export default useTicketStore;
