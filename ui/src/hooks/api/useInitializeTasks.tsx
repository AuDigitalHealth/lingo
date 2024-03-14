import { useQuery } from '@tanstack/react-query';
import useTaskStore from '../../stores/TaskStore';
import TasksServices from '../../api/TasksService';
import { useMemo } from 'react';
import ApplicationConfig from '../../types/applicationConfig';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore';

export default function useInitializeTasks() {
  const { applicationConfig } = useApplicationConfigStore();
  const { allTasksIsLoading } = useInitializeAllTasks(applicationConfig);

  return { tasksLoading: allTasksIsLoading };
}

export function useInitializeAllTasks(
  applicationConfig: ApplicationConfig | null,
) {
  const { setAllTasks } = useTaskStore();
  const { isLoading, data, isError } = useQuery(
    [`all-tasks-${applicationConfig?.apProjectKey}`],
    () => {
      return TasksServices.getAllTasks(applicationConfig?.apProjectKey);
    },
    { staleTime: 1 * (60 * 1000), refetchInterval: 1 * (60 * 1000) },
  );

  useMemo(() => {
    if (data) {
      setAllTasks(data);
    }
  }, [data, setAllTasks]);

  const allTasksIsLoading: boolean = isLoading;
  const allTasksData = data;

  return { allTasksIsLoading, allTasksData, isError };
}


/* ECL Refset Tool - intialize tasks that user is an owner/reviewer of (across all projects) */

export function useInitializeUserTasks() {
  const { setUserTasks } = useTaskStore();
  const { isLoading, data, isError } = useQuery(
    [`user-tasks`],
    () => {
      return TasksServices.getUserTasks();
    },
    { staleTime: 1 * (60 * 1000), refetchInterval: 1 * (60 * 1000) },
  );

  useMemo(() => {
    if (data) {
      setUserTasks(data);
    }
  }, [data, setUserTasks]);

  const userTasksIsLoading: boolean = isLoading;
  const userTasksData = data;

  return { userTasksIsLoading, userTasksData, isError };
}

export function useInitializeUserReviewTasks() {
  const { setUserReviewTasks } = useTaskStore();
  const { isLoading, data, isError } = useQuery(
    [`user-review-tasks`],
    () => {
      return TasksServices.getUserReviewTasks();
    },
    { staleTime: 1 * (60 * 1000), refetchInterval: 1 * (60 * 1000) },
  );

  useMemo(() => {
    if (data) {
      setUserReviewTasks(data);
    }
  }, [data, setUserReviewTasks]);

  const userReviewTasksIsLoading: boolean = isLoading;
  const userReviewTasksData = data;

  return { userReviewTasksIsLoading, userReviewTasksData, isError };
}