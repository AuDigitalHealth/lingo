import { useAllTasks } from '../useAllTasks';
import { useJiraUsers } from '../useInitializeJiraUsers';
import {
  useAllExternalRequestors,
  useAllIterations,
  useAllLabels,
  useAllPriorityBuckets,
  useAllSchedules,
  useAllStates,
} from '../useInitializeTickets';
import { useMemo } from 'react';

const emptyValues = {
  label: {
    name: 'Unassigned',
    description: '',
    id: -1,
    created: '',
    createdBy: '',
  },
  externalRequestor: {
    name: 'Unassigned',
    description: '',
    id: -1,
    created: '',
    createdBy: '',
  },
  state: {
    label: 'Unassigned',
    description: '',
    id: -1,
    created: '',
    createdBy: '',
  },
  jiraUser: {
    emailAddress: '',
    displayName: '',
    active: false,
    key: '',
    name: 'Unassigned',
    avatarUrls: {
      '48x48': '',
      '24x24': '',
      '16x16': false,
      '32x32': '',
    },
  },
  priorityBucket: {
    name: 'Unassigned',
    description: '',
    orderIndex: -1,
    id: -1,
    created: '',
    createdBy: '',
  },
  schedule: {
    name: 'Unassigned',
    description: '',
    grouping: -1,
    id: -1,
    created: '',
    createdBy: '',
  },
  iteration: {
    name: 'Unassigned',
    startDate: '',
    active: false,
    completed: false,
    id: -1,
    created: '',
    createdBy: '',
  },
  task: {
    assignee: {
      username: '',
      avatarUrl: '',
      email: '',
      displayName: '',
    },
    branchBaseTimeStamp: -1,
    branchHeadTimeStamp: -1,
    branchPath: '',
    branchState: '',
    created: '',
    description: '',
    feedBackMessageStatus: '',
    key: 'Unassigned',
    projectKey: '',
    reviewers: [],
    summary: '',
    updated: '',
  },
};

type UnassignedItem = {
  name?: string;
  label?: string;
  [key: string]: any;
};

function addUnassignedOption<T extends UnassignedItem>(
  array: T[] | undefined,
  emptyValue: T,
): T[] {
  if (array === undefined) return [];
  if (
    array.length > 0 &&
    array[0].name !== 'Unassigned' &&
    array[0].label !== 'Unassigned'
  ) {
    return [emptyValue, ...array];
  }
  return array;
}

export default function useAllBacklogFields() {
  const { availableStates } = useAllStates();
  const { labels } = useAllLabels();
  const { externalRequestors } = useAllExternalRequestors();
  const { priorityBuckets } = useAllPriorityBuckets();
  const { schedules } = useAllSchedules();
  const { iterations } = useAllIterations();
  const { allTasks } = useAllTasks();
  const { jiraUsers } = useJiraUsers();

  const result = useMemo(() => {
    return {
      availableStates: addUnassignedOption(availableStates, emptyValues.state),
      labels: addUnassignedOption(labels, emptyValues.label),
      externalRequestors: addUnassignedOption(
        externalRequestors,
        emptyValues.externalRequestor,
      ),
      priorityBuckets: addUnassignedOption(
        priorityBuckets,
        emptyValues.priorityBucket,
      ),
      schedules: addUnassignedOption(schedules, emptyValues.schedule),
      iterations: addUnassignedOption(iterations, emptyValues.iteration),
      allTasks: addUnassignedOption(allTasks, emptyValues.task),
      jiraUsers: addUnassignedOption(jiraUsers, emptyValues.jiraUser),
    };
  }, [
    availableStates,
    labels,
    externalRequestors,
    priorityBuckets,
    schedules,
    iterations,
    allTasks,
    jiraUsers,
  ]);

  return result;
}
