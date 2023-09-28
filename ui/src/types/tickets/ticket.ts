import { Embedded, PagedItem } from '../pagesResponse';
import { ValidationColor } from '../validationColor';

export interface Ticket extends VersionedEntity {
  title: string;
  description: string;
  ticketType?: TicketType;
  state: State;
  labels: LabelType[];
  assignee: string;
  iteration: Iteration;
  priorityBucket?: PriorityBucket;
  comments?: Comment[];
  attachments?: Attachment[];
  'ticket-additional-fields': AdditionalFieldValue[];
}

export interface PagedTicket extends PagedItem {
  _embedded: EmbeddedTicketDto;
}

interface EmbeddedTicketDto extends Embedded {
  ticketDtoList: Ticket[];
}

export interface PagedTicket extends PagedItem {
  _embedded: EmbeddedTicketDto;
}

interface EmbeddedTicketDto extends Embedded {
  ticketDtoList: Ticket[];
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

export interface Label extends VersionedEntity {
  labelType?: LabelType;
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
  listType: boolean;
}

export interface TypeValue {
  ids: string;
  value: string;
}

export interface Comment extends VersionedEntity {
  text: string;
}

export interface Attachment extends VersionedEntity {
  description: string;
  data: string;
  length: number;
  sha256: string;
}

export interface Comment extends VersionedEntity {
  text: string;
}

export interface Attachment extends VersionedEntity {
  description: string;
  data: string;
  length: number;
  sha256: string;
}
