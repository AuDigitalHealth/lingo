import {
  QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import useTaskStore from '../../stores/TaskStore';
import TasksServices from '../../api/TasksService';
import { useMemo } from 'react';
import ApplicationConfig from '../../types/applicationConfig';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore';
import { Task, UserDetails } from '../../types/task';
import { enqueueSnackbar } from 'notistack';
import { authoringPlatformErrorHandler } from '../../types/ErrorHandler';
import { useServiceStatus } from './useServiceStatus';

export default function useInitializeTasks() {
  const { allTasksIsLoading } = useAllTasks();

  return { tasksLoading: allTasksIsLoading };
}

export const useAllTasksOptions = (
  applicationConfig: ApplicationConfig | null,
) => {
  const queryKey = [`all-tasks-${applicationConfig?.apProjectKey}`];
  return queryOptions({
    queryKey,
    queryFn: () => TasksServices.getAllTasks(applicationConfig?.apProjectKey),
    staleTime: 1 * (60 * 1000),
    refetchInterval: 1 * (60 * 1000),
  });
};

export function getTaskById(
  taskId: string | undefined,
  allTasks: Task[] | undefined,
) {
  if (taskId === undefined || allTasks === undefined) return null;

  let tasks = allTasks;

  tasks = tasks?.filter(task => {
    return task.key === taskId;
  });

  return tasks.length === 1 ? tasks[0] : null;
}

export function useUpdateTask(context: string) {
  const queryClient = useQueryClient();
  const { applicationConfig } = useApplicationConfigStore();
  const { serviceStatus } = useServiceStatus();
  const queryKey = useAllTasksOptions(applicationConfig).queryKey;
  const mutation = useMutation({
    mutationFn: (updateData: {
      projectKey?: string;
      taskKey?: string;
      assignee?: UserDetails;
      reviewers: UserDetails[];
    }) => {
      const { projectKey, taskKey, assignee, reviewers } = updateData;
      enqueueSnackbar(`Updating ${context} for task ${taskKey}`, {
        variant: 'success',
        autoHideDuration: 5000,
      });

      return TasksServices.updateTask(projectKey, taskKey, assignee, reviewers);
    },
    onSuccess: updatedTask => {
      enqueueSnackbar(`Updated ${context} for task ${updatedTask.key}`, {
        variant: 'success',
        autoHideDuration: 5000,
      });

      updateTaskCache(queryClient, queryKey, updatedTask);
    },
    onError: (_, args) => {
      authoringPlatformErrorHandler(
        _,
        `Update ${context} failed for task ${args.projectKey} with error ${_.message}`,
        serviceStatus?.authoringPlatform.running,
      );
    },
  });

  return mutation;
}

export function updateTaskCache(
  queryClient: QueryClient,
  queryKey: unknown[],
  updatedTask: Task,
) {
  queryClient.setQueryData(queryKey, (oldData: Task[] | undefined) => {
    if (!oldData) return [updatedTask];

    return oldData.map(task =>
      task?.key === updatedTask?.key ? updatedTask : task,
    );
  });
}

export function useAllTasks() {
  const { applicationConfig } = useApplicationConfigStore();
  const { isLoading, data, isError } = useQuery({
    ...useAllTasksOptions(applicationConfig),
    staleTime: 1 * (60 * 1000),
    refetchInterval: 1 * (60 * 1000),
  });

  const allTasksIsLoading: boolean = isLoading;
  const allTasks = data;

  return { allTasksIsLoading, allTasks, isError };
}

/* ECL Refset Tool - intialize tasks that user is an owner/reviewer of (across all projects) */

export function useInitializeUserTasks() {
  const { setUserTasks } = useTaskStore();
  const { isLoading, data, isError } = useQuery({
    queryKey: [`user-tasks`],
    queryFn: () => {
      return TasksServices.getUserTasks(true);
    },
    staleTime: 1 * (60 * 1000),
    refetchInterval: 1 * (60 * 1000),
  });

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
  const { isLoading, data, isError } = useQuery({
    queryKey: [`user-review-tasks`],
    queryFn: () => {
      return TasksServices.getUserReviewTasks(true);
    },
    staleTime: 1 * (60 * 1000),
    refetchInterval: 1 * (60 * 1000),
  });

  useMemo(() => {
    if (data) {
      setUserReviewTasks(data);
    }
  }, [data, setUserReviewTasks]);

  const userReviewTasksIsLoading: boolean = isLoading;
  const userReviewTasksData = data;

  return { userReviewTasksIsLoading, userReviewTasksData, isError };
}
