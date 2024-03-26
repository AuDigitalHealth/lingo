import axios, { AxiosResponse } from 'axios';
import {
  AdditionalFieldType,
  AdditionalFieldTypeOfListType,
  AdditionalFieldValue,
  Comment,
  Iteration,
  IterationDto,
  LabelType,
  LabelTypeDto,
  PagedTicket,
  PriorityBucket,
  Schedule,
  State,
  TaskAssocation,
  Ticket,
  TicketAssociation,
  TicketAssociationDto,
  TicketDtoMinimal,
  TicketFilter,
  TicketFilterDto,
  UiSearchConfiguration,
  UiSearchConfigurationDto,
} from '../types/tickets/ticket';
import { getFileNameFromContentDisposition } from '../utils/helpers/fileUtils';
import { saveAs } from 'file-saver';
import { SearchConditionBody } from '../types/tickets/search';

const TicketsService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid ticket response');
  },
  async getIndividualTicket(id: number): Promise<Ticket> {
    const response = await axios.get(`/api/tickets/${id}`);
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as Ticket;
  },
  async createTicket(ticket: TicketDtoMinimal): Promise<Ticket> {
    const response = await axios.post(`/api/tickets`, ticket);
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as Ticket;
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
  async createTicketAssociation(
    sourceId: number,
    targetId: number,
    association: TicketAssociationDto,
  ): Promise<TicketAssociation> {
    const response = await axios.post(
      `/api/tickets/ticketAssociation/sourceTicket/${sourceId}/targetTicket/${targetId}`,
      association,
    );

    if (response.status != 201) {
      this.handleErrors();
    }

    return response.data as TicketAssociation;
  },
  async deleteTicketAssociation(id: number): Promise<number> {
    const response = await axios.delete(`/api/tickets/ticketAssociation/${id}`);

    if (response.status != 204) {
      this.handleErrors();
    }

    return response.status;
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
  async searchPaginatedTicketsByPost(
    searchConditionBody: SearchConditionBody | undefined,
    page: number,
    size: number,
  ): Promise<PagedTicket> {
    const queryPageAndSize = `?page=${page}&size=${size}`;
    // let localSearchConditionBody : SearchConditionBody = {
    //   searchConditions: searchConditionBody?.searchConditions ? searchConditionBody?.searchConditions : [],
    //   orderCondition: searchConditionBody?.orderCondition,
    // }
    const response = await axios.post(
      '/api/tickets/search' + queryPageAndSize,
      searchConditionBody ? searchConditionBody : {},
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const pagedResponse = response.data as PagedTicket;
    return pagedResponse;
  },
  async updateTicketState(ticket: Ticket, stateId: number): Promise<Ticket> {
    const response = await axios.put(
      `/api/tickets/${ticket.id}/state/${stateId}`,
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
  async updateTicketSchedule(
    ticket: Ticket,
    scheduleId: number,
  ): Promise<Ticket> {
    const response = await axios.put(
      `/api/tickets/${ticket.id}/schedule/${scheduleId}`,
      ticket,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Ticket;
  },
  async deleteTicketSchedule(ticket: Ticket): Promise<AxiosResponse> {
    const response = await axios.delete(`/api/tickets/${ticket.id}/schedule`);
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
  async getAllSchedules(): Promise<Schedule[]> {
    const response = await axios.get('/api/tickets/schedules');
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Schedule[];
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
  async createLabelType(labelType: LabelTypeDto): Promise<LabelType[]> {
    const response = await axios.post('/api/tickets/labelType', labelType);
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as LabelType[];
  },
  async updateLabelType(
    labelId: number,
    labelType: LabelTypeDto,
  ): Promise<LabelType[]> {
    const response = await axios.put(
      `/api/tickets/labelType/${labelId}`,
      labelType,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as LabelType[];
  },
  async deleteLabelType(labelId: number): Promise<AxiosResponse> {
    const response = await axios.delete(`/api/tickets/labelType/${labelId}`);
    if (response.status != 204) {
      this.handleErrors();
    }

    return response;
  },
  async getAllIterations(): Promise<Iteration[]> {
    const response = await axios.get('/api/tickets/iterations');
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Iteration[];
  },
  async createIteration(iteration: IterationDto): Promise<Iteration[]> {
    const response = await axios.post('/api/tickets/iterations', iteration);
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Iteration[];
  },
  async updateIteration(
    iterationId: number,
    iteration: IterationDto,
  ): Promise<Iteration[]> {
    const response = await axios.put(
      `/api/tickets/iterations/${iterationId}`,
      iteration,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Iteration[];
  },
  async deleteIteration(iterationId: number): Promise<AxiosResponse> {
    const response = await axios.delete(
      `/api/tickets/iterations/${iterationId}`,
    );
    if (response.status != 204) {
      this.handleErrors();
    }

    return response;
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
  async generateExport(iterationId: number): Promise<AxiosResponse> {
    const response = await axios.get(`/api/tickets/export/${iterationId}`, {
      responseType: 'blob',
    });

    const blob: Blob = new Blob([response.data], {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      type: response.headers['content-type'],
    });

    const actualFileName = getFileNameFromContentDisposition(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      response.headers['content-disposition'],
    );

    saveAs(blob, actualFileName);

    return response;
  },
  async getAllTicketFilters(): Promise<TicketFilter[]> {
    const response = await axios.get(`/api/tickets/ticketFilters`);
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as TicketFilter[];
  },
  async deleteTicketFilter(id: number): Promise<number> {
    const response = await axios.delete(`/api/tickets/ticketFilters/${id}`);
    if (response.status != 204) {
      this.handleErrors();
    }

    return response.status;
  },
  async createTicketFilter(
    ticketFilter: TicketFilterDto,
  ): Promise<TicketFilter> {
    const response = await axios.post(
      `/api/tickets/ticketFilters`,
      ticketFilter,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as TicketFilter;
  },
  async updateTicketFilter(
    id: number,
    ticketFilter: TicketFilter,
  ): Promise<TicketFilter> {
    const response = await axios.put(
      `/api/tickets/ticketFilters/${id}`,
      ticketFilter,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as TicketFilter;
  },
  async getUiSearchConfigurations(): Promise<UiSearchConfiguration[]> {
    const response = await axios.get(`/api/tickets/uiSearchConfigurations`);
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as UiSearchConfiguration[];
  },
  async createUiSearchConfiguration(
    uiSearchConfiguration: UiSearchConfigurationDto,
  ): Promise<UiSearchConfiguration> {
    const response = await axios.post(
      `/api/tickets/uiSearchConfigurations`,
      uiSearchConfiguration,
    );
    if (response.status != 201) {
      this.handleErrors();
    }

    return response.data as UiSearchConfiguration;
  },
  async updateUiSearchConfiguration(
    uiSearchConfiguration: UiSearchConfiguration[],
  ): Promise<UiSearchConfiguration> {
    const response = await axios.put(
      `/api/tickets/uiSearchConfigurations`,
      uiSearchConfiguration,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as UiSearchConfiguration;
  },
  async deleteUiSearchConfiguration(id: number): Promise<number> {
    const response = await axios.delete(
      `/api/tickets/uiSearchConfigurations/${id}`,
    );

    if (response.status != 204) {
      this.handleErrors();
    }

    return response.status;
  },
};

export default TicketsService;
