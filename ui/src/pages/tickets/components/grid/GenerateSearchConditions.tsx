import { FilterMatchMode } from 'primereact/api';
import { LazyTableState } from '../../TicketsBacklog';

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
  lazyState: LazyTableState,
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

  if (filters.assignee?.value) {
    const assigneeCondition: SearchCondition = {
      key: 'assignee',
      operation: '=',
      condition: 'and',
      valueIn: [],
    };

    filters.assignee?.value?.forEach(user => {
      if (user.name.toLocaleLowerCase() === 'unassigned') {
        assigneeCondition.valueIn?.push('null');
      } else {
        assigneeCondition.valueIn?.push(user.name);
      }
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

  if (filters.state?.value) {
    const stateCondition: SearchCondition = {
      key: 'state.label',
      operation: '=',
      condition: 'and',
      valueIn: [],
    };
    filters.state?.value?.forEach(state => {
      stateCondition.valueIn?.push(state.label);
    });
    searchConditions.push(stateCondition);
  }

  if (filters.iteration?.value) {
    const iterationCondition: SearchCondition = {
      key: 'iteration.name',
      operation: '=',
      condition: 'and',
      valueIn: [],
    };
    filters.iteration?.value?.forEach(iteration => {
      iterationCondition.valueIn?.push(iteration.name);
    });

    searchConditions.push(iterationCondition);
  }

  if (filters.schedule?.value) {
    const scheduleCondition: SearchCondition = {
      key: 'additionalFieldValues.valueOf',
      operation: '=',
      condition: 'and',
      // value: filters.schedule?.value.valueOf,
      valueIn: [],
    };
    filters.schedule?.value?.forEach(schedule => {
      scheduleCondition.valueIn?.push(schedule.valueOf);
    });
    searchConditions.push(scheduleCondition);
  }

  if (filters.priorityBucket?.value) {
    const priorityCondition: SearchCondition = {
      key: 'priorityBucket.name',
      operation: '=',
      condition: 'and',
      // value: filters.priorityBucket?.value.name,
      valueIn: [],
    };
    filters.priorityBucket?.value?.forEach(priority => {
      priorityCondition.valueIn?.push(priority.name);
    });
    searchConditions.push(priorityCondition);
  }

  if (filters.taskAssociation?.value) {
    const taskAssocationCondition: SearchCondition = {
      key: 'taskAssociation.taskId',
      operation: '=',
      condition: 'and',
      value: filters.taskAssociation?.value.key,
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

export const generateOrderCondition = (lazyState: LazyTableState) => {
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
  schedule: 'additionalFieldValues.valueOf',
};
