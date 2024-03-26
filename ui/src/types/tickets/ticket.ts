import { Embedded, PagedItem } from '../pagesResponse';
import { DevicePackageDetails, MedicationPackageDetails } from '../product.ts';
import { SearchConditionBody } from './search.ts';
import { ColorCode } from '../ColorCode.ts';

export interface TicketDtoMinimal {
  title: string;
}
export interface TicketDto extends VersionedEntity {
  id: number;
  title: string;
  description: string;
  ticketType?: TicketType;
  state: State | null;
  labels: LabelType[];
  assignee: string;
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
  description: string;
  ticketType?: TicketType;
  state: State | null;
  schedule: Schedule | null;
  labels: LabelType[];
  assignee: string;
  iteration: Iteration | null;
  priorityBucket?: PriorityBucket | null;
  ticketSourceAssociations?: TicketAssociation[];
  ticketTargetAssociations?: TicketAssociation[];
  comments?: Comment[];
  attachments?: Attachment[];
  'ticket-additional-fields'?: AdditionalFieldValue[];
  taskAssociation?: TaskAssocation | null;
  products?: TicketProductDto[];
}

export interface PagedTicket extends PagedItem {
  _embedded?: EmbeddedTicketDto;
}

interface EmbeddedTicketDto extends Embedded {
  ticketDtoList?: TicketDto[];
}

export type Id = number;
interface BaseEntity {
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
  description: string;
  assignee: string | null;
}

export interface LabelType extends VersionedEntity {
  name: string;
  description: string;
  displayColor?: ColorCode;
}
export interface LabelTypeDto {
  name: string;
  description: string;
  displayColor?: ColorCode;
  id?: number;
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
  taskId: string;
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
