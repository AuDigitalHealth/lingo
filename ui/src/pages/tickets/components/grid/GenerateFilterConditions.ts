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

import { FilterMatchMode } from 'primereact/api';
import { JiraUser } from '../../../../types/JiraUserResponse';
import { Task } from '../../../../types/task';
import {
  LazyTicketTableStateOrderConditions,
  TicketDataTableFilters,
  generateDefaultFilters,
} from '../../../../types/tickets/table';
import {
  ExternalRequestor,
  Iteration,
  LabelType,
  PriorityBucket,
  Schedule,
  State,
} from '../../../../types/tickets/ticket';
import {
  OrderCondition,
  SearchCondition,
  SearchConditionBody,
} from '../../../../types/tickets/search';

export const generateFilterConditions = (
  searchConditionBody: SearchConditionBody,
  priorityBuckets: PriorityBucket[],
  iterations: Iteration[],
  states: State[],
  labels: LabelType[],
  externalRequestors: ExternalRequestor[],
  tasks: Task[] | undefined,
  jiraUsers: JiraUser[],
  schedules: Schedule[],
): TicketDataTableFilters => {
  const baseFilter = generateDefaultFilters();

  searchConditionBody.searchConditions.forEach(condition => {
    switch (condition.key) {
      case 'ticketNumber':
        generateTicketNumber(baseFilter, condition);
        break;
      case 'title':
        generateTitle(baseFilter, condition);
        break;
      case 'assignee':
        generateAssignee(baseFilter, condition, jiraUsers);
        break;
      case 'labels.name':
        generateLabels(baseFilter, condition, labels);
        break;
      case 'externalRequestors.name':
        generateExternalRequestors(baseFilter, condition, externalRequestors);
        break;
      case 'state.label':
        generateStates(baseFilter, condition, states);
        break;
      case 'iteration.name':
        generateIterations(baseFilter, condition, iterations);
        break;
      case 'schedule.name':
        generateSchedule(baseFilter, condition, schedules);
        break;
      case 'priorityBucket.name':
        generatePriority(baseFilter, condition, priorityBuckets);
        break;
      case 'taskAssociation':
        generateTask(baseFilter, condition, tasks);
        break;
      case 'created':
        generateCreated(baseFilter, condition);
        break;
    }
  });

  return baseFilter;
};

const generatePriority = (
  filters: TicketDataTableFilters,
  searchCondition: SearchCondition,
  priorityBuckets: PriorityBucket[],
) => {
  if (searchCondition.valueIn?.length === 0) {
    return;
  }

  const values = searchCondition.valueIn
    ?.map(valueIn => {
      const bucket = priorityBuckets.find(priorityBucket => {
        return (
          priorityBucket.name === valueIn ||
          (priorityBucket.name === 'Unassigned' && valueIn === 'null')
        );
      });
      return bucket;
    })
    .filter((value): value is PriorityBucket => value !== undefined);

  if (filters.priorityBucket && values && values.length > 0) {
    filters.priorityBucket.value = values;
    filters.priorityBucket.matchMode = generateMatchMode(
      searchCondition.operation,
    );
  }
};

const generateAssignee = (
  filters: TicketDataTableFilters,
  searchCondition: SearchCondition,
  jiraUsers: JiraUser[],
) => {
  if (searchCondition.valueIn?.length === 0) {
    return;
  }

  const values = searchCondition.valueIn
    ?.map(valueIn => {
      const bucket = jiraUsers.find(jiraUser => {
        return (
          jiraUser.name === valueIn ||
          (jiraUser.name === 'Unassigned' && valueIn === 'null')
        );
      });
      return bucket;
    })
    .filter((value): value is JiraUser => value !== undefined);

  if (filters.assignee && values) {
    filters.assignee.value = values;
    filters.assignee.matchMode = generateMatchMode(searchCondition.operation);
  }
};

const generateTitle = (
  filters: TicketDataTableFilters,
  searchCondition: SearchCondition,
) => {
  if (searchCondition.value && filters.title) {
    filters.title.value = searchCondition.value;
  }
};

const generateTicketNumber = (
  filters: TicketDataTableFilters,
  searchCondition: SearchCondition,
) => {
  if (searchCondition.value && filters.ticketNumber) {
    filters.ticketNumber.value = searchCondition.value;
  }
};

const generateLabels = (
  filters: TicketDataTableFilters,
  searchCondition: SearchCondition,
  labels: LabelType[],
) => {
  if (searchCondition.valueIn?.length === 0) {
    return;
  }

  const values = searchCondition.valueIn
    ?.map(valueIn => {
      const label = labels.find(label => {
        return (
          label.name === valueIn ||
          (label.name === 'Unassigned' && valueIn === 'null')
        );
      });
      return label;
    })
    .filter((value): value is LabelType => value !== undefined);

  if (filters.labels && values) {
    filters.labels.operator = searchCondition.condition;
    filters.labels.constraints[0].value.push(...values);
    filters.labels.constraints[0].matchMode = generateMatchMode(
      searchCondition.operation,
    );
  }
};

