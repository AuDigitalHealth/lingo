export interface Ticket extends VersionedEntity {
  title: string;
  description: string;
  ticketType: TicketType;
  state: State;
  labels: Label[];
  assignee: string;
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

export interface Label extends VersionedEntity {
  labelType?: LabelType;
}

export interface LabelType extends VersionedEntity {
  name: string;
  description: string;
}
