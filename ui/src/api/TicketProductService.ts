import axios, { AxiosResponse } from 'axios';
import { TicketProductDto } from '../types/tickets/ticket.ts';

const TicketProductService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid concept response');
  },

  async getTicketProducts(ticketId: number): Promise<TicketProductDto[]> {
    const response = await axios.get(`/api/tickets/${ticketId}/products`);
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as TicketProductDto[];
  },
  async getTicketProduct(
    ticketId: number,
    productName: string,
  ): Promise<TicketProductDto> {
    const response = await axios.get(
      `/api/tickets/${ticketId}/products/${productName}`,
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as TicketProductDto;
  },
  async deleteTicketProduct(
    ticketId: number,
    productName: string,
  ): Promise<AxiosResponse> {
    const response = await axios.delete(
      `/api/tickets/${ticketId}/products/${productName}`,
    );
    if (response.status != 204) {
      this.handleErrors();
    }

    return response;
  },
  async draftTicketProduct(
    ticketId: number,
    ticketProductDto: TicketProductDto,
  ): Promise<AxiosResponse> {
    const response = await axios.put(
      `/api/tickets/${ticketId}/products`,
      ticketProductDto,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response;
  },
};

export default TicketProductService;
