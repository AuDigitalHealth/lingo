import { create } from 'zustand';

const mockTickets: Ticket[] = [
  {
    name: 'ticket1',
  },
  {
    name: 'ticket2',
  },
  {
    name: 'ticket3',
  },
];

interface TicketStoreConfig {
  tickets: Ticket[];
  activeTicket: Ticket | null;
  setActiveTicket: (ticket: Ticket | null) => void;
}
const useTicketStore = create<TicketStoreConfig>()(set => ({
  tickets: mockTickets,
  activeTicket: null,
  setActiveTicket: ticket => {
    set({ activeTicket: ticket });
  },
}));

export interface Ticket {
  name: string;
}

export default useTicketStore;
