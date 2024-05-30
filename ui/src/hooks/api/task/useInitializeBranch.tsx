import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Task, TaskStatus } from '../../../types/task.ts';

import { useEffect } from 'react';
import TasksServices from '../../../api/TasksService.ts';
import { BranchCreationRequest } from '../../../types/Project.ts';
import useApplicationConfigStore from '../../../stores/ApplicationConfigStore.ts';
import { snowstormErrorHandler } from '../../../types/ErrorHandler.ts';
import useTaskStore from '../../../stores/TaskStore.ts';
import { useServiceStatus } from '../useServiceStatus.tsx';

export function useFetchAndCreateBranch(task: Task | undefined | null) {
  const { mergeTasks } = useTaskStore();
  const mutation = useCreateBranchAndUpdateTask();
  const queryClient = useQueryClient();
  const { serviceStatus } = useServiceStatus();

  const shouldCall = () => {
    const call =
      task !== undefined &&
      task?.status !== undefined &&
      task?.status !== TaskStatus.Completed &&
      task?.status !== TaskStatus.Deleted &&
      task?.status !== TaskStatus.ReviewCompleted;

    return call;
  };

  const { isLoading, data, error } = useQuery(
    [`fetch-branch-${task ? task.branchPath : undefined}`],
    () => {
      if (task && task.branchPath) {
        return TasksServices.fetchBranchDetails(task.branchPath);
      } else {
        return null;
      }
    },

    {
      staleTime: 20 * (60 * 1000),
      enabled: shouldCall(),
    },
  );
  useEffect(() => {
    if (error && task) {
      mutation.mutate(task);
      const { data } = mutation;
      if (data !== null) {
        void queryClient.invalidateQueries({
          queryKey: [`fetch-branch-${task ? task.branchPath : undefined}`],
        });
      }
    } else {
      if (task && task.status === TaskStatus.New) {
        void TasksServices.updateTaskStatus(
          task.projectKey,
          task.key,
          TaskStatus.InProgress,
        )
          .then(mergeTasks)
          .catch(error => {
            snowstormErrorHandler(
              error,
              'Task status update failed',
              serviceStatus,
            );
          });
      }
    }
  }, [error, data]);
  return { isLoading };
}

export const useCreateBranchAndUpdateTask = () => {
  const { mergeTasks } = useTaskStore();
  const { serviceStatus } = useServiceStatus();
  const mutation = useMutation({
    mutationFn: (task: Task) => {
      let parentBranch =
        useApplicationConfigStore.getState().applicationConfig?.apDefaultBranch;
      if (task.branchPath && task.branchPath.includes(task.key)) {
        parentBranch = task.branchPath.substring(
          0,
          task.branchPath.indexOf(`/${task.key}`),
        ); //in case parent branch is different from default branch
      }
      const request: BranchCreationRequest = {
        parent: parentBranch,
        name: task.key,
      };
      if (task && task.status === TaskStatus.New) {
        void TasksServices.updateTaskStatus(
          task.projectKey,
          task.key,
          TaskStatus.InProgress,
        )
          .then(mergeTasks)
          .catch(error => {
            snowstormErrorHandler(
              error,
              'Task status update failed',
              serviceStatus,
            );
          });
      }

      return TasksServices.createBranchForTask(request);
    },
  });
  const { error } = mutation;
  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Branch creation failed', serviceStatus);
    }
  }, [error]);

  return mutation;
};
