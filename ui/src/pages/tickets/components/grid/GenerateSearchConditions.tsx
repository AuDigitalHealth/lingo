import { FilterMatchMode } from 'primereact/api';
import { LazyTicketTableState } from '../../../../types/tickets/table';
import {
  OrderCondition,
  SearchCondition,
  SearchConditionBody,
} from '../../../../types/tickets/search';

export const generateGlobalSearchConditions = (globalFilterValue: string) => {
  if (globalFilterValue === '') return undefined;
  const searchConditions: SearchCondition[] = [];
  const titleCondition: SearchCondition = {
    key: 'title',
    operation: '=',
    condition: 'or',
    value: globalFilterValue,
  };
  searchConditions.push(titleCondition);

  const commentsCondition: SearchCondition = {
    key: 'comments.text',
    operation: '=',
    condition: 'or',
    value: globalFilterValue,
  };
  searchConditions.push(commentsCondition);
  return searchConditions;
};

export const generateSearchConditions = (
  lazyState: LazyTicketTableState,
  globalFilterValue: string,
) => {
  const filters = lazyState.filters;
  let searchConditions: SearchCondition[] = [];
  const orderConditions = generateOrderCondition(lazyState);
  const globalSearchConditions: SearchCondition[] | undefined =
    generateGlobalSearchConditions(globalFilterValue);

  if (globalSearchConditions !== undefined) {
    searchConditions = [...searchConditions, ...globalSearchConditions];
  }
  const returnSearchConditionsBody: SearchConditionBody = {
    searchConditions: searchConditions,
    orderCondition: orderConditions,
  };

  if (filters.title?.value) {
    const titleCondition: SearchCondition = {
      key: 'title',
      operation: '=',
      condition: 'and',
      value: filters.title?.value,
    };
    searchConditions.push(titleCondition);
  }

  if (filters.assignee?.value && filters.assignee?.value.length > 0) {
    const assigneeCondition: SearchCondition = {
      key: 'assignee',
      operation: '=',
      condition: 'and',
      valueIn: [],
    };

    filters.assignee?.value?.forEach(user => {
      assigneeCondition.valueIn?.push(returnNullIfUnassignedOrValue(user.name));
    });
    searchConditions.push(assigneeCondition);
  }

  if (filters.labels?.constraints[0]) {
    const labelCondition: SearchCondition = {
      key: 'labels.name',
      operation: '=',
      condition: filters.labels.operator,
      valueIn: [],
    };

    filters.labels?.constraints.forEach(constraint => {
      const labels: string[] = [];

      constraint.value?.forEach(label => {
        labels.push(label.name);
      });
      if (labels.length > 0) {
        labelCondition.valueIn = labels;
        searchConditions.push(labelCondition);
      }
    });
  }
  if (filters.externalRequestors?.constraints[0]) {
    const externalRequestorCondition: SearchCondition = {
      key: 'externalRequestors.name',
      operation: '=',
      condition: filters.externalRequestors.operator,
      valueIn: [],
    };

    filters.externalRequestors?.constraints.forEach(constraint => {
      const externalRequestors: string[] = [];

      constraint.value?.forEach(label => {
        externalRequestors.push(label.name);
      });
      if (externalRequestors.length > 0) {
        externalRequestorCondition.valueIn = externalRequestors;
        searchConditions.push(externalRequestorCondition);
      }
    });
  }

  if (filters.state?.value && filters.state?.value.length > 0) {
    const stateCondition: SearchCondition = {
      key: 'state.label',
      operation: '=',
      condition: 'and',
      valueIn: [],
    };
    filters.state?.value?.forEach(state => {
      stateCondition.valueIn?.push(returnNullIfUnassignedOrValue(state.label));
    });
    searchConditions.push(stateCondition);
  }

  if (filters.iteration?.value && filters.iteration?.value.length > 0) {
    const iterationCondition: SearchCondition = {
      key: 'iteration.name',
      operation: '=',
      condition: 'and',
      valueIn: [],
    };
    filters.iteration?.value?.forEach(iteration => {
      iterationCondition.valueIn?.push(
        returnNullIfUnassignedOrValue(iteration.name),
      );
    });

    searchConditions.push(iterationCondition);
  }

  if (filters.schedule?.value && filters.schedule?.value.length > 0) {
    const scheduleCondition: SearchCondition = {
      key: 'schedule.name',
      operation: '=',
      condition: 'and',
      // value: filters.schedule?.value.valueOf,
      valueIn: [],
    };
    filters.schedule?.value?.forEach(schedule => {
      scheduleCondition.valueIn?.push(
        returnNullIfUnassignedOrValue(schedule.name),
      );
    });
    searchConditions.push(scheduleCondition);
  }

  if (
    filters.priorityBucket?.value &&
    filters.priorityBucket?.value.length > 0
  ) {
    const priorityCondition: SearchCondition = {
      key: 'priorityBucket.name',
      operation: '=',
      condition: 'and',
      // value: filters.priorityBucket?.value.name,
      valueIn: [],
    };
    filters.priorityBucket?.value?.forEach(priority => {
      priorityCondition.valueIn?.push(
        returnNullIfUnassignedOrValue(priority.name),
      );
    });
    searchConditions.push(priorityCondition);
  }

  if (filters.taskAssociation?.value) {
    const taskAssocationCondition: SearchCondition = {
      key:
        filters.taskAssociation?.value.key.toLowerCase() !== UNASSIGNED_VALUE
          ? 'taskAssociation.taskId'
          : 'taskAssociation',
      operation: '=',
      condition: 'and',
      value: returnNullIfUnassignedOrValue(filters.taskAssociation?.value.key),
    };
    searchConditions.push(taskAssocationCondition);
  }

  if (filters.created?.value) {
    let first = filters.created?.value;

    let setValue = '';

    if (Array.isArray(first)) {
      const firstArray = first;
      first = firstArray[0];
      const second = firstArray[1];

      let value = first.toLocaleDateString('en-AU', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });

      if (second !== null && second !== undefined) {
        value += '-';
        value += second.toLocaleDateString('en-AU', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        });
      }

      setValue = value;
    } else {
      const value = first.toLocaleDateString('en-AU', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });

      setValue = value;
    }

    let operator =
      filters.created.matchMode === FilterMatchMode.DATE_BEFORE ? '<=' : '=';
    operator =
      filters.created.matchMode === FilterMatchMode.DATE_IS_NOT
        ? '!='
        : operator;
    operator =
      filters.created.matchMode === FilterMatchMode.DATE_AFTER
        ? '>='
        : operator;
    const createdCondition: SearchCondition = {
      key: 'created',
      operation: operator,
      condition: 'and',
      value: setValue,
    };
    searchConditions.push(createdCondition);
  }
  returnSearchConditionsBody.searchConditions = searchConditions;
  return returnSearchConditionsBody;
};

export const generateOrderCondition = (lazyState: LazyTicketTableState) => {
  if (
    lazyState.sortField !== undefined &&
    lazyState.sortField !== '' &&
    lazyState.sortOrder !== null &&
    lazyState.sortOrder !== undefined
  ) {
    const field = Object.prototype.hasOwnProperty.call(
      mappedFields,
      lazyState.sortField,
    )
      ? mappedFields[lazyState.sortField]
      : lazyState.sortField;
    const orderCondition: OrderCondition = {
      fieldName: field,
      order: lazyState.sortOrder,
    };
    return orderCondition;
  }
  return undefined;
};

type MappedFields = {
  [key: string]: string;
};

const mappedFields: MappedFields = {
  priorityBucket: 'priorityBucket.name',
  iteration: 'iteration.name',
  taskAssociation: 'taskAssociation.taskId',
  state: 'state.label',
  schedule: 'schedule.grouping',
};

export const UNASSIGNED_VALUE = 'unassigned';

const returnNullIfUnassignedOrValue = (str: string): string => {
  if (isUnassignedValue(str)) return 'null';
  return str;
};
const isUnassignedValue = (str: string) => {
  return str.toLocaleLowerCase() === UNASSIGNED_VALUE;
};
