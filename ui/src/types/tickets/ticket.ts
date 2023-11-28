import { Embedded, PagedItem } from '../pagesResponse';
import { ValidationColor } from '../validationColor';
import { DevicePackageDetails, MedicationPackageDetails } from '../product.ts';

export interface TicketDto extends VersionedEntity {
  id: number;
  title: string;
  description: string;
  ticketType?: TicketType;
  state: State | null;
  labels: LabelType[];
  assignee: string;
  iteration: Iteration | null;
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
  labels: LabelType[];
  assignee: string;
  iteration: Iteration | null;
  priorityBucket?: PriorityBucket | null;
  comments?: Comment[];
  attachments?: Attachment[];
  'ticket-additional-fields'?: AdditionalFieldValue[];
  taskAssociation?: TaskAssocation | null;
  products?: TicketProductDto[];
}

export interface PagedTicket extends PagedItem {
  _embedded: EmbeddedTicketDto;
}

interface EmbeddedTicketDto extends Embedded {
  ticketDtoList?: TicketDto[];
}

export interface PagedTicket extends PagedItem {
  _embedded: EmbeddedTicketDto;
}

interface BaseEntity {
  id: number;
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

export interface PriorityBucket extends VersionedEntity {
  name: string;
  description: string;
  orderIndex: number;
}

export interface LabelType extends VersionedEntity {
  name: string;
  description: string;
  displayColor?: ValidationColor;
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
  values: TypeValue[];
}

export interface AdditionalFieldType extends VersionedEntity {
  name: string;
  description: string;
  type: AdditionalFieldTypeEnum;
}

export enum AdditionalFieldTypeEnum {
  DATE = 'DATE',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  LIST = 'LIST',
}

export interface TypeValue {
  ids: string;
  valueOf: string;
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
  id: number;
  ticketId: number;
  version: number;
  created: Date;
  modified: Date;
  createdBy: string;
  modifiedBy: string;
  name: string;
  conceptId: string;
  packageDetails: MedicationPackageDetails | DevicePackageDetails;
}
