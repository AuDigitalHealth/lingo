import { useMutation, useQueryClient } from '@tanstack/react-query';
import TasksServices from '../../../api/TasksService';
import { useAllTasksOptions, updateTaskCache } from './useAllTasks';
import useApplicationConfigStore from '../../../stores/ApplicationConfigStore';
import { enqueueSnackbar } from 'notistack';

interface EditTaskMutationVariables {
  projectKey: string;
  taskKey: string;
  summary: string;
  description: string;
}

export function useEditTaskMutation() {
  const queryClient = useQueryClient();
  const { applicationConfig } = useApplicationConfigStore();
  const queryKey = useAllTasksOptions(applicationConfig).queryKey;

  return useMutation({
    mutationFn: ({
      projectKey,
      taskKey,
      summary,
      description,
    }: EditTaskMutationVariables) => {
      return TasksServices.editTaskDetails(
        projectKey,
        taskKey,
        summary,
        description,
      );
    },
    onSuccess: updatedTask => {
      updateTaskCache(queryClient, queryKey, updatedTask);
      enqueueSnackbar(`Task ${updatedTask.key} updated`, {
        variant: 'success',
        autoHideDuration: 5000,
      });
    },
    onError: (error: Error) => {
      enqueueSnackbar(`Failed to update task: ${error.message}`, {
        variant: 'error',
      });
    },
  });
}
