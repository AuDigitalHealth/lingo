import { create } from 'zustand';
import { LabelType, State, Ticket } from '../types/tickets/ticket';

interface TicketStoreConfig {
  tickets: Ticket[];
  availableStates: State[];
  activeTicket: Ticket | null;
  labelTypes: LabelType[];
  setLabelTypes: (labelTypes: LabelType[] | null) => void;
  setAvailableStates: (states: State[] | null) => void;
  setTickets: (tickets: Ticket[] | null) => void;
  setActiveTicket: (ticket: Ticket | null) => void;
  getTicketsByStateId: (id: number) => Ticket[] | [];
  getTicketById: (id: number) => Ticket | undefined;
  mergeTickets: (updatedTicket: Ticket) => void;
}

const useTicketStore = create<TicketStoreConfig>()((set, get) => ({
  tickets: [],
  availableStates: [],
  labelTypes: [],
  activeTicket: null,
  setTickets: (tickets: Ticket[] | null) => {
    set({ tickets: tickets ? tickets : [] });
  },
  setLabelTypes: (labelTypes: LabelType[] | null) => {
    set({ labelTypes: labelTypes ? labelTypes : []});
  },
  setAvailableStates: (states: State[] | null) => {
    set({ availableStates: states ? states : [] });
  },
  setActiveTicket: ticket => {
    set({ activeTicket: ticket });
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
  mergeTickets: (updatedTicket: Ticket) => {
    const updatedTickets = get().tickets.map((ticket: Ticket): Ticket => {
      return ticket.id === updatedTicket.id ? updatedTicket : ticket;
    });
    set({ tickets: [...updatedTickets] });
  },
}));

export default useTicketStore;
