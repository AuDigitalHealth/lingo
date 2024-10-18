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

import { Embedded, PagedItem } from '../pagesResponse';
import {
  BrandPackSizeCreationDetails,
  DevicePackageDetails,
  MedicationPackageDetails,
} from '../product.ts';
import { SearchConditionBody } from './search.ts';
import { ColorCode } from '../ColorCode.ts';

export interface TicketDtoMinimal {
  title: string;
}
export interface TicketDto extends VersionedEntity {
  id: number;
  title: string;
  ticketNumber: string;
  description: string;
  ticketType?: TicketType;
  state: State | null;
  labels: LabelType[];
  externalRequestors: ExternalRequestor[];
  assignee: string | null;
  iteration: Iteration | null;
  schedule: Schedule | null;
  priorityBucket?: PriorityBucket | null;
  comments?: Comment[];
  attachments?: Attachment[];
  'ticket-additional-fields'?: AdditionalFieldValue[];
}

export interface Ticket extends VersionedEntity {
  id: number;
  title: string;
  ticketNumber: string;
  description: string;
  ticketType?: TicketType;
  state: State | null;
  schedule: Schedule | null;
  labels: LabelType[];
  externalRequestors: ExternalRequestor[];
  assignee: string | null;
  iteration: Iteration | null;
  priorityBucket?: PriorityBucket | null;
  ticketSourceAssociations?: TicketAssociation[];
  ticketTargetAssociations?: TicketAssociation[];
  comments?: Comment[];
  attachments?: Attachment[];
  'ticket-additional-fields'?: AdditionalFieldValue[];
  taskAssociation?: TaskAssocationDto | null;
  products?: TicketProductDto[];
  bulkProductActions?: TicketBulkProductActionDto[];
}

export interface PagedTicket extends PagedItem {
  _embedded?: EmbeddedTicketDto;
}

interface EmbeddedTicketDto extends Embedded {
  ticketBacklogDtoList?: TicketDto[];
}

export type Id = number;
export interface BaseEntity {
  id: Id;
  created: string;
  createdBy: string;
}
interface VersionedEntity extends BaseEntity {
  version?: number;
  modified?: string;
  modifiedBy?: string;
}
export interface TicketType extends VersionedEntity {
  name: string;
  description: string;
}

export interface State extends VersionedEntity {
  label: string;
  description: string;
}

export interface Schedule extends VersionedEntity {
  name: string;
  description: string;
  grouping: number;
}

export interface PriorityBucket extends VersionedEntity {
  name: string;
  description: string;
  orderIndex: number;
}

export interface TicketAssociation extends VersionedEntity {
  associationSource: TinyTicket;
  associationTarget: TinyTicket;
}

export interface TicketAssociationDto {
  associationSource?: number;
  associationTarget?: number;
  description: string;
}

export interface TinyTicket {
  id: number;
  title: string;
  ticketNumber: string;
  description: string;
  assignee: string | null;
  state: State | null;
}

export interface LabelType extends VersionedEntity {
  name: string;
  description: string;
  displayColor?: ColorCode;
}

export interface ExternalRequestor extends VersionedEntity {
  name: string;
  description: string;
  displayColor?: ColorCode;
}

export interface BulkAddExternalRequestorRequest {
  additionalFieldTypeName: string;
  fieldValues: string[];
  externalRequestors: string[];
}

export interface BulkAddExternalRequestorResponse {
  updatedTickets: Ticket[];
  createdTickets: Ticket[];
  skippedAdditionalFieldValues: string[];
}

export interface LabelTypeDto {
  name: string;
  description: string;
  displayColor?: ColorCode;
  id?: number;
}
export interface ExternalRequestorDto {
  name: string;
  description: string;
  displayColor?: ColorCode;
  id?: number;
}
export interface ExternalRequestorBasic {
  id?: string;
  externalRequestorId?: string;
  externalRequestorName?: string;
}

export interface LabelBasic {
  id?: string;
  labelTypeId?: string;
  labelTypeName?: string;
}

export interface Iteration extends VersionedEntity {
  name: string;
  startDate: string;
  endDate?: string;
  active: boolean;
  completed: boolean;
}

export interface IterationDto {
  name: string;
  startDate: string;
  endDate?: string | null;
  active?: boolean;
  completed?: boolean;
  id?: number;
}
export interface AdditionalFieldValueDto extends VersionedEntity {
  type: string;
  value: string;
}

export interface AdditionalFieldValue extends VersionedEntity {
  additionalFieldType: AdditionalFieldType;
  valueOf: string;
}

export interface AdditionalFieldValueUnversioned {
  additionalFieldType: AdditionalFieldType;
  valueOf: string;
}

export interface AdditionalFieldTypeOfListType {
  typeId: number;
  typeName: string;
  values: AdditionalFieldValue[];
}

export interface AdditionalFieldType extends VersionedEntity {
  name: string;
  description: string;
  type: AdditionalFieldTypeEnum;
  display: boolean;
}

export enum AdditionalFieldTypeEnum {
  DATE = 'DATE',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  LIST = 'LIST',
}

export interface Comment extends VersionedEntity {
  jiraCreated: string;
  text: string;
}

export interface Attachment extends VersionedEntity {
  jiraCreated: string;
  description: string;
  filename: string;
  location: string;
  thumbnailLocation: string;
  length: number;
  sha256: string;
}

export interface Comment extends VersionedEntity {
  text: string;
}

export interface TaskAssocation extends VersionedEntity {
  ticketId: number;
  ticketNumber: string;
  taskId: string;
  id: number;
}

export interface TaskAssocationDto {
  ticketId: number;
  taskId: string;
  id?: number;
}

export interface TicketProductDto {
  id?: number;
  ticketId: number;
  version: number | null;
  created?: Date;
  modified?: Date;
  createdBy?: string;
  modifiedBy?: string;
  name: string;
  conceptId: string | null;
  packageDetails: MedicationPackageDetails | DevicePackageDetails;
}

export interface TicketBulkProductActionDto {
  id?: number;
  ticketId: number;
  name: string;
  conceptIds: string[];
  details: BrandPackSizeCreationDetails;
}

export interface AutocompleteGroupOption {
  name: string;
  group: AutocompleteGroupOptionType;
}
export enum AutocompleteGroupOptionType {
  New = 'New',
  Existing = 'Existing',
}

export interface TicketFilter extends BaseEntity {
  name: string;
  filter: SearchConditionBody;
}

export interface TicketFilterDto {
  name: string;
  filter: SearchConditionBody;
}

export interface UiSearchConfiguration extends VersionedEntity {
  username: string;
  name: string;
  filter: TicketFilter;
  grouping: number;
}

export interface UiSearchConfigurationDto {
  username?: string;
  name: string;
  filter: TicketFilter;
  grouping: number;
}
