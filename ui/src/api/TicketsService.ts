import axios, { AxiosResponse } from 'axios';
import {
  AdditionalFieldType,
  AdditionalFieldTypeOfListType,
  AdditionalFieldValue,
  Comment,
  Iteration,
  LabelType,
  PagedTicket,
  PriorityBucket,
  State,
  TaskAssocation,
  Ticket,
  TicketDto,
} from '../types/tickets/ticket';

const TicketsService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid ticket response');
  },
  async getIndividualTicket(id: number): Promise<TicketDto> {
    const response = await axios.get(`/api/tickets/${id}`);
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as TicketDto;
  },
  async getPaginatedTickets(page: number, size: number): Promise<PagedTicket> {
    const pageAndSize = `page=${page}&size=${size}`;
    const response = await axios.get('/api/tickets?' + pageAndSize);
    if (response.status != 200) {
      this.handleErrors();
    }
    const pagedResponse = response.data as PagedTicket;
    return pagedResponse;
  },
  async getTaskAssociations(): Promise<TaskAssocation[]> {
    const response = await axios.get('/api/tickets/taskAssociations');
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as TaskAssocation[];
  },
  async createTaskAssociation(
    ticketId: number,
    taskId: string,
  ): Promise<TaskAssocation> {
    const response = await axios.post(
      `/api/tickets/${ticketId}/taskAssociations/${taskId}`,
    );

    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as TaskAssocation;
  },
  async deleteTaskAssociation(
    ticketId: number,
    taskAssociationId: number,
  ): Promise<number> {
    const response = await axios.delete(
      `/api/tickets/${ticketId}/taskAssociations/${taskAssociationId}`,
    );

    if (response.status != 204) {
      this.handleErrors();
    }

    return response.status;
  },
  async searchPaginatedTickets(
    queryParams: string,
    page: number,
    size: number,
  ): Promise<PagedTicket> {
    const queryPageAndSize = `${queryParams}&page=${page}&size=${size}`;
    const response = await axios.get('/api/tickets/search' + queryPageAndSize);
    if (response.status != 200) {
      this.handleErrors();
    }
    const pagedResponse = response.data as PagedTicket;
    return pagedResponse;
  },
  async updateTicketState(ticket: Ticket): Promise<Ticket> {
    const response = await axios.put(
      `/api/tickets/${ticket.id}/state/${ticket?.state?.id}`,
      ticket,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Ticket;
  },
  async deleteTicketState(ticket: Ticket): Promise<AxiosResponse> {
    const response = await axios.delete(`/api/tickets/${ticket.id}/state`);
    if (response.status != 204) {
      this.handleErrors();
    }

    return response;
  },
  async updateTicket(ticket: Ticket): Promise<Ticket> {
    const response = await axios.put(`/api/tickets/${ticket.id}`, ticket);
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Ticket;
  },
  async updateTicketIteration(ticket: Ticket): Promise<Ticket> {
    const response = await axios.put(
      `/api/tickets/${ticket.id}/iteration/${ticket?.iteration?.id}`,
      ticket,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Ticket;
  },
  async deleteTicketIteration(ticket: Ticket): Promise<AxiosResponse> {
    const response = await axios.delete(`/api/tickets/${ticket.id}/iteration`);
    if (response.status != 204) {
      this.handleErrors();
    }

    return response;
  },
  async updateTicketPriority(ticket: Ticket): Promise<Ticket> {
    const response = await axios.put(
      `/api/tickets/${ticket.id}/priorityBuckets/${ticket.priorityBucket?.id}`,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Ticket;
  },
  async deleteTicketPriority(ticket: Ticket): Promise<AxiosResponse> {
    const response = await axios.delete(
      `/api/tickets/${ticket.id}/priorityBuckets`,
    );
    if (response.status != 204) {
      this.handleErrors();
    }

    return response;
  },
  async addTicketLabel(id: string, labelId: number) {
    const response = await axios.post(`/api/tickets/${id}/labels/${labelId}`);
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as LabelType;
  },
  async addTicketComment(ticketId: number, content: string): Promise<Comment> {
    const response = await axios.post(`/api/tickets/${ticketId}/comments`, {
      text: content,
    });
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Comment;
  },
  async deleteTicketComment(commentId: number, ticketId: number) {
    const response = await axios.delete(
      `/api/tickets/${ticketId}/comments/${commentId}`,
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    return response;
  },
  async deleteTicketLabel(id: string, labelId: number) {
    const response = await axios.delete(`/api/tickets/${id}/labels/${labelId}`);
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as LabelType;
  },
  async updateAssignee(ticket: Ticket): Promise<Ticket> {
    const response = await axios.put(
      `/api/tickets/${ticket.id}/assignee/${ticket.assignee}`,
      ticket,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Ticket;
  },
  async updateAdditionalFieldValue(
    ticketId: number | undefined,
    additionalFieldType: AdditionalFieldType,
    valueOf: string | undefined,
  ): Promise<AdditionalFieldValue> {
    const response = await axios.post(
      `/api/tickets/${ticketId}/additionalFieldValue/${additionalFieldType.id}/${valueOf}`,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as AdditionalFieldValue;
  },
  async deleteAdditionalFieldValue(
    ticketId: number | undefined,
    additionalFieldType: AdditionalFieldType,
  ): Promise<AxiosResponse> {
    const response = await axios.delete(
      `/api/tickets/${ticketId}/additionalFieldValue/${additionalFieldType.id}`,
    );
    if (response.status != 204) {
      this.handleErrors();
    }

    return response;
  },
  async getAllStates(): Promise<State[]> {
    const response = await axios.get('/api/tickets/state');
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as State[];
  },
  async getAllPriorityBuckets(): Promise<PriorityBucket[]> {
    const response = await axios.get('/api/tickets/priorityBuckets');
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as PriorityBucket[];
  },
  async getAllLabelTypes(): Promise<LabelType[]> {
    const response = await axios.get('/api/tickets/labelType');
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as LabelType[];
  },
  async getAllIterations(): Promise<Iteration[]> {
    const response = await axios.get('/api/tickets/iterations');
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Iteration[];
  },
  async getAllAdditionalFieldTypes(): Promise<AdditionalFieldType[]> {
    const response = await axios.get('/api/tickets/additionalFieldTypes');
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as AdditionalFieldType[];
  },
  async getAllAdditionalFieldTypessWithValues(): Promise<
    AdditionalFieldTypeOfListType[]
  > {
    const response = await axios.get('/api/additionalFieldValuesForListType');
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as AdditionalFieldTypeOfListType[];
  },
};

export default TicketsService;
