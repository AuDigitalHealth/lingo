import axios from 'axios';
import { State, Ticket } from '../types/tickets/ticket';

const TicketsService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid ticket response');
  },

  async getAllTickets(): Promise<Ticket[]> {
    const response = await axios.get('/api/tickets');
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Ticket[];
  },
  async updateTicket(ticket: Ticket): Promise<Ticket> {
    console.log(ticket);
    const response = await axios.put(
      `/api/tickets/${ticket.id}/state/${ticket.state.id}`,
      ticket,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Ticket;
  },
  async getAllStates(): Promise<State[]> {
    const response = await axios.get('/api/tickets/state');
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as State[];
  },
};

export default TicketsService;