const generateExternalRequestors = (
  filters: TicketDataTableFilters,
  searchCondition: SearchCondition,
  externalRequestors: ExternalRequestor[],
) => {
  if (searchCondition.valueIn?.length === 0) {
    return;
  }

  const values = searchCondition.valueIn
    ?.map(valueIn => {
      const externalRequestor = externalRequestors.find(label => {
        return (
          label.name === valueIn ||
          (label.name === 'Unassigned' && valueIn === 'null')
        );
      });
      return externalRequestor;
    })
    .filter((value): value is ExternalRequestor => value !== undefined);

  if (filters.externalRequestors && values) {
    filters.externalRequestors.operator = searchCondition.condition;
    filters.externalRequestors.constraints[0].value.push(...values);
    filters.externalRequestors.constraints[0].matchMode = generateMatchMode(
      searchCondition.operation,
    );
  }
};

const generateSchedule = (
  filters: TicketDataTableFilters,
  searchCondition: SearchCondition,
  schedules: Schedule[],
) => {
  if (searchCondition.valueIn?.length === 0) {
    return;
  }

  const values = searchCondition.valueIn
    ?.map(valueIn => {
      const schedule = schedules.find(schedule => {
        return (
          schedule.name === valueIn ||
          (schedule.name === 'Unassigned' && valueIn === 'null')
        );
      });
      return schedule;
    })
    .filter((value): value is Schedule => value !== undefined);

  if (filters.schedule && values && values.length > 0) {
    filters.schedule.value = values;
  }

  if (filters.schedule && values) {
    filters.schedule.value = values;
    filters.schedule.matchMode = generateMatchMode(searchCondition.operation);
  }
};

const generateStates = (
  filters: TicketDataTableFilters,
  searchCondition: SearchCondition,
  states: State[],
) => {
  if (searchCondition.valueIn?.length === 0) {
    return;
  }

  const values = searchCondition.valueIn
    ?.map(valueIn => {
      const state = states.find(state => {
        return (
          state.label === valueIn ||
          (state.label === 'Unassigned' && valueIn === 'null')
        );
      });
      return state;
    })
    .filter((value): value is State => value !== undefined);

  if (filters.state && values) {
    filters.state.value = values;
    filters.state.matchMode = generateMatchMode(searchCondition.operation);
  }
};

const generateIterations = (
  filters: TicketDataTableFilters,
  searchCondition: SearchCondition,
  iterations: Iteration[],
) => {
  if (searchCondition.valueIn?.length === 0) {
    return;
  }

  const values = searchCondition.valueIn
    ?.map(valueIn => {
      const iteration = iterations.find(iteration => {
        return (
          iteration.name === valueIn ||
          (iteration.name === 'Unassigned' && valueIn === 'null')
        );
      });
      return iteration;
    })
    .filter((value): value is Iteration => value !== undefined);

  if (filters.iteration && values) {
    filters.iteration.value = values;
    filters.iteration.matchMode = generateMatchMode(searchCondition.operation);
  }
};

const generateTask = (
  filters: TicketDataTableFilters,
  searchCondition: SearchCondition,
  tasks: Task[] | undefined,
) => {
  if (searchCondition.valueIn?.length === 0) {
    return;
  }

  const searchValue = searchCondition.value;

  const task = tasks?.find(task => {
    return (
      task.key === searchValue ||
      (task.key === 'Unassigned' && searchValue === 'null')
    );
  });
  if (filters.taskAssociation && task) {
    filters.taskAssociation.value = task;
    filters.taskAssociation.matchMode = generateMatchMode(
      searchCondition.operation,
    );
  }
};

const generateCreated = (
  filters: TicketDataTableFilters,
  searchCondition: SearchCondition,
) => {
  if (!searchCondition.value) {
    return;
  }
  const searchValue = searchCondition.value;
  const { day, month, year } = createDayMonthYear(searchValue);
  const date = new Date(year, month, day);

  if (filters.created) {
    filters.created.value = date;
    // filters.created.value.push(date);
    // filters.created.value.push(null);
    if (searchCondition.operation === '!=') {
      filters.created.matchMode = FilterMatchMode.DATE_IS_NOT;
    } else if (searchCondition.operation === '<=') {
      filters.created.matchMode = FilterMatchMode.DATE_BEFORE;
    } else if (searchCondition.operation === '>=') {
      filters.created.matchMode = FilterMatchMode.DATE_AFTER;
    }
  }
};
// takes in format of dd/mm/yyyy
const createDayMonthYear = (val: string) => {
  const components = val.split('/');

  const day = parseInt(components[0], 10);
  const month = parseInt(components[1], 10) - 1;
  const year = parseInt(components[2], 10) + 2000;

  return { day, month, year };
};

const generateMatchMode = (matchMode: string) => {
  if (matchMode === '=') return FilterMatchMode.EQUALS;
  if (matchMode === '!=') return FilterMatchMode.NOT_EQUALS;
  return FilterMatchMode.EQUALS;
};

export const generateOrderConditions = (
  orderCondition: OrderCondition | undefined,
): LazyTicketTableStateOrderConditions => {
  if (!orderCondition) return {};

  const returnObj = {
    sortField: reverseMappedFields[orderCondition.fieldName],
    sortOrder: orderCondition.order,
  };

  return returnObj;
};

type MappedFields = {
  [key: string]: string;
};

const reverseMappedFields: MappedFields = {
  title: 'title',
  'taskAssociation.taskId': 'taskAssociation',
  assignee: 'assignee',
  created: 'created',
  'priorityBucket.name': 'priorityBucket',
  'iteration.name': 'iteration',
  'state.label': 'state',
  'schedule.grouping': 'schedule',
};
