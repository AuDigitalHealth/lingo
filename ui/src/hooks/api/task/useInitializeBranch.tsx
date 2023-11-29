import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Task, TaskStatus } from '../../../types/task.ts';

import { useEffect } from 'react';
import TasksServices from '../../../api/TasksService.ts';
import { BranchCreationRequest } from '../../../types/Project.ts';
import useApplicationConfigStore from '../../../stores/ApplicationConfigStore.ts';
import { errorHandler } from '../../../types/ErrorHandler.ts';
import useTaskStore from '../../../stores/TaskStore.ts';

export function useFetchAndCreateBranch(task: Task) {
  const { mergeTasks } = useTaskStore();
  const mutation = useCreateBranchAndUpdateTask();
  const queryClient = useQueryClient();

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
      enabled:
        task &&
        task.status !== TaskStatus.Completed &&
        task.status !== TaskStatus.Deleted &&
        task.status !== TaskStatus.ReviewCompleted,
    },
  );
  useEffect(() => {
    if (error) {
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
            errorHandler(error, 'Task status update failed');
          });
      }
    }
  }, [error, data]);
  return { isLoading };
}

export const useCreateBranchAndUpdateTask = () => {
  const { mergeTasks } = useTaskStore();
  const mutation = useMutation({
    mutationFn: (task: Task) => {
      let parentBranch = useApplicationConfigStore.getState().applicationConfig
        ?.apDefaultBranch as string;
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
            errorHandler(error, 'Task status update failed');
          });
      }

      return TasksServices.createBranchForTask(request);
    },
  });
  const { error } = mutation;
  useEffect(() => {
    if (error) {
      errorHandler(error, 'Branch creation failed');
    }
  }, [error]);

  return mutation;
};
