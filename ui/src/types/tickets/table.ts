import {
  DataTableFilterMetaData,
  DataTableOperatorFilterMetaData,
} from 'primereact/datatable';
import { JiraUser } from '../JiraUserResponse';
import {
  Iteration,
  LabelType,
  PriorityBucket,
  State,
  TaskAssocation,
  TypeValue,
} from './ticket';
import { Task } from '../task';

export interface TicketDataTableFilters {
  assignee?: AssigneeMetaData;
  title?: TitleMetaData;
  labels?: LabelOperatorMetaData;
  state?: StateMetaData;
  iteration?: IterationMetaData;
  schedule?: ScheduleMetaData;
  priorityBucket?: PriorityBucketMetaData;
  taskAssociation?: TaskAssociationMetaData;
  created?: CreatedMetaData;
  // Add more filter keys as needed
  [key: string]: any;
}

interface IterationMetaData extends DataTableFilterMetaData {
  value: Iteration;
}

interface StateMetaData extends DataTableFilterMetaData {
  value: State;
}

interface LabelOperatorMetaData extends DataTableOperatorFilterMetaData {
  constraints: LabelMetaData[];
}
interface LabelMetaData extends DataTableFilterMetaData {
  value: LabelType[];
}

interface AssigneeMetaData extends DataTableFilterMetaData {
  value: JiraUser[];
}

interface TitleMetaData extends DataTableFilterMetaData {
  value: string | null;
}

interface ScheduleMetaData extends DataTableFilterMetaData {
  value: TypeValue;
}

interface PriorityBucketMetaData extends DataTableFilterMetaData {
  value: PriorityBucket;
}

interface TaskAssociationMetaData extends DataTableFilterMetaData {
  value: Task;
}

interface CreatedMetaData extends DataTableFilterMetaData {
  value: Date[];
}
