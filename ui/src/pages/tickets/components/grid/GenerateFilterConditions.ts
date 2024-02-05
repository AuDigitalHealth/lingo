import { FilterMatchMode } from 'primereact/api';
import { JiraUser } from '../../../../types/JiraUserResponse';
import { Task } from '../../../../types/task';
import {
  LazyTicketTableStateOrderConditions,
  TicketDataTableFilters,
  generateDefaultFilters,
} from '../../../../types/tickets/table';
import {
  AdditionalFieldTypeOfListType,
  AdditionalFieldValue,
  Iteration,
  LabelType,
  PriorityBucket,
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
  tasks: Task[],
  jiraUsers: JiraUser[],
  schedules: AdditionalFieldTypeOfListType[],
): TicketDataTableFilters => {
  const baseFilter = generateDefaultFilters();
  console.log(searchConditionBody.searchConditions);
  searchConditionBody.searchConditions.forEach(condition => {
    switch (condition.key) {
      case 'title':
        generateTitle(baseFilter, condition);
        break;
      case 'assignee':
        generateAssignee(baseFilter, condition, jiraUsers);
        break;
      case 'labels.name':
        generateLabels(baseFilter, condition, labels);
        break;
      case 'state.label':
        generateStates(baseFilter, condition, states);
        break;
      case 'iteration.name':
        generateIterations(baseFilter, condition, iterations);
        break;
      case 'additionalFieldValues.valueOf':
        generateSchedule(baseFilter, condition, schedules);
        break;
      case 'priorityBucket.name':
        generatePriority(baseFilter, condition, priorityBuckets);
        break;
      case 'taskAssociation.taskId':
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
      const bucket = priorityBuckets.find(
        priorityBucket => priorityBucket.name === valueIn,
      );
      return bucket;
    })
    .filter((value): value is PriorityBucket => value !== undefined);

  if (filters.priorityBucket && values && values.length > 0) {
    filters.priorityBucket.value = values;
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
      const bucket = jiraUsers.find(jiraUser => jiraUser.name === valueIn);
      return bucket;
    })
    .filter((value): value is JiraUser => value !== undefined);

  if (filters.assignee && values) {
    filters.assignee.value = values;
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
      const label = labels.find(label => label.name === valueIn);
      return label;
    })
    .filter((value): value is LabelType => value !== undefined);

  if (filters.labels && values) {
    filters.labels.operator = searchCondition.condition;
    filters.labels.constraints[0].value.push(...values);
  }
};

const generateSchedule = (
  filters: TicketDataTableFilters,
  searchCondition: SearchCondition,
  schedules: AdditionalFieldTypeOfListType[],
) => {
  const availableSchedules = schedules.filter(aft => {
    return aft.typeName.toLowerCase() === 'schedule';
  })[0].values;

  if (searchCondition.valueIn?.length === 0) {
    return;
  }

  const values = searchCondition.valueIn
    ?.map(valueIn => {
      const schedule = availableSchedules.find(
        schedule => schedule.valueOf === valueIn,
      );
      return schedule;
    })
    .filter((value): value is AdditionalFieldValue => value !== undefined);

  if (filters.schedule && values) {
    filters.schedule.value = values;
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
      const state = states.find(state => state.label === valueIn);
      return state;
    })
    .filter((value): value is State => value !== undefined);

  if (filters.state && values) {
    filters.state.value = values;
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
      const iteration = iterations.find(
        iteration => iteration.name === valueIn,
      );
      return iteration;
    })
    .filter((value): value is Iteration => value !== undefined);

  if (filters.iteration && values) {
    filters.iteration.value = values;
  }
};

const generateTask = (
  filters: TicketDataTableFilters,
  searchCondition: SearchCondition,
  tasks: Task[],
) => {
  if (searchCondition.valueIn?.length === 0) {
    return;
  }
  const searchValue = searchCondition.value;

  const task = tasks.find(task => task.key === searchValue);
  if (filters.taskAssociation && task) {
    filters.taskAssociation.value = task;
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
  'priorityBucket.name': 'priorityBucket',
  'iteration.name': 'iteration',
  'taskAssociation.taskId': 'taskAssociation',
  'state.label': 'state',
  'additionalFieldValues.valueOf': 'schedule',
};
