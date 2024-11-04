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
  AdditionalFieldType,
  AdditionalFieldTypeOfListType,
  AdditionalFieldValue,
  BulkAddExternalRequestorRequest,
  BulkAddExternalRequestorResponse,
  Comment,
  ExternalRequestor,
  ExternalRequestorDto,
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
  TicketDtoMinimal,
  TicketFilter,
  TicketFilterDto,
  UiSearchConfiguration,
  UiSearchConfigurationDto,
} from '../types/tickets/ticket';
import { getFileNameFromContentDisposition } from '../utils/helpers/fileUtils';
import { saveAs } from 'file-saver';
import { SearchConditionBody } from '../types/tickets/search';
import { api } from './api';

const TicketsService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid ticket response');
  },

  async getIndividualTicket(id: number): Promise<Ticket> {
    const response = await api.get(`/api/tickets/${id}`);
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as Ticket;
  },
  async getIndividualTicketByTicketNumber(
    ticketNumber: string,
  ): Promise<Ticket> {
    const response = await api.get(`/api/tickets/ticketNumber/${ticketNumber}`);
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as Ticket;
  },
  async createTicket(ticket: TicketDtoMinimal): Promise<Ticket> {
    const response = await api.post(`/api/tickets`, ticket);
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as Ticket;
  },
  async deleteTicket(id: number): Promise<undefined> {
    const response = await api.delete(`/api/tickets/${id}`);
    if (response.status != 204) {
      this.handleErrors();
    }
    return undefined;
  },

  async bulkCreateTicket(tickets: Ticket[]): Promise<Ticket[]> {
    const response = await api.put(`/api/tickets/bulk`, tickets);
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as Ticket[];
  },

  async getPaginatedTickets(page: number, size: number): Promise<PagedTicket> {
    const pageAndSize = `page=${page}&size=${size}`;
    const response = await api.get('/api/tickets?' + pageAndSize);
    if (response.status != 200) {
      this.handleErrors();
    }
    const pagedResponse = response.data as PagedTicket;
    return pagedResponse;
  },
  async getTaskAssociations(): Promise<TaskAssocation[]> {
    const response = await api.get('/api/tickets/taskAssociations');
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as TaskAssocation[];
  },
  async createTaskAssociation(
    ticketId: number,
    taskId: string,
  ): Promise<TaskAssocation> {
    const response = await api.post(
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
  ): Promise<TicketAssociation> {
    const response = await api.post(
      `/api/tickets/ticketAssociation/sourceTicket/${sourceId}/targetTicket/${targetId}`,
    );

    if (response.status != 201) {
      this.handleErrors();
    }

    return response.data as TicketAssociation;
  },
  async deleteTicketAssociation(id: number): Promise<number> {
    const response = await api.delete(`/api/tickets/ticketAssociation/${id}`);

    if (response.status != 204) {
      this.handleErrors();
    }

    return response.status;
  },
  async deleteTaskAssociation(
    ticketId: number,
    taskAssociationId: number,
  ): Promise<number> {
    const response = await api.delete(
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
    const response = await api.get('/api/tickets/search' + queryPageAndSize);
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

    const response = await api.post(
      '/api/tickets/search' + queryPageAndSize,
      searchConditionBody ? searchConditionBody : {},
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const pagedResponse = response.data as PagedTicket;
    return pagedResponse;
  },
  async updateTicketState(ticket: Ticket, stateId: number): Promise<State> {
    const response = await api.put(
      `/api/tickets/${ticket.id}/state/${stateId}`,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as State;
  },
  async deleteTicketState(ticket: Ticket): Promise<AxiosResponse> {
    const response = await api.delete(`/api/tickets/${ticket.id}/state`);
    if (response.status != 204) {
      this.handleErrors();
    }

    return response;
  },
  async updateTicketSchedule(
    ticket: Ticket,
    scheduleId: number,
  ): Promise<Ticket> {
    const response = await api.put(
      `/api/tickets/${ticket.id}/schedule/${scheduleId}`,
      ticket,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Ticket;
  },
  async deleteTicketSchedule(ticket: Ticket): Promise<AxiosResponse> {
    const response = await api.delete(`/api/tickets/${ticket.id}/schedule`);
    if (response.status != 204) {
      this.handleErrors();
    }

    return response;
  },
  async updateTicket(ticket: Ticket): Promise<Ticket> {
    const response = await api.put(`/api/tickets/${ticket.id}`, ticket);
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Ticket;
  },
  async patchTicket(ticket: Ticket): Promise<Ticket> {
    const response = await api.patch(`/api/tickets/${ticket.id}`, ticket);
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Ticket;
  },
  async updateTicketIteration(
    ticketId: number,
    iterationId: number,
  ): Promise<Ticket> {
    const response = await api.put(
      `/api/tickets/${ticketId}/iteration/${iterationId}`,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Ticket;
  },
  async deleteTicketIteration(ticket: Ticket): Promise<AxiosResponse> {
    const response = await api.delete(`/api/tickets/${ticket.id}/iteration`);
    if (response.status != 204) {
      this.handleErrors();
    }

    return response;
  },
  async updateTicketPriority(ticket: Ticket): Promise<Ticket> {
    const response = await api.put(
      `/api/tickets/${ticket.id}/priorityBuckets/${ticket.priorityBucket?.id}`,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Ticket;
  },
  async deleteTicketPriority(ticket: Ticket): Promise<AxiosResponse> {
    const response = await api.delete(
      `/api/tickets/${ticket.id}/priorityBuckets`,
    );
    if (response.status != 204) {
      this.handleErrors();
    }

    return response;
  },
  async addTicketLabel(id: string, labelId: number) {
    const response = await api.post(`/api/tickets/${id}/labels/${labelId}`);
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as LabelType;
  },

  async addTicketExternalRequestor(id: string, externalRequestorId: number) {
    const response = await api.post(
      `/api/tickets/${id}/externalRequestors/${externalRequestorId}`,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as ExternalRequestor;
  },
  async bulkCreateExternalRequestors(
    bulkAddExternalRequestorRequest: BulkAddExternalRequestorRequest,
  ): Promise<BulkAddExternalRequestorResponse> {
    const response = await api.post(
      `/api/tickets/bulkAddExternalRequestors`,
      bulkAddExternalRequestorRequest,
    );
    if (response.status != 201) {
      this.handleErrors();
    }
    const result = response.data as BulkAddExternalRequestorResponse;
    return result;
  },
  async addTicketComment(ticketId: number, content: string): Promise<Comment> {
    const response = await api.post(`/api/tickets/${ticketId}/comments`, {
      text: content,
    });
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Comment;
  },
  async editTicketComment(
    ticketId: number,
    comment: Comment,
  ): Promise<Comment> {
    const response = await api.patch(
      `/api/tickets/${ticketId}/comments/${comment.id}`,
      comment,
    );

    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Comment;
  },
  async deleteTicketComment(commentId: number, ticketId: number) {
    const response = await api.delete(
      `/api/tickets/${ticketId}/comments/${commentId}`,
    );
    if (response.status != 204) {
      this.handleErrors();
    }
    return response;
  },
  async deleteTicketLabel(id: string, labelId: number) {
    const response = await api.delete(`/api/tickets/${id}/labels/${labelId}`);
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as LabelType;
  },
  async deleteTicketExternalRequestor(id: string, externalRequestorId: number) {
    const response = await api.delete(
      `/api/tickets/${id}/externalRequestors/${externalRequestorId}`,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as ExternalRequestor;
  },
  async updateAdditionalFieldValue(
    ticketId: number | undefined,
    additionalFieldType: AdditionalFieldType,
    valueOf: string | undefined,
  ): Promise<AdditionalFieldValue> {
    const response = await api.post(
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
    const response = await api.delete(
      `/api/tickets/${ticketId}/additionalFieldValue/${additionalFieldType.id}`,
    );
    if (response.status != 204) {
      this.handleErrors();
    }

    return response;
  },
  async getAllStates(): Promise<State[]> {
    const response = await api.get('/api/tickets/state');
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as State[];
  },
  async getAllSchedules(): Promise<Schedule[]> {
    const response = await api.get('/api/tickets/schedules');
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Schedule[];
  },
  async getAllPriorityBuckets(): Promise<PriorityBucket[]> {
    const response = await api.get('/api/tickets/priorityBuckets');
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as PriorityBucket[];
  },
  async getAllLabelTypes(): Promise<LabelType[]> {
    const response = await api.get('/api/tickets/labelType');
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as LabelType[];
  },

  async getAllExternalRequestors(): Promise<ExternalRequestor[]> {
    const response = await api.get('/api/tickets/externalRequestors');
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as ExternalRequestor[];
  },

  async createExternalRequestor(
    externalRequestorDto: ExternalRequestorDto,
  ): Promise<ExternalRequestor[]> {
    const response = await api.post(
      '/api/tickets/externalRequestors',
      externalRequestorDto,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as ExternalRequestor[];
  },
  async updateExternalRequestor(
    id: number,
    externalRequestorDto: ExternalRequestorDto,
  ): Promise<ExternalRequestor[]> {
    const response = await api.put(
      `/api/tickets/externalRequestors/${id}`,
      externalRequestorDto,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as ExternalRequestor[];
  },
  async deleteExternalRequestor(id: number): Promise<AxiosResponse> {
    const response = await api.delete(`/api/tickets/externalRequestors/${id}`);
    if (response.status != 204) {
      this.handleErrors();
    }

    return response;
  },

  async createLabelType(labelType: LabelTypeDto): Promise<LabelType[]> {
    const response = await api.post('/api/tickets/labelType', labelType);
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as LabelType[];
  },
  async updateLabelType(
    labelId: number,
    labelType: LabelTypeDto,
  ): Promise<LabelType[]> {
    const response = await api.put(
      `/api/tickets/labelType/${labelId}`,
      labelType,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as LabelType[];
  },
  async deleteLabelType(labelId: number): Promise<AxiosResponse> {
    const response = await api.delete(`/api/tickets/labelType/${labelId}`);
    if (response.status != 204) {
      this.handleErrors();
    }

    return response;
  },
  async getAllIterations(): Promise<Iteration[]> {
    const response = await api.get('/api/tickets/iterations');
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Iteration[];
  },
  async createIteration(iteration: IterationDto): Promise<Iteration[]> {
    const response = await api.post('/api/tickets/iterations', iteration);
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Iteration[];
  },
  async updateIteration(
    iterationId: number,
    iteration: IterationDto,
  ): Promise<Iteration[]> {
    const response = await api.put(
      `/api/tickets/iterations/${iterationId}`,
      iteration,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as Iteration[];
  },
  async deleteIteration(iterationId: number): Promise<AxiosResponse> {
    const response = await api.delete(`/api/tickets/iterations/${iterationId}`);
    if (response.status != 204) {
      this.handleErrors();
    }

    return response;
  },
  async getAllAdditionalFieldTypes(): Promise<AdditionalFieldType[]> {
    const response = await api.get('/api/tickets/additionalFieldTypes');
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as AdditionalFieldType[];
  },
  async getAllAdditionalFieldTypessWithValues(): Promise<
    AdditionalFieldTypeOfListType[]
  > {
    const response = await api.get('/api/additionalFieldValuesForListType');
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as AdditionalFieldTypeOfListType[];
  },
  async generateExport(iterationId: number): Promise<AxiosResponse> {
    const response = await api.get(`/api/tickets/export/${iterationId}`, {
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
    const response = await api.get(`/api/tickets/ticketFilters`);
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as TicketFilter[];
  },
  async deleteTicketFilter(id: number): Promise<number> {
    const response = await api.delete(`/api/tickets/ticketFilters/${id}`);
    if (response.status != 204) {
      this.handleErrors();
    }

    return response.status;
  },
  async createTicketFilter(
    ticketFilter: TicketFilterDto,
  ): Promise<TicketFilter> {
    const response = await api.post(`/api/tickets/ticketFilters`, ticketFilter);
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as TicketFilter;
  },
  async updateTicketFilter(
    id: number,
    ticketFilter: TicketFilter,
  ): Promise<TicketFilter> {
    const response = await api.put(
      `/api/tickets/ticketFilters/${id}`,
      ticketFilter,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as TicketFilter;
  },
  async getUiSearchConfigurations(): Promise<UiSearchConfiguration[]> {
    const response = await api.get(`/api/tickets/uiSearchConfigurations`);
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as UiSearchConfiguration[];
  },
  async createUiSearchConfiguration(
    uiSearchConfiguration: UiSearchConfigurationDto,
  ): Promise<UiSearchConfiguration> {
    const response = await api.post(
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
    const response = await api.put(
      `/api/tickets/uiSearchConfigurations`,
      uiSearchConfiguration,
    );
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as UiSearchConfiguration;
  },
  async deleteUiSearchConfiguration(id: number): Promise<number> {
    const response = await api.delete(
      `/api/tickets/uiSearchConfigurations/${id}`,
    );

    if (response.status != 204) {
      this.handleErrors();
    }

    return response.status;
  },
};

export default TicketsService;
