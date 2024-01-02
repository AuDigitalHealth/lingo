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
      assigneeCondition.valueIn?.push(user.name);
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
      value: filters.state?.value.label,
    };
    searchConditions.push(stateCondition);
  }

  if (filters.state?.value) {
    const stateCondition: SearchCondition = {
      key: 'state.label',
      operation: '=',
      condition: 'and',
      value: filters.state?.value.label,
    };
    searchConditions.push(stateCondition);
  }

  if (filters.iteration?.value) {
    const iterationCondition: SearchCondition = {
      key: 'iteration.name',
      operation: '=',
      condition: 'and',
      value: filters.iteration?.value.name,
    };
    searchConditions.push(iterationCondition);
  }

  if (filters.schedule?.value) {
    const scheduleCondition: SearchCondition = {
      key: 'additionalFieldValues.valueOf',
      operation: '=',
      condition: 'and',
      value: filters.schedule?.value.valueOf,
    };
    searchConditions.push(scheduleCondition);
  }

  if (filters.priorityBucket?.value) {
    const priorityCondition: SearchCondition = {
      key: 'priorityBucket.name',
      operation: '=',
      condition: 'and',
      value: filters.priorityBucket?.value.name,
    };
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
    const after = filters.created?.value[0];
    const before = filters.created?.value[1];
    let value = after.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });

    if (before !== null && before !== undefined) {
      value += '-';
      value += before.toLocaleDateString('en-AU', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });
    }

    const createdCondition: SearchCondition = {
      key: 'created',
      operation: '=',
      condition: 'and',
      value: value,
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
};
