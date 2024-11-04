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

import { AxiosResponse } from 'axios';
import {
  TicketAssociation,
  TicketBulkProductActionDto,
  TicketProductDto,
} from '../types/tickets/ticket.ts';
import { api } from './api.ts';
const TicketProductService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid concept response');
  },
  async getTicketAssociations(ticketId: number): Promise<TicketAssociation[]> {
    const response = await api.get(
      `/api/tickets/ticketAssociation/${ticketId}`,
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as TicketAssociation[];
  },
  async getTicketProducts(ticketId: number): Promise<TicketProductDto[]> {
    const response = await api.get(`/api/tickets/${ticketId}/products`);
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as TicketProductDto[];
  },
  async getTicketBulkProductActions(
    ticketId: number,
  ): Promise<TicketBulkProductActionDto[]> {
    const response = await api.get(
      `/api/tickets/${ticketId}/bulk-product-actions`,
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as TicketBulkProductActionDto[];
  },
  async getTicketProduct(
    ticketId: number,
    productId: string,
  ): Promise<TicketProductDto> {
    const response = await api.get(
      `/api/tickets/${ticketId}/products/id/${productId}`,
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
    const response = await api.delete(
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
    const response = await api.put(
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
