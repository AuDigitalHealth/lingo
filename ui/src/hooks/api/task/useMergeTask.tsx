import { useMutation, useQueryClient } from '@tanstack/react-query';
import ConceptService from '../../../api/ConceptService';
import useApplicationConfigStore from '../../../stores/ApplicationConfigStore';
import { updateTaskCache, useAllTasksOptions } from './useAllTasks';
import { Task } from '../../../types/task.ts';
import { enqueueSnackbar } from 'notistack';

interface MergeTaskParams {
  projectKey: string;
  taskKey: string;
  task: Task;
}

export function useMergeTask() {
  const queryClient = useQueryClient();
  const { applicationConfig } = useApplicationConfigStore();
  const queryKey = useAllTasksOptions(applicationConfig).queryKey;
  return useMutation({
    mutationFn: async ({ projectKey, taskKey, task }: MergeTaskParams) => {
      return await ConceptService.mergeTask(projectKey, taskKey, task);
    },
    onSuccess: (data, variables) => {
      updateTaskCache(queryClient, queryKey, data);
    },
    onError: error => {
      enqueueSnackbar(
        'Auto merge task failed, please do it in the authoring platform',
        { variant: 'error' },
      );
    },
  });
}

interface IntegrityCheckParams {
  taskBranch: string;
}

export function useIntegrityCheck() {
  return useMutation({
    mutationFn: async ({ taskBranch }: IntegrityCheckParams) => {
      return await ConceptService.integrityCheck(taskBranch);
    },
    onSuccess: data => {
      if (!data.empty) {
        enqueueSnackbar(
          'Branch integrity check failed after merge, please resolve in the authoring platform',
          { variant: 'error' },
        );
      }
    },
  });
}
