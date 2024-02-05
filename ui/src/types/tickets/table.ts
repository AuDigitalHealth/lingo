import {
  DataTableFilterMetaData,
  DataTableOperatorFilterMetaData,
} from 'primereact/datatable';
import { JiraUser } from '../JiraUserResponse';
import {
  AdditionalFieldValue,
  Iteration,
  LabelType,
  PriorityBucket,
  State,
} from './ticket';
import { Task } from '../task';
import { FilterMatchMode, FilterOperator } from 'primereact/api';

export interface LazyTicketTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string;
  sortOrder?: 0 | 1 | -1 | null | undefined;
  filters: TicketDataTableFilters;
}

export interface LazyTicketTableStateOrderConditions {
  sortField?: string;
  sortOrder?: 0 | 1 | -1 | null | undefined;
}

export const generateDefaultFilters = () => {
  const defaultTicketTableFilters: TicketDataTableFilters = {
    priorityBucket: { value: [], matchMode: FilterMatchMode.EQUALS },
    title: { value: null, matchMode: FilterMatchMode.CONTAINS },
    schedule: { value: [], matchMode: FilterMatchMode.EQUALS },
    iteration: { value: [], matchMode: FilterMatchMode.EQUALS },
    state: { value: [], matchMode: FilterMatchMode.EQUALS },
    labels: {
      operator: FilterOperator.OR,
      constraints: [{ value: [], matchMode: FilterMatchMode.IN }],
    },
    taskAssociation: { value: null, matchMode: FilterMatchMode.EQUALS },
    assignee: { value: [], matchMode: FilterMatchMode.EQUALS },
    created: {
      value: null,
      matchMode: FilterMatchMode.DATE_IS,
    },
  };

  return defaultTicketTableFilters;
};

export const generateDefaultTicketTableLazyState = () => {
  const defaultTicketTableLazyState: LazyTicketTableState = {
    first: 0,
    rows: 20,
    page: 0,
    sortField: '',
    sortOrder: 0,
    filters: generateDefaultFilters(),
  };

  return defaultTicketTableLazyState;
};
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
  // eslint-disable-next-line
  [key: string]: any;
}

interface IterationMetaData extends DataTableFilterMetaData {
  value: Iteration[];
}

interface StateMetaData extends DataTableFilterMetaData {
  value: State[];
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
  value: AdditionalFieldValue[];
}

interface PriorityBucketMetaData extends DataTableFilterMetaData {
  value: PriorityBucket[];
}

interface TaskAssociationMetaData extends DataTableFilterMetaData {
  value: Task | null;
}

interface CreatedMetaData extends DataTableFilterMetaData {
  value: Date | Date[] | null;
}

export function hasFiltersChanged(filters: TicketDataTableFilters): boolean {
  for (const key in filters) {
    // eslint-disable-next-line
    if (filters.hasOwnProperty(key)) {
      if (key === 'labels') {
        const defaultLabels = generateDefaultFilters().labels;
        const currentLabels = filters.labels;
        if (defaultLabels?.operator !== currentLabels?.operator) {
          return true;
        }
        if (
          JSON.stringify(defaultLabels?.constraints) !==
          JSON.stringify(currentLabels?.constraints)
        ) {
          return true;
        }
      } else {
        // eslint-disable-next-line
        const defaultValue =
          // eslint-disable-next-line
          generateDefaultFilters()[key as keyof TicketDataTableFilters].value;
        // eslint-disable-next-line
        const currentValue = filters[key as keyof TicketDataTableFilters].value;

        if (JSON.stringify(defaultValue) !== JSON.stringify(currentValue)) {
          return true;
        }
      }
    }
  }
  return false;
}

export function hasSortChanged(
  sortField: string | undefined,
  sortOrder: 1 | 0 | -1 | undefined | null,
) {
  const defaultLazyState = generateDefaultTicketTableLazyState();
  if (sortField !== defaultLazyState.sortField) return true;
  if (sortOrder !== defaultLazyState.sortOrder) return true;
  return false;
}
