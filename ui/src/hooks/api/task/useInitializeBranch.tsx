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
  const updateTaskMutation = useUpdatedTaskStatus();
  const createBranchMutation = useCreateBranch(task);

  const { data: branchData, isLoading: branchMutationLoading } =
    createBranchMutation;
  const { data: taskMutationData, isLoading: taskMutationLoading } =
    updateTaskMutation;

  const shouldCall = () => {
    const call =
      task !== undefined &&
      task?.status !== undefined &&
      task?.status !== TaskStatus.Completed &&
      task?.status !== TaskStatus.Deleted &&
      task?.status !== TaskStatus.ReviewCompleted;

    return call;
  };

  const { isLoading, error } = useQuery(
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
      // don't keep retrying, as the cache will be cleared when the branch is created, which will cause a refresh.
      retry: false,
    },
  );
  useEffect(() => {
    // if there is an error, it means the branch wasn't found and therefore it needs to be created.
    // this should only be done if the task.branchState is null (non existant) and the mutation isn't currently being called
    // AND the mutationData is undefined, i.e hasn't been been called before

    if (
      error &&
      task &&
      task.branchState === null &&
      !branchMutationLoading &&
      !branchData
    ) {
      createBranchMutation.mutate(task);
    }

    if (
      task &&
      task.status === TaskStatus.New &&
      !taskMutationLoading &&
      !taskMutationData
    ) {
      updateTaskMutation.mutate(task);
    }
  }, [
    error,
    branchData,
    task,
    branchMutationLoading,
    taskMutationLoading,
    taskMutationData,
    createBranchMutation,
    updateTaskMutation,
  ]);
  return {
    isLoading: isLoading || branchMutationLoading || taskMutationLoading,
  };
}

export const useUpdatedTaskStatus = () => {
  const { serviceStatus } = useServiceStatus();
  const { mergeTasks } = useTaskStore();
  const updateTaskMutation = useMutation({
    mutationFn: (task: Task) => {
      return TasksServices.updateTaskStatus(
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
    },
  });
  const { error } = updateTaskMutation;

  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Error updating task status', serviceStatus);
    }
  }, [error, serviceStatus]);

  return updateTaskMutation;
};

export const useCreateBranch = (task: Task | undefined | null) => {
  const { serviceStatus } = useServiceStatus();
  const queryClient = useQueryClient();

  const createBranchMutation = useMutation({
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

      return TasksServices.createBranchForTask(request);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [`fetch-branch-${task ? task.branchPath : undefined}`],
      });
    },
  });
  const { error } = createBranchMutation;
  useEffect(() => {
    if (error) {
      snowstormErrorHandler(error, 'Branch creation failed', serviceStatus);
    }
  }, [error, serviceStatus]);

  return createBranchMutation;
};
