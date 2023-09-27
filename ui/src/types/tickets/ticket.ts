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
  additionalFieldTypeValues?: AdditionalFieldTypeValue[];
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
export interface AdditionalFieldTypeValue extends VersionedEntity {
  valueOf: string;
  grouping: number;
}

export interface AdditionalFieldType extends VersionedEntity {
  name: string;
  description: string;
  additionalFieldTypeValues: AdditionalFieldTypeValue[];
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

export interface TaskAssocation extends VersionedEntity {
  ticketId: number;
  taskId: string;
}
