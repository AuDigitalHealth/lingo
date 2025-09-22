import { useMutation, useQueryClient } from '@tanstack/react-query';
import TasksServices from '../../../api/TasksService';

interface AutoPromoteTaskParams {
  projectKey: string;
  taskKey: string;
}

export function useAutoPromoteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectKey, taskKey }: AutoPromoteTaskParams) => {
      return await TasksServices.autoPromote(projectKey, taskKey);
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['task', variables.projectKey, variables.taskKey],
      });
      void queryClient.invalidateQueries({
        queryKey: ['task-activities', data.branchPath],
      });
    },
    onError: error => {
      console.error('Auto promote task failed:', error);
    },
  });
}
